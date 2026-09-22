import csv
import io
import json
from pathlib import Path
import stat
import threading
import time
import uuid
import zipfile

import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.api.config import Settings
from app.api.database import Database, Scan
from app.api.service import now
from app.scanner.engine import ScannerEngine

DEMO = Path(__file__).resolve().parents[2] / "demo_repository"


@pytest.fixture
def settings(tmp_path):
    repositories = tmp_path / "repositories"
    repositories.mkdir()
    return Settings(data_dir=tmp_path / "data", allowed_roots=[repositories], demo_dir=DEMO)


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        yield client


def poll(client, scan_id):
    deadline = time.monotonic() + 20
    observed = []
    while time.monotonic() < deadline:
        response = client.get(f"/api/scan/{scan_id}")
        assert response.status_code == 200
        status = response.json()
        observed.append(status)
        if status["status"] in ("COMPLETED", "FAILED"):
            return status, observed
        time.sleep(0.01)
    pytest.fail("Real scan did not complete within 20 seconds")


def demo_scan(client):
    response = client.post("/api/scan/demo")
    assert response.status_code == 202, response.text
    scan_id = response.json()["scan_id"]
    status, _ = poll(client, scan_id)
    assert status["status"] == "COMPLETED", status
    return scan_id


def archive(entries):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as z:
        for name, content in entries:
            z.writestr(name, content)
    return stream.getvalue()


