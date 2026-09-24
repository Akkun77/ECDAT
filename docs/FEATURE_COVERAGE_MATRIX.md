# Feature Coverage Matrix

| Verified feature | Purpose / limitation | Showcase evidence | README / inventory |
| --- | --- | --- | --- |
| Six-stage lifecycle | Product explanation; hero is illustrative | `screenshots/01-overview.png`, `02-product-explainer.png` | Lifecycle + UX inventory |
| Demo scanning | Real bundled static scan, not runtime analysis | `screenshots/03-demo-scan-complete.png` | Demo result |
| Evidence and dual risk | Source path/line; independent current/quantum state | `05-md5-source-evidence.png`, `06-rsa-dual-risk.png` | Discovery/risk inventory |
| Findings filtering | Search and multi-axis filtering; local UI state | `showcase/findings-filtered-rsa.png` | Findings interaction section |
| Sankey exposure map | Toggle, hover/keyboard/click selection filters real CBOM inventory | `10-cbom-exposure-map.png`, `showcase/cbom-sankey-quantum.png` | CBOM inventory |
| Comparison chart | Grouped/dumbbell and selection filter; zero counts retained | `showcase/cbom-comparison-dumbbell.png` | CBOM inventory |
| Crypto Map | Progressive expansion/search/full graph; source relationship view only | `12-crypto-map-architecture.png`, `13-crypto-map-expanded.png`, `showcase/crypto-map-full-graph.png` | Architecture Map inventory |
| Mitigation Hub | Interim controls and local checklist, not remediation proof | `08-mitigation-hub.png`, `showcase/mitigation-checklist-expanded.png` | Mitigation inventory |
| Migration Plan | Mosca assumptions and operation-specific targets, not automatic migration | `14-migration-roadmap.png` | Migration inventory |
| Reports | Local JSON/CSV exports may contain evidence | `15-reports-exports.png` | Reports inventory |
| Responsive UI | Compact viewport behavior | `showcase/overview-mobile.png` | UX inventory |
| Backend safeguards | Intake validation, bounded jobs, persistence, evidence suppression | `SYSTEM_ARCHITECTURE.svg`, backend tests | Reliability inventory |
| Reproducibility | Automated tests/build | Test commands and results | README validation |
