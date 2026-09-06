from app.core.models import (
    ScannerFinding, RiskAssessment, MigrationRecommendation, MigrationContext, MigrationPriority,
)
from app.risk.engine import RiskEngine
from app.recommendations.mosca import calculate_mosca_score


class RecommendationEngine:
    def __init__(self):
        self.risk_engine = RiskEngine()
        self.policy = self.risk_engine.policy

    def recommend(self, finding: ScannerFinding, risk: RiskAssessment,
                  context: MigrationContext | None = None) -> MigrationRecommendation:
        if context is None:
            values = dict(self.policy.get("mosca_defaults", {}))
            policy = self.risk_engine.algorithms.get(self.risk_engine.normalize_algorithm(finding.algorithm), {})
            rules = policy.get("key_size_rules")
            if rules:
                policy = next((r for r in rules if finding.key_size is not None and finding.key_size <= r["max_key_size"]), rules[-1])
            values.update(policy.get("mosca_defaults", {}))
            context = MigrationContext(**values)
        mosca = calculate_mosca_score(finding.algorithm, risk.quantum_risk_status, **context.model_dump())
        urgency = risk.migration_priority
        if mosca:
            # Preserve current-security remediation urgency; a distant assumed horizon cannot lower it.
            rank = {MigrationPriority.NONE: 0, MigrationPriority.LOW: 1, MigrationPriority.PLANNED: 2,
                    MigrationPriority.REVIEW_REQUIRED: 2, MigrationPriority.HIGH: 3, MigrationPriority.IMMEDIATE: 4}
            candidate = {"ACT_NOW": MigrationPriority.IMMEDIATE, "PLAN_NOW": MigrationPriority.HIGH,
                         "MONITOR": MigrationPriority.PLANNED}[mosca.urgency_label]
            urgency = max((urgency, candidate), key=rank.get)
        explanation = risk.reason
        if mosca:
            explanation += " " + mosca.explanation + f" Overall migration priority={urgency.value}; current-security urgency is retained."
        return MigrationRecommendation(
            finding_id=finding.id,
            detected_algorithm=finding.algorithm, operation_type=finding.operation_type,
            why_action_needed=explanation, suggested_direction=risk.recommendation,
            urgency=urgency, migration_notes="Validate configuration and protocol compatibility before migration.",
            mosca=mosca)

