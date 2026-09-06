"""Run the real static-discovery pipeline without importing/executing scanned code."""
import argparse
import json
from pathlib import Path
from app.scanner.engine import ScannerEngine
from app.risk.engine import RiskEngine
from app.recommendations.engine import RecommendationEngine
from app.cbom.generator import CBOMGenerator
from app.core.models import MigrationContext


def run_pipeline(repo_path, project_name="ECDAT", context=None, asset_contexts=None):
    findings = ScannerEngine().scan_directory(str(repo_path))
    risk_engine = RiskEngine()
    recommendation_engine = RecommendationEngine()
    risks = [risk_engine.assess(f) for f in findings]
    # Per-asset overrides use stable repository-relative file:line keys.
    root = Path(repo_path).resolve()
    asset_contexts = asset_contexts or {}
    recommendations = []
    for finding, risk in zip(findings, risks):
        asset = Path(finding.file_path).resolve().relative_to(root).as_posix() + ":" + str(finding.line_number)
        chosen = asset_contexts.get(asset, context)
        recommendations.append(recommendation_engine.recommend(finding, risk, chosen))
    return CBOMGenerator().generate_cbom(project_name, findings, risks, recommendations)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repository")
    parser.add_argument("--output", required=True)
    parser.add_argument("--csv")
    parser.add_argument("--context", help="JSON with default and/or assets mapping file:line to MigrationContext")
    args = parser.parse_args()
    context = None
    assets = {}
    if args.context:
        data = json.loads(Path(args.context).read_text(encoding="utf-8"))
        context = MigrationContext(**data["default"]) if "default" in data else None
        assets = {k: MigrationContext(**v) for k, v in data.get("assets", {}).items()}
    cbom = run_pipeline(args.repository, Path(args.repository).name, context, assets)
    generator = CBOMGenerator()
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(generator.to_json(cbom), encoding="utf-8")
    if args.csv:
        Path(args.csv).parent.mkdir(parents=True, exist_ok=True)
        Path(args.csv).write_text(generator.to_csv(cbom), encoding="utf-8")
    print(f"Scanned {args.repository}: {len(cbom['components'])} findings exported.")


if __name__ == "__main__":
    main()

