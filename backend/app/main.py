"""ECDAT local-development REST service. Run a single process on loopback."""
from contextlib import asynccontextmanager
from io import BytesIO
import os
from typing import Literal
from uuid import UUID

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, ConfigDict
from starlette.concurrency import run_in_threadpool

from app.api.config import Settings
from app.api.limits import UploadLimitMiddleware
from app.api.schemas import ScanResponse, FindingResponse, FindingPage, SummaryResponse, MigrationResponse
from app.api.service import ScanService, QueueFull
from app.api.intake import IntakeError, new_workspace, cleanup, permitted_path, extract_zip
from app.api.views import status_view, finding_view, summary_view, migration_view, graph_view
from app.cbom.generator import CBOMGenerator
from app.core.models import MigrationContext

class LocalScanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    repository_path: str = Field(min_length=1, max_length=4096)
    project_name: str | None = Field(default=None, min_length=1, max_length=120)
    context: MigrationContext | None = None

class DemoScanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    context: MigrationContext | None = None

class ScanAccepted(BaseModel):
    scan_id: str
    status_url: str

def create_app(settings: Settings | None = None):
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app):
        app.state.service = ScanService(settings)
        yield
        await run_in_threadpool(app.state.service.close)

    app = FastAPI(title="ECDAT API", version="0.2.0",
                  description="Static cryptographic discovery for a single-user local hackathon prototype.",
                  lifespan=lifespan)
    app.add_middleware(UploadLimitMiddleware, max_bytes=settings.max_upload_bytes + 64 * 1024)
    cors_origins = [
        origin.strip()
        for origin in os.environ.get("ECDAT_CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    if "http://localhost:3000" not in cors_origins:
        cors_origins.append("http://localhost:3000")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=r"^https?://.*\.vercel\.app$",
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        expose_headers=["Content-Disposition"],
    )

    def service():
        return app.state.service

    def get_scan(scan_id, completed=False):
        scan = service().db.scan(str(scan_id))
        if scan is None:
            raise HTTPException(404, "Scan not found")
        if completed and scan.status != "COMPLETED":
            raise HTTPException(409, {"message": "Scan results are not available", "status": scan.status, "error": scan.error})
        return scan

    def submit(project_name, kind, **kwargs):
        try:
            scan_id = service().submit(project_name, kind, **kwargs)
        except QueueFull as exc:
            raise HTTPException(429, str(exc)) from exc
        return {"scan_id": scan_id, "status_url": "/api/scan/" + scan_id}

    @app.get("/api/health", tags=["service"])
    def health():
        return {"status": "ok"}

    @app.post("/api/scan", status_code=202, response_model=ScanAccepted, tags=["scan"])
    def local_scan(request: LocalScanRequest):
        try:
            path = permitted_path(request.repository_path, settings)
        except (IntakeError, OSError, ValueError) as exc:
            raise HTTPException(400, str(exc)) from exc
        return submit(request.project_name or path.name, "local", source=path, context=request.context)

    @app.post("/api/scan/demo", status_code=202, response_model=ScanAccepted, tags=["scan"])
    def demo_scan(request: DemoScanRequest | None = None):
        if not settings.demo_dir.is_dir():
            raise HTTPException(503, "Bundled demo repository is missing")
        return submit("ECDAT demo", "demo", source=settings.demo_dir.resolve(),
                      context=request.context if request else None)

    @app.post("/api/scan/upload", status_code=202, response_model=ScanAccepted, tags=["scan"])
    async def upload_scan(file: UploadFile = File(...), project_name: str = Form("Uploaded repository", min_length=1, max_length=120)):
        workspace = None
        try:
            # Starlette bounds multipart field counts; also check actual streamed file bytes.
            data = bytearray()
            while chunk := await file.read(64 * 1024):
                data.extend(chunk)
                if len(data) > settings.max_upload_bytes:
                    raise HTTPException(413, "ZIP upload exceeds 10 MiB limit")
            workspace = new_workspace(settings)
            await run_in_threadpool(extract_zip, BytesIO(data), workspace, settings)
            result = submit(project_name, "upload", prepared=workspace)
            workspace = None  # ownership transferred to the background worker
            return result
        except IntakeError as exc:
            raise HTTPException(400, str(exc)) from exc
        finally:
            await file.close()
            if workspace is not None:
                cleanup(workspace, settings)

    @app.get("/api/scan/{scan_id}", response_model=ScanResponse, tags=["scan"])
    def scan_status(scan_id: UUID):
        return status_view(get_scan(scan_id))

    @app.get("/api/summary/{scan_id}", response_model=SummaryResponse, tags=["results"])
    def summary(scan_id: UUID):
        scan = get_scan(scan_id, True)
        return summary_view(scan, service().db.findings(scan.id))

    @app.get("/api/findings/{scan_id}", response_model=FindingPage, tags=["results"])
    def findings(scan_id: UUID, offset: int = Query(0, ge=0), limit: int = Query(1000, ge=1, le=10000)):
        scan = get_scan(scan_id, True)
        rows = service().db.findings(scan.id)
        return {"scan_id": scan.id, "total": len(rows), "offset": offset, "limit": limit,
                "findings": [finding_view(row) for row in rows[offset:offset+limit]]}

    @app.get("/api/findings/{scan_id}/{finding_id}", response_model=FindingResponse, tags=["results"])
    def finding(scan_id: UUID, finding_id: UUID):
        scan = get_scan(scan_id, True)
        row = next((row for row in service().db.findings(scan.id) if row.id == str(finding_id)), None)
        if row is None:
            raise HTTPException(404, "Finding not found in this scan")
        return finding_view(row)

    @app.get("/api/cbom/{scan_id}", tags=["results"])
    def cbom(scan_id: UUID):
        return get_scan(scan_id, True).cbom

    @app.get("/api/migration/{scan_id}", response_model=MigrationResponse, tags=["results"])
    def migration(scan_id: UUID):
        scan = get_scan(scan_id, True)
        return migration_view(scan, service().db.findings(scan.id))

    @app.get("/api/graph/{scan_id}", tags=["results"])
    def graph(scan_id: UUID):
        scan = get_scan(scan_id, True)
        return graph_view(scan, service().db.findings(scan.id))

    @app.get("/api/export/{scan_id}", tags=["results"])
    def export(scan_id: UUID, format: Literal["json", "csv"] = "json"):
        scan = get_scan(scan_id, True)
        generator = CBOMGenerator()
        data = generator.to_json(scan.cbom) if format == "json" else generator.to_csv(scan.cbom)
        return Response(content=data, media_type="application/json" if format == "json" else "text/csv",
                        headers={"Content-Disposition": f'attachment; filename="ecdat-{scan.id}.{format}"'})

    return app

app = create_app()

