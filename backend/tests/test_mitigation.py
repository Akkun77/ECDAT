from app.core.models import Confidence, Language, OperationType, ScannerFinding
from app.recommendations.engine import RecommendationEngine
from app.risk.engine import RiskEngine


def finding(algorithm, operation=OperationType.HASH, key_size=None, mode=None, category=None):
    values = dict(
        file_path="fixture.py",
        line_number=1,
        code_snippet=f"{algorithm} fixture",
        language=Language.PYTHON,
        library="fixture",
        algorithm=algorithm,
        operation_type=operation,
        key_size=key_size,
        mode=mode,
        detected_pattern=mode or algorithm,
        scanner_rule_id="TEST-001",
        confidence=Confidence.HIGH,
    )
    if category is not None:
        values["category"] = category
    return ScannerFinding(**values)


def recommend(item):
    risk = RiskEngine().assess(item)
    return risk, RecommendationEngine().recommend(item, risk)


def test_md5_receives_current_risk_mitigation():
    risk, recommendation = recommend(finding("MD5"))
    mitigation = recommendation.mitigation
    assert risk.current_security_status == "broken"
    assert "Immediate remediation" in mitigation.immediate_action
    assert "quantum risk is not the reason" in mitigation.implementation_caution
    assert "password" in mitigation.migration_dependency


def test_rsa_2048_receives_quantum_migration_mitigation():
    risk, recommendation = recommend(finding("RSA", OperationType.ASYMMETRIC_ENCRYPTION, 2048))
    mitigation = recommendation.mitigation
    assert risk.current_security_status == "acceptable" and risk.quantum_risk_status == "vulnerable"
    assert "No emergency replacement solely because of quantum risk" in mitigation.immediate_action
    assert "ML-KEM" in mitigation.migration_dependency
    assert "drop-in" in mitigation.implementation_caution


def test_rsa_signature_and_key_establishment_guidance_differ():
    _, signature = recommend(finding("RSA", OperationType.SIGNATURE, 2048))
    _, key_establishment = recommend(finding("RSA", OperationType.KEY_EXCHANGE, 2048))
    assert "ML-DSA" in signature.suggested_direction
    assert "ML-DSA" in signature.mitigation.migration_dependency
    assert "ML-KEM" not in signature.mitigation.migration_dependency
    assert "ML-KEM" in key_establishment.suggested_direction
    assert "ML-KEM" in key_establishment.mitigation.migration_dependency
    assert "ML-DSA" not in key_establishment.mitigation.migration_dependency


def test_aes_256_gcm_does_not_receive_unnecessary_pq_replacement():
    _, recommendation = recommend(finding("AES", OperationType.SYMMETRIC_ENCRYPTION, 256, "GCM"))
    mitigation = recommendation.mitigation
    assert "No urgent cryptographic replacement" in mitigation.immediate_action
    assert "Retain AES-256-GCM" in mitigation.migration_dependency
    assert "ML-KEM" not in mitigation.model_dump_json() and "ML-DSA" not in mitigation.model_dump_json()


def test_hardcoded_secret_requires_rotation():
    from app.core.models import FindingCategory

    _, recommendation = recommend(finding("hardcoded_secret", OperationType.SECRET_STORAGE, category=FindingCategory.SECURITY_HYGIENE))
    mitigation = recommendation.mitigation
    assert "Rotate" in mitigation.immediate_action
    assert "already exposed credential" in mitigation.implementation_caution
    assert "Rotate the credential" in mitigation.validation_step


def test_unknown_finding_uses_safe_context_limited_guidance():
    _, recommendation = recommend(finding("future_cipher", OperationType.UNKNOWN))
    mitigation = recommendation.mitigation
    text = mitigation.model_dump_json()
    assert "Human review is required" in mitigation.immediate_action
    assert "Scanner evidence is insufficient" in mitigation.implementation_caution
    assert "internet" not in text.lower() and "critical data" not in text.lower()


def test_existing_migration_recommendation_remains_available():
    _, recommendation = recommend(finding("RSA", OperationType.SIGNATURE, 2048))
    assert recommendation.suggested_direction
    assert recommendation.urgency == "planned"
