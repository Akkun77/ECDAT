import yaml
import os
from app.core.models import (
    ScannerFinding, RiskAssessment, CurrentSecurity, QuantumRisk, Severity, MigrationPriority, FindingCategory
)

class RiskEngine:
    def __init__(self):
        policy_path = os.path.join(os.path.dirname(__file__), "risk_policy.yaml")
        with open(policy_path, "r", encoding="utf-8") as f:
            self.policy = yaml.safe_load(f)
            
        self.algorithms = {self.normalize_algorithm(k): v for k, v in self.policy.get("algorithms", {}).items()}

    def normalize_algorithm(self, algorithm: str) -> str:
        alg = algorithm.lower().replace("-", "").replace("_", "")
        if alg in ("desede", "desede3", "tripledes", "3des"):
            return "3des"
        if alg in ("arc4", "rc4"):
            return "rc4"
        return alg

    def assess(self, finding: ScannerFinding) -> RiskAssessment:
        evidence_dict = finding.model_dump()
        
        # Handle hardcoded secrets
        if finding.category == FindingCategory.SECURITY_HYGIENE:
            return self._build_assessment("hardcoded_secret", finding, evidence_dict, "SEC-HYG-001")
            
        alg_norm = self.normalize_algorithm(finding.algorithm)
        
        # Handle ECB mode
        if alg_norm == "ecb" or (alg_norm != "rsa" and finding.mode == "ECB") or finding.detected_pattern.lower() == "ecb":
            return self._build_assessment("ecb", finding, evidence_dict, "MODE-ECB-001")
            
        # Try to match algorithm
        rule_prefix = alg_norm.upper()
        
        if alg_norm not in self.algorithms:
            return RiskAssessment(
                finding_id=finding.id,
                current_security_status=CurrentSecurity.REVIEW_REQUIRED,
                quantum_risk_status=QuantumRisk.REVIEW_REQUIRED,
                severity=Severity.MEDIUM,
                reason=f"Algorithm {finding.algorithm} not found in risk policy.",
                rule_id=f"{rule_prefix}-UNK-001",
                recommendation="Review required to determine security posture.",
                migration_priority=MigrationPriority.REVIEW_REQUIRED,
                explanation="The algorithm is unrecognized by the default policy.",
            )
            
        policy_data = self.algorithms[alg_norm]
        
        if finding.notes == "deprecated_createCipher":
            return self._build_assessment("deprecated_cipher_api", finding, evidence_dict, "API-CIPHER-001")
        if "signature_hash=MD5" in finding.notes or "signature_hash=SHA1" in finding.notes:
            weak = "md5" if "MD5" in finding.notes else "sha1"
            result = self._build_assessment(weak, finding, evidence_dict, "SIG-HASH-" + weak.upper())
            result.quantum_risk_status = QuantumRisk.VULNERABLE
            result.recommendation = "Replace the weak signature hash and review key strength now. Plan migration toward ML-DSA or another approved post-quantum signature scheme."
            return result
        if "key_size_rules" in policy_data:
            if finding.key_size is None or (alg_norm == "aes" and finding.key_size not in (128, 192, 256)):
                result = self._build_assessment_from_dict(policy_data["key_size_rules"][-1], finding, evidence_dict, rule_prefix + "-SIZE-REVIEW")
                result.current_security_status = CurrentSecurity.REVIEW_REQUIRED
                result.severity = Severity.MEDIUM
                result.reason = "Key size is unknown or invalid; review configuration before judging classical security."
                result.migration_priority = MigrationPriority.REVIEW_REQUIRED
                result.recommendation = "Review key size and configuration. " + result.recommendation
                if alg_norm == "aes":
                    result.recommendation = "Confirm a valid AES key size, authenticated mode and correct nonce/key handling before judging security."
                return result
            # Match by key size
            size = finding.key_size or 0
            selected_rule = None
            for rule in policy_data["key_size_rules"]:
                if size <= rule["max_key_size"]:
                    selected_rule = rule
                    break
            if not selected_rule:
                # If size is larger than max_key_size of last rule, use the last rule for now
                selected_rule = policy_data["key_size_rules"][-1]
                
            rule_id = f"{rule_prefix}-SIZE-{selected_rule['max_key_size']}"
            return self._build_assessment_from_dict(selected_rule, finding, evidence_dict, rule_id)
        else:
            rule_id = f"{rule_prefix}-ALG-001"
            return self._build_assessment_from_dict(policy_data, finding, evidence_dict, rule_id)

    def _build_assessment(self, policy_key: str, finding: ScannerFinding, evidence: dict, rule_id: str) -> RiskAssessment:
        policy_data = self.algorithms.get(self.normalize_algorithm(policy_key), {})
        return self._build_assessment_from_dict(policy_data, finding, evidence, rule_id)

    def _build_assessment_from_dict(self, policy_data: dict, finding: ScannerFinding, evidence: dict, rule_id: str) -> RiskAssessment:
        op_type = finding.operation_type.value
        recommendation = policy_data.get("recommendation", "")
        
        if "recommendations_by_operation" in policy_data:
            op_recs = policy_data["recommendations_by_operation"]
            recommendation = op_recs.get(op_type, op_recs.get("default", recommendation))
            
        result = RiskAssessment(
            finding_id=finding.id,
            current_security_status=CurrentSecurity(policy_data.get("current_security", CurrentSecurity.REVIEW_REQUIRED.value)),
            quantum_risk_status=QuantumRisk(policy_data.get("quantum_risk", QuantumRisk.NOT_APPLICABLE.value)),
            severity=Severity(policy_data.get("severity", Severity.MEDIUM.value)),
            reason=policy_data.get("reason", "No reason provided."),
            rule_id=rule_id,
            recommendation=recommendation,
            migration_priority=MigrationPriority(policy_data.get("migration_priority", MigrationPriority.REVIEW_REQUIRED.value)),
            explanation=policy_data.get("explanation", ""),
        )

        alg = self.normalize_algorithm(finding.algorithm)
        if alg in ("rsa", "ecc", "ecdsa"):
            if op_type in ("asymmetric_encryption", "key_exchange"):
                direction = "Plan migration toward ML-KEM or a reviewed hybrid key establishment architecture; ML-KEM is not bulk encryption or a drop-in RSA replacement."
            elif op_type == "signature":
                direction = "Plan migration toward ML-DSA or another approved post-quantum signature scheme."
            else:
                direction = "Determine key usage first: ML-KEM/hybrid planning for key establishment or encryption; ML-DSA/approved PQ signatures for signing."
            result.recommendation = ("Replace insufficient legacy key strength now. " if result.current_security_status == CurrentSecurity.DEPRECATED else "") + direction
            if alg in ("ecc", "ecdsa") and (finding.key_size is None or finding.key_size < 224):
                result.current_security_status = CurrentSecurity.REVIEW_REQUIRED
                result.reason = "Curve and security strength require review; ECC remains a quantum migration concern."
            elif result.current_security_status in (CurrentSecurity.ACCEPTABLE, CurrentSecurity.STRONG):
                result.reason += " Algorithm/key-strength assessment only; padding, curve, protocol and key management must also be appropriate."
            if finding.padding == "PKCS1Padding":
                result.current_security_status = CurrentSecurity.REVIEW_REQUIRED
                result.reason = "RSA PKCS#1 v1.5 encryption needs protocol/error-handling review for padding-oracle exposure; vulnerability is not established by the API name alone."
        if alg == "aes" and result.current_security_status in (CurrentSecurity.ACCEPTABLE, CurrentSecurity.STRONG) and finding.mode is not None and finding.mode not in ("GCM", "CCM"):
            result.current_security_status = CurrentSecurity.REVIEW_REQUIRED
            result.severity = Severity.MEDIUM
            result.migration_priority = MigrationPriority.REVIEW_REQUIRED
            result.reason = "AES key strength alone does not establish safe encryption; confirm authenticated mode, nonce handling and key management."
            result.recommendation = "Review mode and configuration; prefer authenticated encryption such as AES-GCM with correct nonce handling."
        if alg == "aes" and result.current_security_status in (CurrentSecurity.ACCEPTABLE, CurrentSecurity.STRONG):
            result.reason += " This rates algorithm/key strength; secure use also requires correct authenticated mode, nonce and key management."
        return result
