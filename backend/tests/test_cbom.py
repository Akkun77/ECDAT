import pytest
import json
from app.core.models import ScannerFinding, Language, OperationType, Confidence, RiskAssessment, CurrentSecurity, QuantumRisk, Severity, MigrationPriority, MigrationRecommendation, CBOMEntry, FindingCategory
from app.cbom.generator import CBOMGenerator

def test_cbom_generation():
    generator = CBOMGenerator()
    
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="hashlib.md5()",
        language=Language.PYTHON, library="hashlib", algorithm="MD5",
        operation_type=OperationType.HASH, detected_pattern="md5",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH, category=FindingCategory.CRYPTOGRAPHIC
    )
    risk = RiskAssessment(
        current_security_status=CurrentSecurity.BROKEN,
        quantum_risk_status=QuantumRisk.NOT_APPLICABLE,
        severity=Severity.CRITICAL,
        reason="MD5 is broken",
        rule_id="MD5-001",
        recommendation="Migrate to SHA-256",
        migration_priority=MigrationPriority.IMMEDIATE,
        explanation="Collision attacks"
    )
    rec = MigrationRecommendation(
        detected_algorithm="MD5",
        operation_type=OperationType.HASH,
        why_action_needed="Broken",
        suggested_direction="Migrate to SHA-256",
        urgency=MigrationPriority.IMMEDIATE,
        migration_notes="Protocol changes",
        mosca=None
    )
    
    cbom = generator.generate_cbom("test_proj", [finding], [risk], [rec])
    
    assert cbom["bomFormat"] == "CryptoBOM"
    assert len(cbom["components"]) == 1
    
    comp = cbom["components"][0]
    assert comp["algorithm"] == "MD5"
    assert comp["library"] == "hashlib"
    assert comp["operation"] == OperationType.HASH.value
    assert comp["source_file"] == "foo.py"
    assert comp["source_line"] == 1
    assert comp["current_risk"] == CurrentSecurity.BROKEN.value
    assert comp["quantum_risk"] == QuantumRisk.NOT_APPLICABLE.value
    assert comp["severity"] == Severity.CRITICAL.value
    assert comp["recommended_action"] == "Migrate to SHA-256"
