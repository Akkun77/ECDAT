import pytest
from app.recommendations.mosca import calculate_mosca_score
from app.core.models import QuantumRisk

def test_mosca_not_applicable():
    score = calculate_mosca_score("MD5", QuantumRisk.NOT_APPLICABLE)
    assert score is None

def test_mosca_act_now():
    score = calculate_mosca_score("RSA", QuantumRisk.VULNERABLE, data_lifetime_years=10, migration_time_years=6, threat_horizon_years=15)
    assert score is not None
    assert score.urgency_label == "ACT_NOW"
    assert score.migration_urgency == 1.0  # 10 + 6 - 15 = 1.0

def test_mosca_plan_now():
    score = calculate_mosca_score("RSA", QuantumRisk.VULNERABLE, data_lifetime_years=7, migration_time_years=3, threat_horizon_years=11)
    assert score is not None
    assert score.urgency_label == "PLAN_NOW"
    assert score.migration_urgency == -1.0 # 7 + 3 - 11 = -1.0

def test_mosca_monitor():
    score = calculate_mosca_score("RSA", QuantumRisk.VULNERABLE, data_lifetime_years=5, migration_time_years=2, threat_horizon_years=15)
    assert score is not None
    assert score.urgency_label == "MONITOR"
    assert score.migration_urgency == -8.0 # 5 + 2 - 15 = -8.0

def test_mosca_assumptions():
    score = calculate_mosca_score("RSA", QuantumRisk.VULNERABLE)
    assert score.is_demo_assumption is True
