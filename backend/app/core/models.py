from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Language(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CONFIG = "config"
    CERTIFICATE = "certificate"
    UNKNOWN = "unknown"

class OperationType(str, Enum):
    HASH = "hash"
    SYMMETRIC_ENCRYPTION = "symmetric_encryption"
    ASYMMETRIC_ENCRYPTION = "asymmetric_encryption"
    KEY_GENERATION = "key_generation"
    KEY_EXCHANGE = "key_exchange"
    SIGNATURE = "signature"
    RANDOM = "random_number_generation"
    CERTIFICATE = "certificate"
    PROTOCOL = "protocol"
    SECRET_STORAGE = "secret_storage"  # hardcoded secrets
    UNKNOWN = "unknown"

class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class CurrentSecurity(str, Enum):
    BROKEN = "broken"
    DEPRECATED = "deprecated"
    ACCEPTABLE = "acceptable"
    STRONG = "strong"
    REVIEW_REQUIRED = "review_required"

class QuantumRisk(str, Enum):
    REVIEW_REQUIRED = "review_required"
    VULNERABLE = "vulnerable"           # Shor's algorithm threat (RSA, ECC)
    MIGRATION_CONCERN = "migration_concern"  # needs planning
    LOW_CONCERN = "low_concern"          # symmetric, minimal quantum impact
    NOT_APPLICABLE = "not_applicable"    # already broken classically

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"

class MigrationPriority(str, Enum):
    IMMEDIATE = "immediate"
    HIGH = "high"
    PLANNED = "planned"
    LOW = "low"
    NONE = "none"
    REVIEW_REQUIRED = "review_required"

class FindingCategory(str, Enum):
    CRYPTOGRAPHIC = "cryptographic"
    SECURITY_HYGIENE = "security_hygiene"  # for hardcoded secrets

class ScannerFinding(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    line_number: int
    code_snippet: str
    language: Language
    library: str
    algorithm: str
    operation_type: OperationType
    key_size: Optional[int] = None
    detected_pattern: str
    scanner_rule_id: str
    confidence: Confidence
    category: FindingCategory = FindingCategory.CRYPTOGRAPHIC
    notes: str = ""
    mode: Optional[str] = None
    padding: Optional[str] = None
    curve: Optional[str] = None

class RiskAssessment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    finding_id: Optional[str] = None
    current_security_status: CurrentSecurity
    quantum_risk_status: QuantumRisk
    severity: Severity
    reason: str
    rule_id: str
    policy_source: str = "ECDAT risk policy based on NIST SP 800-131A and CNSA 2.0 guidance"
    recommendation: str
    migration_priority: MigrationPriority
    migration_notes: str = ""
    explanation: str = ""  # human-readable explanation for "Why?" button

class MoscaScore(BaseModel):
    data_lifetime_years: float = 5.0
    migration_time_years: float = 3.0
    threat_horizon_years: float = 15.0
    migration_urgency: float = 0.0  # computed: data_lifetime + migration_time - threat_horizon
    urgency_label: str = "MONITOR"  # ACT_NOW / PLAN_NOW / MONITOR
    is_demo_assumption: bool = True
    business_criticality: str = "medium"
    explanation: str = ""

class MigrationContext(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="forbid")
    data_lifetime_years: float = Field(default=5.0, ge=0)
    migration_time_years: float = Field(default=3.0, ge=0)
    threat_horizon_years: float = Field(default=15.0, gt=0)
    business_criticality: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    is_demo_assumption: bool = True

class MigrationRecommendation(BaseModel):
    finding_id: Optional[str] = None
    detected_algorithm: str
    operation_type: OperationType
    why_action_needed: str
    suggested_direction: str
    urgency: MigrationPriority
    migration_notes: str
    mosca: Optional[MoscaScore] = None

class CBOMEntry(BaseModel):
    bom_ref: str = Field(default_factory=lambda: f"crypto-{uuid.uuid4().hex[:8]}")
    asset_type: str  # algorithm, protocol, certificate, related-crypto-material
    name: str
    algorithm: str
    library: str
    operation: OperationType
    key_size: Optional[int] = None
    source_file: str
    source_line: int
    code_snippet: str
    current_risk: CurrentSecurity
    quantum_risk: QuantumRisk
    severity: Severity
    recommended_action: str
    evidence: dict  # full finding evidence
    scanner_rule_id: str
    policy_rule_id: str
    migration_priority: MigrationPriority
    migration_explanation: str
    mosca: Optional[MoscaScore] = None
    category: FindingCategory = FindingCategory.CRYPTOGRAPHIC

class ScanStatus(str, Enum):
    PENDING = "pending"
    SCANNING = "scanning"
    COMPLETED = "completed"
    FAILED = "failed"

class ScanResult(BaseModel):
    scan_id: str
    project_name: str
    repo_path: str
    status: ScanStatus
    progress: float = 0.0
    total_files: int = 0
    scanned_files: int = 0
    findings: list[ScannerFinding] = []
    risk_assessments: list[RiskAssessment] = []
    recommendations: list[MigrationRecommendation] = []
    cbom_entries: list[CBOMEntry] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