def test_startup_openapi_cors(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/docs").status_code == 200
    schema = client.get("/openapi.json").json()
    assert "/api/scan/upload" in schema["paths"]
    response = client.options("/api/scan/demo", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    response = client.options("/api/scan/demo", headers={"Origin": "http://untrusted.example", "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in response.headers


def test_real_api_end_to_end(client):
    scan_id = demo_scan(client)
    status = client.get(f"/api/scan/{scan_id}").json()
    summary = client.get(f"/api/summary/{scan_id}").json()
    findings = client.get(f"/api/findings/{scan_id}").json()["findings"]
    cbom = client.get(f"/api/cbom/{scan_id}").json()
    migration = client.get(f"/api/migration/{scan_id}").json()
    graph = client.get(f"/api/graph/{scan_id}").json()
    # Independent direct discovery, no fabricated ScannerFinding objects.
    actual = ScannerEngine().scan_directory(str(DEMO))
    expected = {(Path(f.file_path).relative_to(DEMO).as_posix(), f.line_number, f.algorithm, f.operation_type.value) for f in actual}
    obtained = {(f["file"], f["line"], f["algorithm"], f["operation_type"]) for f in findings}
    assert obtained == expected
    assert summary["total_findings"] == len(actual) == len(findings) == len(cbom["components"])
    assert summary["current_critical_findings"] == sum(f["severity"] == "critical" and f["current_security"] in ("broken", "deprecated") for f in findings)
    assert summary["quantum_migration_concerns"] == sum(f["quantum_status"] in ("vulnerable", "migration_concern") for f in findings)
    assert status["files_scanned"] == status["total_files"] == summary["files_scanned"]
    assert summary["scan_duration_seconds"] > 0 and status["completed_at"]
    assert set(summary["languages_detected"]) == {"python", "javascript", "java"}
    assert sum(summary["algorithm_distribution"].values()) == len(findings)
    for f in findings:
        assert f["code_snippet"].splitlines()[0].strip() == (DEMO / f["file"]).read_text().splitlines()[f["line"]-1].strip()
        assert f["policy_rule_id"] and f["policy_source"] and f["migration_recommendation"]
        mitigation = f["migration_recommendation"]["mitigation"]
        assert mitigation["immediate_action"] and mitigation["interim_controls"] and mitigation["validation_step"]
    md5 = next(f for f in findings if f["algorithm"].lower() == "md5")
    rsa = next(f for f in findings if f["algorithm"] == "RSA" and f["key_size"] == 2048 and f["operation_type"] == "signature")
    aes = next(f for f in findings if f["algorithm"] == "AES" and f["key_size"] == 256 and f["mode"] == "GCM")
    assert md5["current_security"] == "broken"
    assert "Immediate remediation" in md5["migration_recommendation"]["mitigation"]["immediate_action"]
    assert rsa["current_security"] == "acceptable" and rsa["quantum_status"] == "vulnerable"
    assert "ML-DSA" in rsa["migration_recommendation"]["suggested_direction"] and rsa["mosca"]["is_demo_assumption"]
    assert aes["current_security"] == "strong" and aes["quantum_status"] == "low_concern"
    assert "No urgent cryptographic replacement" in aes["migration_recommendation"]["mitigation"]["immediate_action"]
    assert client.get(f"/api/findings/{scan_id}/{rsa['id']}").json() == rsa
    assert client.get(f"/api/findings/{scan_id}?limit=1&offset=1").json()["findings"] == findings[1:2]
    assert sum(g["count"] for g in migration["groups"]) == len(findings)
    assert {f["id"] for g in migration["groups"] for f in g["findings"]} == {f["id"] for f in findings}
    assert any(f["id"] == md5["id"] for f in migration["groups"][0]["findings"])
    nodes = {n["id"] for n in graph["nodes"]}
    assert len([n for n in graph["nodes"] if n["type"] == "crypto"]) == len(findings)
    assert all(e["source"] in nodes and e["target"] in nodes for e in graph["edges"])
    assert len(graph["edges"]) == len(graph["nodes"]) - 1
    json_export = client.get(f"/api/export/{scan_id}?format=json")
    assert json_export.json() == cbom
    csv_export = client.get(f"/api/export/{scan_id}?format=csv")
    rows = list(csv.DictReader(io.StringIO(csv_export.text)))
    assert len(rows) == len(findings) and "attachment" in csv_export.headers["content-disposition"]
    assert {r["bom_ref"] for r in rows} == {c["bom_ref"] for c in cbom["components"]}


@pytest.mark.parametrize("endpoint", ["scan", "summary", "findings", "cbom", "graph", "migration", "export"])
def test_nonexistent_id(client, endpoint):
    assert client.get(f"/api/{endpoint}/{uuid.uuid4()}").status_code == 404
    assert client.get(f"/api/{endpoint}/invalid").status_code == 422


def test_nonexistent_finding_and_invalid_format(client):
    scan_id = demo_scan(client)
    assert client.get(f"/api/findings/{scan_id}/{uuid.uuid4()}").status_code == 404
    assert client.get(f"/api/export/{scan_id}?format=xml").status_code == 422


@pytest.mark.parametrize("name", ["../escape.py", "/absolute.py", "C:/escape.py", "folder/../../escape.py", "folder\\escape.py", "file.py:stream", "CON.py", "folder./file.py"])
def test_unsafe_zip_rejected(client, settings, name):
    normalized = name.replace("\\", "/")
    payload = archive([(normalized, "import hashlib")]).replace(normalized.encode(), name.encode())
    response = client.post("/api/scan/upload", files={"file": ("unsafe.zip", payload, "application/zip")})
    assert response.status_code == 400, response.text
    assert list((settings.data_dir / "jobs").glob("scan-*")) == []


def test_zip_symlink_rejected(client):
    entry = zipfile.ZipInfo("link.py")
    entry.create_system = 3
    entry.external_attr = (stat.S_IFLNK | 0o777) << 16
    response = client.post("/api/scan/upload", files={"file": ("link.zip", archive([(entry, "../target.py")]))})
    assert response.status_code == 400


@pytest.mark.parametrize("data", [b"not a zip", archive([]), archive([("readme.txt", "unsupported")]), archive([("a.py", "x"), ("A.py", "x")])])
def test_invalid_empty_duplicate_zip(client, data):
    assert client.post("/api/scan/upload", files={"file": ("x.zip", data)}).status_code == 400


def test_zip_limits(client, settings):
    settings.max_file_bytes = 32
    assert client.post("/api/scan/upload", files={"file": ("x.zip", archive([("a.py", "x"*33)]))}).status_code == 400
    settings.max_upload_bytes = 32
    assert client.post("/api/scan/upload", files={"file": ("x.zip", b"x"*33)}).status_code == 413
    assert client.post("/api/scan/upload", content=b"x", headers={"content-length": "999999999"}).status_code == 413


def test_chunked_upload_limit(settings):
    settings.max_upload_bytes = 32
    with TestClient(create_app(settings)) as client:
        def chunks():
            yield b'--test\r\nContent-Disposition: form-data; name="file"; filename="x.zip"\r\nContent-Type: application/zip\r\n\r\n'
            for _ in range(20):
                yield b"x" * 8192
            yield b"\r\n--test--\r\n"
        response = client.post("/api/scan/upload", content=chunks(), headers={"content-type": "multipart/form-data; boundary=test"})
        assert response.status_code == 413, response.text


def test_supported_repository_with_zero_findings(client):
    response = client.post("/api/scan/upload", files={"file": ("plain.zip", archive([("app.py", "print('hello')")]))})
    scan_id = response.json()["scan_id"]
    assert poll(client, scan_id)[0]["status"] == "COMPLETED"
    summary = client.get(f"/api/summary/{scan_id}").json()
    assert summary["total_findings"] == 0 and summary["files_scanned"] == 1


def test_custom_context_reaches_api_roadmap(client):
    response = client.post("/api/scan/demo", json={"context": {
        "data_lifetime_years": 10, "migration_time_years": 6, "threat_horizon_years": 15,
        "business_criticality": "critical", "is_demo_assumption": True}})
    scan_id = response.json()["scan_id"]
    assert poll(client, scan_id)[0]["status"] == "COMPLETED"
    findings = client.get(f"/api/findings/{scan_id}").json()["findings"]
    rsa = next(f for f in findings if f["algorithm"] == "RSA" and f["key_size"] == 2048)
    assert rsa["mosca_priority"] == "ACT_NOW" and rsa["migration_priority"] == "immediate"
    assert rsa["mosca"]["migration_urgency"] == 1


def test_real_zip_scan_never_executes_and_redacts(client, settings):
    marker = settings.data_dir / "MUST_NOT_EXIST"
    content = f'from pathlib import Path\nPath({str(marker)!r}).write_text("executed")\nimport hashlib\nhashlib.md5(b"demo")'
    private = 'import hashlib\nkey = """-----BEGIN PRIVATE KEY-----\nSECRET_PRIVATE_KEY_BYTES\n-----END PRIVATE KEY-----"""\nhashlib.sha256(key.encode())'
    response = client.post("/api/scan/upload", files={"file": ("real.zip", archive([("nested/app.py", content), ("key.py", private)]))})
    assert response.status_code == 202, response.text
    scan_id = response.json()["scan_id"]
    status, _ = poll(client, scan_id)
    assert status["status"] == "COMPLETED", status
    assert not marker.exists()
    for endpoint in ("findings", "cbom", "migration", "export"):
        response = client.get(f"/api/{endpoint}/{scan_id}")
        assert "SECRET_PRIVATE_KEY_BYTES" not in response.text
    assert "SECRET_PRIVATE_KEY_BYTES" not in client.get(f"/api/export/{scan_id}?format=csv").text
    findings = client.get(f"/api/findings/{scan_id}").json()["findings"]
    assert any(f["algorithm"] == "md5" and f["current_security"] == "broken" for f in findings)
    assert any("REDACTED" in f["code_snippet"] for f in findings)


def test_local_path_policy_and_failure_isolation(client, settings, tmp_path):
    assert client.post("/api/scan", json={"repository_path": str(tmp_path)}).status_code == 400
    assert client.post("/api/scan", json={"repository_path": str(settings.allowed_roots[0]/"missing")}).status_code == 400
    path = settings.allowed_roots[0]
    response = client.post("/api/scan", json={"repository_path": str(path)})
    status, _ = poll(client, response.json()["scan_id"])
    assert status["status"] == "FAILED" and "empty" in status["error"]
    (path / "broken.py").write_text("def broken(")
    response = client.post("/api/scan", json={"repository_path": str(path)})
    scan_id = response.json()["scan_id"]
    status, _ = poll(client, scan_id)
    assert status["status"] == "FAILED" and "syntax" in status["error"]
    assert client.get(f"/api/summary/{scan_id}").status_code == 409
    assert client.get("/api/health").status_code == 200
    (path / "broken.py").write_text("import hashlib\nhashlib.sha256(b'demo')")
    response = client.post("/api/scan", json={"repository_path": str(path)})
    assert poll(client, response.json()["scan_id"])[0]["status"] == "COMPLETED"


def test_persistence_after_app_restart(settings):
    with TestClient(create_app(settings)) as client:
        scan_id = demo_scan(client)
        before = client.get(f"/api/findings/{scan_id}").json()
        cbom = client.get(f"/api/cbom/{scan_id}").json()
    with TestClient(create_app(settings)) as client:
        assert client.get(f"/api/findings/{scan_id}").json() == before
        assert client.get(f"/api/cbom/{scan_id}").json() == cbom


def test_restart_marks_interrupted_job_failed(settings):
    db = Database(settings.data_dir)
    scan_id = str(uuid.uuid4())
    with db.sessions.begin() as session:
        session.add(Scan(id=scan_id, project_name="interrupted", source_kind="local", status="SCANNING", created_at=now()))
    db.engine.dispose()
    with TestClient(create_app(settings)) as client:
        status = client.get(f"/api/scan/{scan_id}").json()
        assert status["status"] == "FAILED" and "restarted" in status["error"]


def test_background_queue_and_actual_progress(client, settings, monkeypatch):
    reached, release = threading.Event(), threading.Event()
    original = ScannerEngine.scan_directory

    def paused_real_scan(self, path, progress_callback=None):
        def callback(done, total):
            progress_callback(done, total)
            if done == 1:
                reached.set()
                assert release.wait(10)
        return original(self, path, callback)

    monkeypatch.setattr(ScannerEngine, "scan_directory", paused_real_scan)
    try:
        response = client.post("/api/scan/demo")
        assert response.status_code == 202
        scan_id = response.json()["scan_id"]
        assert reached.wait(10)
        state = client.get(f"/api/scan/{scan_id}").json()
        assert state["status"] == "SCANNING" and state["files_scanned"] == 1
        assert state["progress"] == round(100 / state["total_files"], 2)
        assert client.get(f"/api/cbom/{scan_id}").status_code == 409
        assert client.get("/api/health").status_code == 200
        ids = [scan_id]
        for _ in range(settings.max_pending_jobs - 1):
            ids.append(client.post("/api/scan/demo").json()["scan_id"])
        assert client.post("/api/scan/demo").status_code == 429
    finally:
        release.set()
    for scan_id in ids:
        assert poll(client, scan_id)[0]["status"] == "COMPLETED"
