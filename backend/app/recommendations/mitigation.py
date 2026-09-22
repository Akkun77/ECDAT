"""Deterministic interim guidance derived only from scanner and policy evidence."""
from app.core.models import (
    CurrentSecurity,
    MigrationPriority,
    MitigationGuidance,
    OperationType,
    QuantumRisk,
    RiskAssessment,
    ScannerFinding,
)


def _guidance(immediate, controls, dependency, caution, validation):
    return MitigationGuidance(
        immediate_action=immediate,
        interim_controls=controls,
        migration_dependency=dependency,
        implementation_caution=caution,
        validation_step=validation,
    )


def build_mitigation(
    finding: ScannerFinding,
    risk: RiskAssessment,
    urgency: MigrationPriority,
    mosca_label: str | None = None,
) -> MitigationGuidance:
    """Return concise, reproducible guidance without inferring deployment context."""
    alg = finding.algorithm.lower().replace("-", "").replace("_", "")
    operation = finding.operation_type

    if finding.category.value == "security_hygiene" or alg == "hardcodedsecret":
        return _guidance(
            "Rotate the exposed credential or secret immediately.",
            ["Remove it from source.", "Review repository history and possible exposure.", "Use secure secret injection."],
            "Move the secret to an approved secrets manager or secure environment-based mechanism.",
            "Deleting the value from the current file does not invalidate an already exposed credential.",
            "Rotate the credential, then re-scan and confirm the hardcoded secret is absent.",
        )

    if alg == "md5":
        return _guidance(
            "Immediate remediation recommended: stop using MD5 for security-sensitive integrity.",
            ["Identify where the digest is used.", "Prevent new security-sensitive MD5 usage.", "Replace affected integrity checks where feasible."],
            "Choose SHA-256/SHA-3 for suitable integrity uses; if this is password storage, use Argon2id, bcrypt, or another approved password-hashing mechanism.",
            "Do not blindly replace password hashing with SHA-256. MD5 is unsafe today; quantum risk is not the reason.",
            "Re-scan and confirm the security-sensitive MD5 finding is removed.",
        )

    if alg == "sha1":
        return _guidance(
            "Immediate remediation recommended: stop introducing new security-sensitive SHA-1 usage.",
            ["Identify dependent signature and integrity workflows.", "Prioritize externally exposed or trust-sensitive uses when that context is known.", "Replace affected uses where compatibility allows."],
            "Select SHA-256, SHA-3, or another modern mechanism appropriate to the verified use case.",
            "Do not assume every SHA-1 appearance has the same security implications; confirm the use context.",
            "Re-scan after replacement and confirm the affected SHA-1 use is removed.",
        )

    if alg == "rsa" and finding.key_size is not None and finding.key_size < 2048:
        dependency = (
            "Prepare an approved PQ signature transition such as ML-DSA after restoring adequate classical key strength."
            if operation == OperationType.SIGNATURE else
            "Restore adequate classical key strength first, then prepare an operation-specific ML-KEM or hybrid key-establishment transition where applicable."
        )
        return _guidance(
            "Immediate remediation recommended: treat the weak RSA key size as a current-security priority.",
            ["Stop generating new RSA keys below 2048 bits.", "Inventory affected keys and usages.", "Rotate affected keys where operationally feasible."],
            dependency,
            "Do not treat ML-KEM as a direct replacement for every RSA use; signatures and key establishment require different designs.",
            "Re-scan and verify that weak RSA key usage is gone.",
        )

    if alg == "rsa":
        if operation == OperationType.SIGNATURE:
            dependency = "Inventory signing and verification components, long-term validity requirements, and interoperability before testing ML-DSA or another approved PQ signature direction."
            caution = "Signature migration differs from key-establishment migration and may require protocol or application changes."
        elif operation in (OperationType.ASYMMETRIC_ENCRYPTION, OperationType.KEY_EXCHANGE):
            dependency = "Inventory dependent systems and protocol constraints before testing ML-KEM or an appropriate hybrid key-establishment direction."
            caution = "ML-KEM is not a drop-in RSA encryption API; migration may require protocol and application changes."
        else:
            dependency = "Determine whether each key supports signatures, encryption, or key establishment before selecting the PQ migration direction."
            caution = "Do not select a PQ algorithm until the RSA operation and interoperability requirements are known."
        immediate = "No emergency replacement solely because of quantum risk if current usage is otherwise acceptable."
        if mosca_label == "ACT_NOW" or urgency == MigrationPriority.IMMEDIATE:
            immediate = "Begin migration preparation and testing now based on the current migration urgency; this is not a claim that acceptable RSA is broken today."
        elif mosca_label == "PLAN_NOW" or urgency == MigrationPriority.HIGH:
            immediate = "Plan migration now and apply interim controls according to the current migration urgency."
        return _guidance(
            immediate,
            ["Identify high-value or long-lived data and trust workflows when that context is available.", "Avoid unnecessary new long-lived RSA dependencies.", "Inventory dependent systems before migration."],
            dependency,
            caution,
            "Re-scan after deployment and confirm the quantum-vulnerable dependency has been removed or reduced.",
        )

    if alg in ("ecc", "ecdsa"):
        if operation == OperationType.SIGNATURE:
            dependency = "Inventory signing and verification dependencies before testing ML-DSA or another approved PQ signature direction."
        elif operation == OperationType.KEY_EXCHANGE:
            dependency = "Inventory key-agreement dependencies before testing ML-KEM or a suitable hybrid approach."
        else:
            dependency = "Human review must identify signature versus key-agreement use before choosing a migration target."
        return _guidance(
            "Plan migration; current classical status may be acceptable, but public-key ECC remains quantum-vulnerable.",
            ["Inventory affected use.", "Identify signature versus key-agreement context.", "Prioritize long-lived or high-criticality systems when that context is available.", "Avoid unnecessary additional dependency where migration is foreseeable."],
            dependency,
            "Do not treat every ECC use as identical; operation and interoperability requirements determine the migration path.",
            "Re-scan after deployment and confirm the affected ECC dependency has been removed or reduced.",
        )

    if alg in ("des", "3des", "desede", "tripledes"):
        return _guidance(
            "Immediate remediation recommended: treat deprecated legacy encryption as a current-security issue.",
            ["Prevent new use.", "Identify dependent legacy systems.", "Isolate or reduce exposure where immediate replacement is not possible."],
            "Select a modern authenticated-encryption design such as AES-GCM according to verified protocol and application requirements.",
            "Do not replace algorithm strings blindly; check mode, key management, IV/nonce handling, and interoperability.",
            "Re-scan after replacement and confirm the legacy encryption finding is removed.",
        )

    is_ecb = alg == "ecb" or finding.mode == "ECB" or finding.detected_pattern.lower() == "ecb"
    if is_ecb:
        return _guidance(
            "Immediate remediation recommended: avoid ECB for sensitive structured data.",
            ["Determine the affected data; human review is required if its sensitivity is unknown.", "Stop introducing new ECB use.", "Prioritize confidentiality-sensitive workloads when identified."],
            "Use authenticated encryption such as AES-GCM where the protocol and nonce-management design support it.",
            "Correct unique nonce handling and authentication-tag verification are essential.",
            "Re-scan and confirm ECB use is removed, then test authenticated decryption failure handling.",
        )

    if alg == "aes" and finding.key_size == 256 and finding.mode == "GCM":
        return _guidance(
            "No urgent cryptographic replacement is required solely due to quantum concerns.",
            ["Verify unique nonce/IV handling.", "Verify key lifecycle and storage.", "Ensure authentication tags are validated correctly."],
            "Retain AES-256-GCM if implementation and policy review confirm it is correctly configured.",
            "A strong algorithm choice does not guarantee correct implementation.",
            "Review configuration and re-scan when code or key-management configuration changes.",
        )

    if risk.current_security_status in (CurrentSecurity.BROKEN, CurrentSecurity.DEPRECATED):
        return _guidance(
            "Immediate remediation recommended for this current-security weakness.",
            ["Prevent new use.", "Inventory dependent components.", "Reduce exposure where replacement cannot be completed immediately."],
            "Human review must confirm the use context, compatibility requirements, and safe replacement design.",
            "Do not change the detected primitive or API without reviewing protocol, key-management, and interoperability effects.",
            "Apply the reviewed change, test it, and re-scan to confirm the finding is removed.",
        )

    if risk.quantum_risk_status in (QuantumRisk.VULNERABLE, QuantumRisk.MIGRATION_CONCERN):
        return _guidance(
            "Plan migration and apply interim controls according to the existing migration urgency.",
            ["Inventory dependent components.", "Avoid unnecessary new long-lived dependencies.", "Use available business context to prioritize planning."],
            "Human review must determine the operation and interoperability requirements before selecting a PQ target.",
            "Do not assume algorithms with different cryptographic operations are interchangeable.",
            "Re-scan after the reviewed migration and confirm the dependency has been removed or reduced.",
        )

    if risk.current_security_status in (CurrentSecurity.ACCEPTABLE, CurrentSecurity.STRONG):
        return _guidance(
            "No urgent cryptographic replacement; validate implementation controls.",
            ["Review configuration and key lifecycle.", "Confirm the primitive is used for an appropriate purpose."],
            "Retain the current algorithm when implementation and policy review confirm it is appropriate.",
            "Algorithm strength alone does not establish secure implementation.",
            "Review configuration and re-scan after relevant code changes.",
        )

    return _guidance(
        "Human review is required before selecting a mitigation action.",
        ["Confirm the detected algorithm and operation.", "Identify dependencies without assuming deployment, exposure, or data sensitivity.", "Avoid expanding use until the security posture is understood."],
        "Document the verified use case, configuration, and compatibility constraints before planning migration.",
        "Scanner evidence is insufficient to recommend a specific replacement safely.",
        "Complete human review, apply an approved change if needed, and re-scan.",
    )
