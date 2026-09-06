import csv
import io
import json
from pathlib import Path

import pytest
from pydantic import ValidationError
from app.pipeline import run_pipeline
from app.core.models import MigrationContext, QuantumRisk
from app.scanner.engine import ScannerEngine
from app.scanner.python_scanner import PythonScanner
from app.scanner.js_scanner import JSScanner
from app.scanner.java_scanner import JavaScanner
from app.risk.engine import RiskEngine
from app.recommendations.engine import RecommendationEngine
from app.recommendations.mosca import calculate_mosca_score
from app.cbom.generator import CBOMGenerator

DEMO = Path(__file__).resolve().parents[2] / "demo_repository"


def test_real_demo_pipeline_and_evidence():
    cbom = run_pipeline(DEMO)
    components = json.loads(CBOMGenerator().to_json(cbom))["components"]
    algs = {RiskEngine().normalize_algorithm(c["algorithm"]) for c in components}
    assert {"md5", "sha1", "sha256", "rsa", "aes", "ecc", "des", "3des", "insecurerandom"} <= algs
    assert {1024, 2048, 4096} <= {c["key_size"] for c in components if c["algorithm"] == "RSA"}
    assert any(c["algorithm"] == "AES" and c["key_size"] == 256 and c["current_risk"] == "strong" for c in components)
    for c in components:
        actual = Path(c["source_file"]).read_text(encoding="utf-8").splitlines()
        assert c["code_snippet"].splitlines()[0].strip() == actual[c["source_line"] - 1].strip()
        assert c["scanner_rule_id"] and c["policy_rule_id"] and c["recommended_action"] and c["migration_priority"]
        assert c["evidence"]["algorithm"] == c["algorithm"]
    rows = list(csv.DictReader(io.StringIO(CBOMGenerator().to_csv(cbom))))
    assert len(rows) == len(components)
    assert all(row["code_snippet"] and row["policy_rule_id"] and row["migration_priority"] for row in rows)


def test_real_operation_recommendations():
    components = run_pipeline(DEMO)["components"]
    signature = next(c for c in components if c["source_file"].endswith("operations.py") and c["operation"] == "signature")
    encryption = next(c for c in components if c["source_file"].endswith("operations.py") and c["operation"] == "asymmetric_encryption")
    assert "ML-DSA" in signature["recommended_action"] and "ML-KEM" not in signature["recommended_action"]
    assert "ML-KEM" in encryption["recommended_action"] and "ML-DSA" not in encryption["recommended_action"]
    assert signature["key_size"] == encryption["key_size"] == 2048


@pytest.mark.parametrize("source,algorithm,bits", [
    ("import hashlib as h\nh.md5(b'x')", "md5", None),
    ("from hashlib import sha256 as digest\ndigest(b'x')", "sha256", None),
    ("from cryptography.hazmat.primitives.asymmetric import rsa as r\nr.generate_private_key(65537, 1024)", "RSA", 1024),
    ("from Crypto.PublicKey import RSA as r\nr.generate(2048)", "RSA", 2048),
    ("from Crypto.Cipher import DES as d\nd.new(key, d.MODE_ECB)", "DES", None),
    ("import random\nrandom.choice('abc')", "insecure_random", None),
])
def test_python_aliases(source, algorithm, bits):
    findings = PythonScanner().scan_file("fixture.py", source)
    assert any(f.algorithm == algorithm and f.key_size == bits for f in findings)


def test_python_comment_is_not_evidence():
    assert PythonScanner().scan_file("x.py", '# hashlib.md5(b"x")\n"RSA.generate(1024)"') == []


def test_dynamic_hash_requires_review():
    f = PythonScanner().scan_file("x.py", "import hashlib\nhashlib.new(algo)")[0]
    assert RiskEngine().assess(f).current_security_status == "review_required"


def test_key_bindings_do_not_leak_across_functions():
    code = "from Crypto.PublicKey import RSA\ndef a():\n key = RSA.generate(2048)\ndef b(key):\n key.sign(data)"
    assert not any(f.operation_type == "signature" for f in PythonScanner().scan_file("x.py", code))


def test_js_secret_detection_preserved():
    f = JSScanner().scan_file("x.js", 'const SECRET_TOKEN = "demo-value";')[0]
    assert f.category == "security_hygiene"
    assert RiskEngine().assess(f).current_security_status == "deprecated"


@pytest.mark.parametrize("scanner,source,algorithm", [
    (JSScanner(), "/* header\n multiline */\ncrypto.createHash('md5')", "md5"),
    (JavaScanner(), '/* header\n multiline */\nMessageDigest.getInstance("SHA-1");', "SHA-1"),
])
def test_comment_line_numbers(scanner, source, algorithm):
    f = scanner.scan_file("fixture", source)[0]
    assert f.line_number == 3 and f.algorithm == algorithm
    assert f.code_snippet == source.splitlines()[2]


def test_java_rsa_is_not_symmetric_ecb():
    f = JavaScanner().scan_file("x.java", 'Cipher.getInstance("RSA/ECB/PKCS1Padding")')[0]
    risk = RiskEngine().assess(f)
    assert f.algorithm == "RSA" and f.mode is None
    assert risk.quantum_risk_status == "vulnerable"
    assert risk.current_security_status == "review_required"
    assert risk.rule_id != "MODE-ECB-001"


