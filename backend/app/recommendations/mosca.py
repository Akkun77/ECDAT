from app.core.models import MoscaScore, QuantumRisk, MigrationContext


def calculate_mosca_score(
    algorithm: str,
    quantum_risk: QuantumRisk,
    data_lifetime_years: float = 5.0,
    migration_time_years: float = 3.0,
    threat_horizon_years: float = 15.0,
    is_demo_assumption: bool = True,
    business_criticality: str = "medium",
):
    context = MigrationContext(
        data_lifetime_years=data_lifetime_years, migration_time_years=migration_time_years,
        threat_horizon_years=threat_horizon_years, is_demo_assumption=is_demo_assumption,
        business_criticality=business_criticality)
    if quantum_risk not in (QuantumRisk.VULNERABLE, QuantumRisk.MIGRATION_CONCERN):
        return None
    urgency = data_lifetime_years + migration_time_years - threat_horizon_years
    # The equality boundary has no remaining margin.
    label = "ACT_NOW" if urgency >= 0 else "PLAN_NOW" if urgency >= -2 else "MONITOR"
    # Business criticality is an explicit policy overlay, not part of Mosca's arithmetic.
    if business_criticality in ("high", "critical") and label == "MONITOR":
        label = "PLAN_NOW"
    if business_criticality == "critical" and urgency >= -2:
        label = "ACT_NOW"
    explanation = (
        f"{algorithm}: lifetime {data_lifetime_years:g} + migration {migration_time_years:g} "
        f"- assumed threat horizon {threat_horizon_years:g} = {urgency:g} years; "
        f"criticality={business_criticality}, priority={label}. "
        "Nonnegative margin means ACT_NOW; within two years means PLAN_NOW; otherwise MONITOR. "
        "High/critical business impact raises MONITOR to PLAN_NOW; critical within two years raises to ACT_NOW. "
        + ("Demo assumptions. " if is_demo_assumption else "User-supplied planning assumptions. ")
        + "This does not predict the arrival of a cryptographically relevant quantum computer. "
        "For signatures, lifetime means required trust/validation lifetime, not confidentiality lifetime."
    )
    return MoscaScore(**context.model_dump(), migration_urgency=urgency,
                      urgency_label=label, explanation=explanation)

