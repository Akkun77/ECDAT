"""Derived API views read persisted results; no example counts or canned findings."""
from collections import Counter
from pathlib import PurePosixPath

def status_view(scan):
    return {
        "scan_id": scan.id, "project_name": scan.project_name, "source_kind": scan.source_kind,
        "status": scan.status, "stage": scan.status, "progress": scan.progress,
        "progress_scope": "current_stage", "files_scanned": scan.files_scanned,
        "total_files": scan.total_files, "created_at": scan.created_at,
        "completed_at": scan.completed_at, "duration_seconds": scan.duration_seconds,
        "error": scan.error,
    }

def finding_view(row):
    f, r, rec = row.finding, row.risk, row.recommendation
    return {
        **f, "scan_id": row.scan_id,
        "file": f["file_path"], "line": f["line_number"], "operation": f["operation_type"],
        "current_security": r["current_security_status"], "quantum_status": r["quantum_risk_status"],
        "severity": r["severity"], "reason": r["reason"], "policy_source": r["policy_source"],
        "policy_rule_id": r["rule_id"], "risk_assessment": r,
        "mosca": row.mosca, "mosca_priority": row.mosca["urgency_label"] if row.mosca else None,
        "migration_priority": rec["urgency"], "migration_recommendation": rec,
    }

def summary_view(scan, rows):
    return {
        "scan_id": scan.id, "total_findings": len(rows),
        "current_critical_findings": sum(r.risk["severity"] == "critical" and r.risk["current_security_status"] in ("broken", "deprecated") for r in rows),
        "high_findings": sum(r.risk["severity"] == "high" for r in rows),
        "quantum_migration_concerns": sum(r.risk["quantum_risk_status"] in ("vulnerable", "migration_concern") for r in rows),
        "acceptable_strong_findings": sum(r.risk["current_security_status"] in ("acceptable", "strong") for r in rows),
        "files_scanned": scan.files_scanned, "languages_detected": scan.languages,
        "scan_duration_seconds": scan.duration_seconds,
        "algorithm_distribution": dict(sorted(Counter(r.finding["algorithm"].upper().replace("-", "") for r in rows).items())),
    }

def migration_view(scan, rows):
    groups = {"Act Now": [], "Plan Migration": [], "Monitor": [], "No Urgent Action": []}
    for row in rows:
        risk, rec, score = row.risk, row.recommendation, row.mosca
        if risk["current_security_status"] in ("broken", "deprecated") or rec["urgency"] == "immediate" or (score and score["urgency_label"] == "ACT_NOW"):
            group = "Act Now"
        elif rec["urgency"] in ("high", "review_required") or (score and score["urgency_label"] == "PLAN_NOW"):
            group = "Plan Migration"
        elif score and score["urgency_label"] == "MONITOR":
            group = "Monitor"
        elif rec["urgency"] == "planned":
            group = "Plan Migration"
        elif rec["urgency"] == "low":
            group = "Monitor"
        else:
            group = "No Urgent Action"
        groups[group].append(finding_view(row))
    rank = {"critical": 0, "high": 1, "medium": 2, "low": 3, "informational": 4}
    for items in groups.values():
        items.sort(key=lambda f: (rank[f["severity"]], -(f["mosca"]["migration_urgency"] if f["mosca"] else -10000), f["file"], f["line"], f["id"]))
    return {"scan_id": scan.id, "groups": [{"name": name, "count": len(items), "findings": items} for name, items in groups.items()]}

def graph_view(scan, rows):
    app_id = "application:" + scan.id
    nodes = {app_id: {"id": app_id, "type": "application", "data": {"label": scan.project_name}}}
    edges = []
    for row in rows:
        parent = app_id
        parts = PurePosixPath(row.finding["file_path"]).parts
        for index in range(len(parts)):
            path = "/".join(parts[:index+1])
            node_id = "component:" + path
            if node_id not in nodes:
                nodes[node_id] = {"id": node_id, "type": "file" if index == len(parts)-1 else "directory", "data": {"label": parts[index], "path": path}}
                edges.append({"id": parent + "->" + node_id, "source": parent, "target": node_id})
            parent = node_id
        node_id = "finding:" + row.id
        nodes[node_id] = {"id": node_id, "type": "crypto", "data": {
            "label": row.finding["algorithm"], "algorithm": row.finding["algorithm"],
            "severity": row.risk["severity"], "current_security": row.risk["current_security_status"],
            "quantum_status": row.risk["quantum_risk_status"], "finding_id": row.id,
        }}
        edges.append({"id": parent + "->" + node_id, "source": parent, "target": node_id})
    return {"scan_id": scan.id, "nodes": list(nodes.values()), "edges": edges}

