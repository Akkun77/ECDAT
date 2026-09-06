"""OpenAPI response contracts; reuse the verified core finding/risk models."""
from typing import Literal
from pydantic import BaseModel
from app.core.models import ScannerFinding, RiskAssessment, MigrationRecommendation, MoscaScore

class ScanResponse(BaseModel):
    scan_id: str
    project_name: str
    source_kind: str
    status: Literal["QUEUED", "SCANNING", "ASSESSING_RISK", "GENERATING_CBOM", "COMPLETED", "FAILED"]
    stage: str
    progress: float | None
    progress_scope: Literal["current_stage"]
    files_scanned: int
    total_files: int | None
    created_at: str
    completed_at: str | None
    duration_seconds: float | None
    error: str | None

class FindingResponse(ScannerFinding):
    scan_id: str
    file: str
    line: int
    operation: str
    current_security: str
    quantum_status: str
    severity: str
    reason: str
    policy_source: str
    policy_rule_id: str
    risk_assessment: RiskAssessment
    mosca: MoscaScore | None
    mosca_priority: str | None
    migration_priority: str
    migration_recommendation: MigrationRecommendation

class FindingPage(BaseModel):
    scan_id: str
    total: int
    offset: int
    limit: int
    findings: list[FindingResponse]

class SummaryResponse(BaseModel):
    scan_id: str
    total_findings: int
    current_critical_findings: int
    high_findings: int
    quantum_migration_concerns: int
    acceptable_strong_findings: int
    files_scanned: int
    languages_detected: list[str]
    scan_duration_seconds: float
    algorithm_distribution: dict[str, int]

class MigrationGroup(BaseModel):
    name: str
    count: int
    findings: list[FindingResponse]

class MigrationResponse(BaseModel):
    scan_id: str
    groups: list[MigrationGroup]
