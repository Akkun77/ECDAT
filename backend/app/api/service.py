"""Local job coordinator. Each worker uses independent short database transactions."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import threading
import uuid

from sqlalchemy import select
from app.api.database import Database, Scan, Finding
from app.api.intake import (
    IntakeError, cleanup, new_workspace, snapshot_local, source_files, private_key_files,
)
from app.core.models import MigrationContext
from app.scanner.engine import ScannerEngine
from app.risk.engine import RiskEngine
from app.recommendations.engine import RecommendationEngine
from app.cbom.generator import CBOMGenerator

TERMINAL = {"COMPLETED", "FAILED"}

def now():
    return datetime.now(timezone.utc).isoformat()

def language(path):
    ext = path.suffix.lower()
    return "python" if ext == ".py" else "java" if ext == ".java" else "typescript" if ext in (".ts", ".tsx") else "javascript"

class QueueFull(RuntimeError):
    pass

class ScanService:
    def __init__(self, settings):
        self.settings = settings
        self.db = Database(settings.data_dir)
        self.executor = ThreadPoolExecutor(max_workers=settings.workers, thread_name_prefix="ecdat-scan")
        self.capacity = threading.BoundedSemaphore(settings.max_pending_jobs)
        # Single-process prototype: interrupted jobs are failed, never silently resumed.
        with self.db.sessions.begin() as session:
            for scan in session.scalars(select(Scan).where(Scan.status.not_in(TERMINAL))):
                scan.status = "FAILED"
                scan.error = "Server restarted before scan completed; submit a new scan."
                scan.completed_at = now()
                scan.duration_seconds = (datetime.now(timezone.utc) - datetime.fromisoformat(scan.created_at)).total_seconds()

    def close(self):
        self.executor.shutdown(wait=True)
        self.db.engine.dispose()

    def submit(self, project_name, source_kind, source=None, prepared=None, context=None):
        if not self.capacity.acquire(blocking=False):
            if prepared:
                cleanup(prepared, self.settings)
            raise QueueFull("Scan queue is full; retry after a running scan completes")
        scan_id = str(uuid.uuid4())
        try:
            with self.db.sessions.begin() as session:
                session.add(Scan(id=scan_id, project_name=project_name, source_kind=source_kind,
                                 status="QUEUED", progress=0, created_at=now(),
                                 context=context.model_dump(mode="json") if context else None))
            self.executor.submit(self._run, scan_id, source, prepared, context)
        except Exception:
            self.capacity.release()
            if prepared:
                cleanup(prepared, self.settings)
            raise
        return scan_id

    def _run(self, scan_id, source, prepared, context):
        workspace = prepared
        stage = "SCANNING"
        try:
            self.db.modify(scan_id, status=stage, progress=None)
            if workspace is None:
                workspace = new_workspace(self.settings)
                snapshot_local(source, workspace, self.settings)
            files = list(source_files(workspace))
            if not files:
                raise IntakeError("Repository is empty or contains no supported source files")
            self.db.modify(scan_id, total_files=len(files), languages=sorted({language(p) for p in files}), progress=0)
            protected_files = private_key_files(workspace)

            def progress(done, total):
                self.db.modify(scan_id, files_scanned=done, total_files=total,
                               progress=round(100 * done / total, 2) if total else 100)

            findings = ScannerEngine().scan_directory(str(workspace), progress_callback=progress)
            for finding in findings:
                source_path = Path(finding.file_path).resolve()
                finding.file_path = source_path.relative_to(workspace.resolve()).as_posix()
                if source_path in protected_files:
                    finding.code_snippet = "[REDACTED: source file contains private-key material]"
                    finding.detected_pattern = "[REDACTED]"
                    finding.notes = "[REDACTED]"
                    if "PRIVATE KEY" in finding.algorithm:
                        finding.algorithm = "unknown_redacted"
            stage = "ASSESSING_RISK"
            self.db.modify(scan_id, status=stage, progress=0)
            risk_engine, recommendation_engine = RiskEngine(), RecommendationEngine()
            risks, recommendations = [], []
            for index, finding in enumerate(findings):
                risk = risk_engine.assess(finding)
                risks.append(risk)
                recommendations.append(recommendation_engine.recommend(finding, risk, context))
                self.db.modify(scan_id, progress=round(100 * (index + 1) / len(findings), 2))
            stage = "GENERATING_CBOM"
            self.db.modify(scan_id, status=stage, progress=None)
            scan = self.db.scan(scan_id)
            cbom = CBOMGenerator().generate_cbom(scan.project_name, findings, risks, recommendations)
            completed = now()
            duration = (datetime.fromisoformat(completed) - datetime.fromisoformat(scan.created_at)).total_seconds()
            # Completed status and all result rows commit atomically.
            with self.db.sessions.begin() as session:
                for finding, risk, rec in zip(findings, risks, recommendations):
                    session.add(Finding(id=finding.id, scan_id=scan_id,
                                        finding=finding.model_dump(mode="json"),
                                        risk=risk.model_dump(mode="json"),
                                        recommendation=rec.model_dump(mode="json"),
                                        mosca=rec.mosca.model_dump(mode="json") if rec.mosca else None))
                record = session.get(Scan, scan_id)
                record.cbom, record.status, record.progress = cbom, "COMPLETED", 100
                record.completed_at, record.duration_seconds = completed, duration
        except Exception as exc:
            # Never return exception text from parsers: it may include source secrets.
            error = str(exc) if isinstance(exc, IntakeError) else (
                f"Scan failed during {stage}. Check readable UTF-8 source and valid Python syntax; "
                "the server remains available.")
            scan = self.db.scan(scan_id)
            completed = now()
            self.db.modify(scan_id, status="FAILED", completed_at=completed, error=error,
                           duration_seconds=(datetime.fromisoformat(completed) - datetime.fromisoformat(scan.created_at)).total_seconds())
        finally:
            if workspace is not None:
                cleanup(workspace, self.settings)
            self.capacity.release()

