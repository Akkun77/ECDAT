import pytest
from app.core.models import ScannerFinding, Language, OperationType, Confidence
from app.risk.engine import RiskEngine
from app.core.models import CurrentSecurity, QuantumRisk, Severity, MigrationPriority

@pytest.fixture
def risk_engine():
    return RiskEngine()

def test_md5(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="hashlib.md5()",
        language=Language.PYTHON, library="hashlib", algorithm="MD5",
        operation_type=OperationType.HASH, detected_pattern="md5",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.BROKEN
    assert assessment.quantum_risk_status == QuantumRisk.NOT_APPLICABLE
    assert assessment.severity == Severity.CRITICAL

def test_sha1(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="hashlib.sha1()",
        language=Language.PYTHON, library="hashlib", algorithm="SHA-1",
        operation_type=OperationType.HASH, detected_pattern="sha1",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.DEPRECATED

def test_sha256(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="hashlib.sha256()",
        language=Language.PYTHON, library="hashlib", algorithm="SHA-256",
        operation_type=OperationType.HASH, detected_pattern="sha256",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.ACCEPTABLE
    assert assessment.quantum_risk_status == QuantumRisk.LOW_CONCERN
    assert assessment.severity == Severity.INFORMATIONAL

def test_aes_128(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="AES(128)",
        language=Language.PYTHON, library="crypto", algorithm="AES",
        operation_type=OperationType.SYMMETRIC_ENCRYPTION, key_size=128, detected_pattern="aes",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.ACCEPTABLE
    assert assessment.quantum_risk_status == QuantumRisk.LOW_CONCERN
    
def test_aes_256(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="AES(256)",
        language=Language.PYTHON, library="crypto", algorithm="AES",
        operation_type=OperationType.SYMMETRIC_ENCRYPTION, key_size=256, detected_pattern="aes",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.STRONG
    assert assessment.quantum_risk_status == QuantumRisk.LOW_CONCERN

def test_des(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="DES",
        language=Language.PYTHON, library="crypto", algorithm="DES",
        operation_type=OperationType.SYMMETRIC_ENCRYPTION, detected_pattern="des",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.BROKEN

def test_3des(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="TripleDES",
        language=Language.PYTHON, library="crypto", algorithm="TripleDES",
        operation_type=OperationType.SYMMETRIC_ENCRYPTION, detected_pattern="3des",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.DEPRECATED

def test_rsa_1024(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="RSA(1024)",
        language=Language.PYTHON, library="crypto", algorithm="RSA",
        operation_type=OperationType.ASYMMETRIC_ENCRYPTION, key_size=1024, detected_pattern="rsa",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.DEPRECATED
    assert assessment.quantum_risk_status == QuantumRisk.VULNERABLE

def test_rsa_2048(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="RSA(2048)",
        language=Language.PYTHON, library="crypto", algorithm="RSA",
        operation_type=OperationType.ASYMMETRIC_ENCRYPTION, key_size=2048, detected_pattern="rsa",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.ACCEPTABLE
    assert assessment.quantum_risk_status == QuantumRisk.VULNERABLE
    # Verify recommendations depend on operation type (encryption/key exchange vs signature)
    assert "ML-KEM" in assessment.recommendation
    
    finding.operation_type = OperationType.SIGNATURE
    assessment = risk_engine.assess(finding)
    assert "ML-DSA" in assessment.recommendation

def test_rsa_4096(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="RSA(4096)",
        language=Language.PYTHON, library="crypto", algorithm="RSA",
        operation_type=OperationType.ASYMMETRIC_ENCRYPTION, key_size=4096, detected_pattern="rsa",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.ACCEPTABLE
    assert assessment.quantum_risk_status == QuantumRisk.VULNERABLE

def test_ecdsa(risk_engine):
    finding = ScannerFinding(
        file_path="foo.py", line_number=1, code_snippet="ECDSA()",
        language=Language.PYTHON, library="crypto", algorithm="ECDSA",
        operation_type=OperationType.SIGNATURE, key_size=256, detected_pattern="ecdsa",
        scanner_rule_id="RULE-1", confidence=Confidence.HIGH
    )
    assessment = risk_engine.assess(finding)
    assert assessment.current_security_status == CurrentSecurity.ACCEPTABLE
    assert assessment.quantum_risk_status == QuantumRisk.VULNERABLE
