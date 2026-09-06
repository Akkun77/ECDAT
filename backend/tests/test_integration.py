import pytest
import json
from app.core.models import ScannerFinding, Language, OperationType, Confidence
from app.risk.engine import RiskEngine
from app.recommendations.engine import RecommendationEngine
from app.cbom.generator import CBOMGenerator

def test_full_pipeline():
    risk_engine = RiskEngine()
    rec_engine = RecommendationEngine()
    cbom_gen = CBOMGenerator()

    findings = [
        ScannerFinding(
            file_path="src/legacy.py", line_number=42, code_snippet="md5()",
            language=Language.PYTHON, library="hashlib", algorithm="MD5",
            operation_type=OperationType.HASH, detected_pattern="md5",
            scanner_rule_id="RULE-1", confidence=Confidence.HIGH
        ),
        ScannerFinding(
            file_path="src/crypto.py", line_number=10, code_snippet="RSA(2048)",
            language=Language.PYTHON, library="cryptography", algorithm="RSA", key_size=2048,
            operation_type=OperationType.ASYMMETRIC_ENCRYPTION, detected_pattern="rsa",
            scanner_rule_id="RULE-2", confidence=Confidence.HIGH
        ),
        ScannerFinding(
            file_path="src/secure.py", line_number=5, code_snippet="AES(256)",
            language=Language.PYTHON, library="cryptography", algorithm="AES", key_size=256,
            operation_type=OperationType.SYMMETRIC_ENCRYPTION, detected_pattern="aes",
            scanner_rule_id="RULE-3", confidence=Confidence.HIGH
        )
    ]

    risks = [risk_engine.assess(f) for f in findings]
    recs = [rec_engine.recommend(findings[i], risks[i]) for i in range(len(findings))]
    cbom = cbom_gen.generate_cbom("demo-project", findings, risks, recs)

    # 1. MD5 is broken, no quantum impact
    assert risks[0].current_security_status == "broken"
    assert risks[0].quantum_risk_status == "not_applicable"
    
    # 2. RSA is acceptable currently, but quantum vulnerable
    assert risks[1].current_security_status == "acceptable"
    assert risks[1].quantum_risk_status == "vulnerable"
    
    # 3. AES-256 is strong, low quantum concern
    assert risks[2].current_security_status == "strong"
    assert risks[2].quantum_risk_status == "low_concern"
    
    assert len(cbom["components"]) == 3
