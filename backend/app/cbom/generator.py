import json
import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.core.models import ScannerFinding, RiskAssessment, MigrationRecommendation, CBOMEntry

class CBOMGenerator:
    def generate_cbom(
        self,
        project_name: str,
        findings: List[ScannerFinding],
        risks: List[RiskAssessment],
        recommendations: List[MigrationRecommendation]
    ) -> Dict[str, Any]:
        
        if not (len(findings) == len(risks) == len(recommendations)):
            raise ValueError("Each finding must have exactly one risk and recommendation")
        components = []
        for i, finding in enumerate(findings):
            risk = risks[i] if i < len(risks) else None
            rec = recommendations[i] if i < len(recommendations) else None
            
            if not risk or not rec:
                continue

            if any(item.finding_id is not None and item.finding_id != finding.id for item in (risk, rec)):
                raise ValueError("Risk/recommendation is associated with a different finding")

            entry = CBOMEntry(
                bom_ref=f"crypto-{finding.id}",
                asset_type="algorithm",
                name=finding.algorithm,
                algorithm=finding.algorithm,
                library=finding.library,
                operation=finding.operation_type,
                key_size=finding.key_size,
                source_file=finding.file_path,
                source_line=finding.line_number,
                code_snippet=finding.code_snippet,
                current_risk=risk.current_security_status,
                quantum_risk=risk.quantum_risk_status,
                severity=risk.severity,
                recommended_action=rec.suggested_direction,
                evidence=finding.model_dump(),
                scanner_rule_id=finding.scanner_rule_id,
                policy_rule_id=risk.rule_id,
                migration_priority=rec.urgency,
                migration_explanation=rec.why_action_needed,
                mosca=rec.mosca,
                category=finding.category
            )
            components.append(entry)

        cbom = {
            "bomFormat": "CryptoBOM",
            "specVersion": "1.0",
            "serialNumber": f"urn:uuid:{uuid.uuid4()}",
            "version": 1,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "tool": {"name": "ECDAT", "version": "1.0.0"},
                "component": {"name": project_name, "type": "application"}
            },
            "components": [c.model_dump(mode="json") for c in components]
        }
        return cbom

    def to_json(self, cbom: Dict[str, Any]) -> str:
        return json.dumps(cbom, indent=2)

    def to_csv(self, cbom: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        fields = ["bom_ref", "algorithm", "library", "operation", "key_size", "source_file", "source_line", "code_snippet", "current_risk", "quantum_risk", "severity", "scanner_rule_id", "policy_rule_id", "recommended_action", "migration_priority", "migration_explanation", "mosca", "evidence"]
        writer.writerow(fields)
        for component in cbom.get("components", []):
            writer.writerow([json.dumps(component.get(field)) if isinstance(component.get(field), dict) else component.get(field, "") for field in fields])
        return output.getvalue()