def test_java_multiline_key_generation():
    source = 'KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");\nkeyGen.initialize(1024);'
    f = JavaScanner().scan_file("x.java", source)[0]
    assert f.key_size == 1024 and f.algorithm == "RSA" and f.line_number == 1


def test_js_multiline_rsa():
    f = JSScanner().scan_file("x.ts", "crypto.generateKeyPairSync('rsa', {\n modulusLength: 2048\n})")[0]
    assert f.key_size == 2048 and f.language == "typescript"


@pytest.mark.parametrize("bits,status", [(1024, "deprecated"), (1536, "deprecated"), (2048, "acceptable"), (3072, "acceptable"), (8192, "acceptable")])
def test_rsa_thresholds(bits, status):
    f = PythonScanner().scan_file("x.py", f"from Crypto.PublicKey import RSA\nRSA.generate({bits})")[0]
    assert RiskEngine().assess(f).current_security_status == status


@pytest.mark.parametrize("code,expected", [
    ("crypto.createCipheriv('aes-256-gcm', key, iv)", "strong"),
    ("crypto.createCipheriv('aes-128-gcm', key, iv)", "acceptable"),
    ("crypto.createCipheriv('aes-256-ecb', key, iv)", "broken"),
    ("crypto.createCipher('aes-192-cbc', password)", "deprecated"),
])
def test_aes_configuration(code, expected):
    f = JSScanner().scan_file("x.js", code)[0]
    assert RiskEngine().assess(f).current_security_status == expected


def test_unknown_key_size_not_assumed():
    findings = PythonScanner().scan_file("x.py", "from Crypto.Cipher import AES\nAES.new(key, AES.MODE_GCM)")
    assert RiskEngine().assess(findings[0]).current_security_status == "review_required"


def test_unknown_algorithm_quantum_requires_review():
    f = PythonScanner().scan_file("x.py", "import hashlib\nhashlib.new('future_hash')")[0]
    risk = RiskEngine().assess(f)
    assert risk.current_security_status == risk.quantum_risk_status == "review_required"


def test_insecure_random_policy_normalization():
    f = JSScanner().scan_file("x.js", "Math.random()")[0]
    assert RiskEngine().assess(f).current_security_status == "deprecated"


@pytest.mark.parametrize("path_kind", ["missing", "syntax", "encoding"])
def test_scan_errors_are_visible(tmp_path, path_kind):
    if path_kind == "missing":
        with pytest.raises(NotADirectoryError):
            ScannerEngine().scan_directory(str(tmp_path / "missing"))
    else:
        (tmp_path / "bad.py").write_bytes(b"def broken(" if path_kind == "syntax" else b"\xff")
        with pytest.raises(RuntimeError, match="Cannot scan"):
            ScannerEngine().scan_directory(str(tmp_path))


@pytest.mark.parametrize("field,value", [("data_lifetime_years", -1), ("migration_time_years", float("nan")), ("threat_horizon_years", 0), ("threat_horizon_years", float("inf")), ("business_criticality", "bogus")])
def test_invalid_assumptions(field, value):
    with pytest.raises(ValidationError):
        MigrationContext(**{field: value})


def test_mosca_boundary_and_criticality():
    assert calculate_mosca_score("RSA", QuantumRisk.VULNERABLE, 10, 5, 15).urgency_label == "ACT_NOW"
    score = calculate_mosca_score("RSA", QuantumRisk.VULNERABLE, 5, 3, 15, business_criticality="high")
    assert score.urgency_label == "PLAN_NOW" and score.migration_urgency == -7
    assert "Demo assumptions" in score.explanation and "does not predict" in score.explanation


def test_per_asset_context_changes_real_priority():
    context = MigrationContext(data_lifetime_years=10, migration_time_years=6, threat_horizon_years=15, business_criticality="critical")
    cbom = run_pipeline(DEMO, asset_contexts={"python_app/operations.py:8": context})
    c = next(c for c in cbom["components"] if c["source_file"].endswith("operations.py") and c["source_line"] == 8)
    assert c["migration_priority"] == "immediate" and c["mosca"]["migration_urgency"] == 1


def test_mosca_does_not_lower_current_remediation():
    f = PythonScanner().scan_file("x.py", "from Crypto.PublicKey import RSA\nRSA.generate(1024)")[0]
    risk = RiskEngine().assess(f)
    rec = RecommendationEngine().recommend(f, risk, MigrationContext(threat_horizon_years=100))
    assert rec.urgency == "immediate" and rec.mosca.urgency_label == "MONITOR"


def test_cbom_rejects_missing_or_shuffled_assessments():
    findings = PythonScanner().scan_file("x.py", "import hashlib\nhashlib.md5(b'x')\nhashlib.sha256(b'x')")
    risks = [RiskEngine().assess(f) for f in findings]
    recs = [RecommendationEngine().recommend(f, r) for f, r in zip(findings, risks)]
    with pytest.raises(ValueError):
        CBOMGenerator().generate_cbom("x", findings, risks[:1], recs)
    with pytest.raises(ValueError):
        CBOMGenerator().generate_cbom("x", findings, list(reversed(risks)), recs)
