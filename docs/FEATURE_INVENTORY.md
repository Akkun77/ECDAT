# ECDAT Feature Inventory

This inventory is evidence-based: “implemented” means the behavior exists in current local source, tests, and/or the fresh bundled demo; it does not imply production deployment or runtime verification.

For a one-to-one mapping between features and visual/prose evidence, see [FEATURE_COVERAGE_MATRIX.md](FEATURE_COVERAGE_MATRIX.md).

## 1. Discovery engine

- **Multi-language static discovery — implemented.** `backend/app/scanner/` coordinates Python, JavaScript/TypeScript, and Java. Python uses AST and import-alias handling; JavaScript/Java use rules and patterns. The Scan page triggers the bundled source repository. [Completed scan](screenshots/03-demo-scan-complete.png)
- **Evidence extraction — implemented.** Findings retain repository-relative file, line, snippet, algorithm, operation, key size where extracted, and rule data. [Findings](screenshots/04-findings-overview.png)
- **Input safety — implemented.** `backend/app/api/intake.py` snapshots permitted paths and validates ZIP safety conditions. It is bounded static source analysis, not arbitrary code execution.

## 2. Current and quantum risk assessment

- **Independent dual axes — implemented.** `backend/app/risk/engine.py` and policy data retain current security independently of quantum status; the UI filters both. [RSA dual risk](screenshots/06-rsa-dual-risk.png)
- **Deterministic rules — implemented.** Classifications and recommendations are policy-driven, not LLM-generated.
- **Operation-aware direction — implemented with static-evidence limits.** Extracted operation/key-size informs ML-KEM/hybrid planning for key establishment and ML-DSA directions for signatures.

## 3. CBOM and data visualizations

- **Persisted CBOM — implemented.** `backend/app/cbom/generator.py` produces components exposed through `/api/cbom` and exports. [Exposure-map view](screenshots/10-cbom-exposure-map.png)
- **Source-to-risk exposure map — implemented.** `frontend/components/cryptographic-exposure-map.tsx` aggregates actual records; credentials and insecure randomness are kept separate from algorithm families. [Sankey](screenshots/10-cbom-exposure-map.png)
- **Current/quantum comparison — implemented.** `frontend/components/exposure-comparison-chart.tsx` plots real aggregation with grouped/dumbbell views and zero baseline.
- **Limit:** The CBOM is an ECDAT project schema, not certified CycloneDX compliance.

## 4. Crypto Architecture Map

`frontend/app/crypto-map/page.tsx` and `frontend/lib/crypto-map.ts` start with application/language summaries, progressively reveal actual files/findings, provide search and a Full Graph mode, and show selected-finding details.

- [Architecture view](screenshots/12-crypto-map-architecture.png) and [expanded relationships](screenshots/13-crypto-map-expanded.png)
- **Limit:** It presents discovered source relationships, not a whole-program call graph.

## 5. Mitigation Hub

`frontend/components/interactive-mitigation.tsx` and `frontend/app/mitigation/page.tsx` surface immediate actions, interim controls/cautions, migration targets, and re-scan links.

- [Mitigation Hub](screenshots/08-mitigation-hub.png)
- Checklist state is local planning information. It is neither a remediation record nor runtime verification.

## 6. Migration Plan

`backend/app/recommendations/mosca.py`, recommendation logic, and `frontend/app/migration/page.tsx` retain target cryptographic direction while grouping by urgency. The Mosca horizon is configurable scenario input, not a prediction.

- [Migration roadmap](screenshots/14-migration-roadmap.png)
- **Limit:** recommendations do not execute migrations.

## 7. Reports and exports

`/api/export/{scan_id}` returns persisted JSON/CSV; the Reports page exposes the downloads. API tests cover exports and private-key evidence suppression.

- [Reports](screenshots/15-reports-exports.png)
- Exported static evidence can be sensitive and should be handled as local audit data.

## 8. User experience and accessibility

Responsive layouts, keyboard-focusable controls, ARIA labels, filters, search, collapsible finding/graph interactions, and reduced-motion styling are present. The Overview explainer is illustrative product UI, not scanner telemetry. [Overview](screenshots/01-overview.png)

## 9. Backend architecture and reliability

FastAPI/SQLAlchemy persist scans, findings, CBOM, and metadata in local SQLite. A bounded in-process worker service handles state, safe failures, and result readiness. The Windows workspace repair creates a parent-ACL-owned unique workspace, regression-tested in `backend/tests/test_api.py`.

- **Limit:** no durable queue, automatic retry, multi-tenant authentication, or hosted deployment claim.

## 10. Automated testing and reproducibility

Backend pytest covers scanners, policies, API validation, persistence, exports, graph data, safety boundaries, and demo E2E. Frontend `node:test` covers display normalization, mitigation presence, CBOM aggregation, exposure selection/comparison, Crypto Map expansion/search, and workflow copy. The audit run passed **100 backend** and **47 frontend** tests; production build passed. Lint retains one pre-existing hook-rule error in `frontend/hooks/use-scan.ts`; documentation does not weaken it.
