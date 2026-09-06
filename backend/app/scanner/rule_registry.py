from pydantic import BaseModel, ConfigDict
from app.core.models import Language, OperationType, Severity, Confidence, FindingCategory

class ScanRule(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rule_id: str
    language: Language
    description: str
    algorithm: str
    operation_type: OperationType
    severity: Severity
    confidence: Confidence
    category: FindingCategory = FindingCategory.CRYPTOGRAPHIC

class RuleRegistry:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RuleRegistry, cls).__new__(cls)
            cls._instance._rules = []
            cls._instance._init_rules()
        return cls._instance

    def register_rule(self, rule: ScanRule) -> None:
        self._rules.append(rule)

    def get_rules(self, language: Language) -> list[ScanRule]:
        return [r for r in self._rules if r.language in (language, Language.UNKNOWN)]

    def _init_rules(self) -> None:
        pass

registry = RuleRegistry()
