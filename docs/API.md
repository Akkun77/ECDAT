# ECDAT local REST API

The service wraps the verified core engines without changing them. All results come from static scanning and are persisted in SQLite. It never imports or executes repository code.

## Install and run

From the ECDAT repository root in PowerShell:

~~~powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements-api.txt
.\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
~~~

Use one Uvicorn process, without --workers or --reload during scans. API: http://127.0.0.1:8000. Swagger: http://127.0.0.1:8000/docs. OpenAPI: http://127.0.0.1:8000/openapi.json. CORS permits http://localhost:3000.

No authentication is implemented. Bind to loopback and use only on a trusted development machine. CORS is a browser access policy, not authentication.

## Quick real demo

~~~powershell
$scan = Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/scan/demo
Invoke-RestMethod "http://127.0.0.1:8000/api/scan/$($scan.scan_id)"
# Poll until status is COMPLETED or FAILED.
Invoke-RestMethod "http://127.0.0.1:8000/api/summary/$($scan.scan_id)"
Invoke-RestMethod "http://127.0.0.1:8000/api/findings/$($scan.scan_id)"
Invoke-WebRequest "http://127.0.0.1:8000/api/export/$($scan.scan_id)?format=json" -OutFile demo-cbom.json
~~~

POST returns HTTP 202 with scan_id and status_url. No scan results are preloaded or hardcoded.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | /api/health | Startup/liveness response |
| POST | /api/scan | Queue a permitted local path |
| POST | /api/scan/demo | Queue the bundled real demo repository |
| POST | /api/scan/upload | Multipart ZIP upload; field file, optional project_name |
| GET | /api/scan/{scan_id} | Stage, progress, counts, UTC times, duration and error |
| GET | /api/summary/{scan_id} | Derived counts, languages, duration and algorithms |
| GET | /api/findings/{scan_id} | Finding page; offset=0, limit=1000 by default, max 10000 |
| GET | /api/findings/{scan_id}/{finding_id} | Full finding, risk, Mosca and recommendation |
| GET | /api/cbom/{scan_id} | Actual persisted output of CBOMGenerator |
| GET | /api/migration/{scan_id} | Risk/Mosca-derived roadmap |
| GET | /api/graph/{scan_id} | Application -> directories -> file -> finding nodes/edges |
| GET | /api/export/{scan_id}?format=json | Download actual CBOM JSON |
| GET | /api/export/{scan_id}?format=csv | Download actual CBOM CSV |

POST /api/scan JSON:

~~~json
{
  "repository_path": "C:/path/to/permitted/repository",
  "project_name": "Optional display name",
  "context": {
    "data_lifetime_years": 7,
    "migration_time_years": 3,
    "threat_horizon_years": 15,
    "business_criticality": "medium",
    "is_demo_assumption": true
  }
}
~~~

Only repository_path is required. POST /api/scan/demo accepts an optional JSON object containing context. ZIP scans currently use policy defaults. Context values are assumptions; the horizon never predicts quantum-computer arrival.

Upload example:

~~~powershell
curl.exe -F "file=@repository.zip" -F "project_name=Uploaded demo" http://127.0.0.1:8000/api/scan/upload
~~~

## Local paths and storage

By default, the only permitted local path root is the bundled demo_repository. Configure extra roots before starting the server using a JSON array:

~~~powershell
$env:ECDAT_ALLOWED_ROOTS = '["C:/projects/ecdat/demo_repository","C:/projects/scan-targets"]'
$env:ECDAT_DATA_DIR = 'C:/projects/ecdat/.ecdat'
~~~

Paths are resolved and must stay within an allowed root. Local scanning snapshots supported source files into a controlled job directory before invoking the scanner. Symlinks/junctions inside the repository are rejected. The bundled demo endpoint uses the configured bundled demo directory independently of extra local roots.

The default database is <repository>/.ecdat/ecdat.sqlite3. SQLAlchemy stores scans and findings in two tables; findings contain JSON snapshots of the core finding, risk assessment, Mosca score and recommendation. The original CBOM is stored on the scan. Completed results survive application restart.

Worker sessions are independent. Findings, CBOM and COMPLETED status commit atomically. Incomplete jobs are marked FAILED on startup. This is a bounded in-process executor, not a durable task queue; no automatic retry or resume is implemented.

Job snapshots are removed after normal completion/failure. An abrupt process/machine termination can leave snapshots under .ecdat/jobs; these may contain original source and should be treated as private local data. No automatic deletion of persisted scan history is implemented.

## Status and progress

Stages are QUEUED, SCANNING, ASSESSING_RISK, GENERATING_CBOM, COMPLETED and FAILED.

progress_scope is current_stage. During SCANNING, progress is files processed / total supported files * 100. During ASSESSING_RISK, it is findings assessed / total findings * 100. It can reset when stages change. It is null while snapshotting or generating CBOM, because no measurable fractional progress is available. COMPLETED is 100. total_files is null until enumeration completes.

files_scanned counts supported files, including files with no findings. An empty/unsupported repository fails; a supported repository with zero cryptographic findings completes with zero findings. Duration includes queue time and snapshot preparation.

Result endpoints return 409 before COMPLETED, including a failed scan's status and error. Status polling is always available for an existing scan.

## Result definitions

Findings include the shared ScannerFinding fields plus file/line aliases, current_security, quantum_status, severity, reason, policy source/rule, full risk_assessment, mosca, mosca_priority, migration_priority and full migration_recommendation. Source paths are repository-relative, not temporary staging paths.

Summary values:
- total_findings counts occurrences, not deduplicated keys.
- current_critical_findings counts critical findings whose current security is broken/deprecated.
- high_findings counts all high-severity findings, including quantum concerns.
- quantum_migration_concerns counts vulnerable/migration_concern quantum statuses.
- acceptable_strong_findings counts current acceptable/strong primitives, even if quantum-vulnerable.
- Categories overlap by design. Languages come from scanned files, including those without findings.
- Algorithm distribution aggregates case/hyphen variants of actual findings; unresolved algorithms remain visible.

Roadmap:
- Act Now: broken/deprecated current security, immediate overall priority or Mosca ACT_NOW.
- Plan Migration: high/review-required priority or Mosca PLAN_NOW; planned migration without a Mosca MONITOR score.
- Monitor: Mosca MONITOR or low priority.
- No Urgent Action: remaining findings.
Within each group, findings sort by severity, Mosca urgency and source location. Each item preserves the full reason and recommendation. The separate overall migration_priority is retained, so a quantum asset can have planned migration with a MONITOR timing label.

Graph returns nodes and edges for future frontend layout. Crypto node data includes algorithm, severity, current security, quantum status and finding_id. Positions/UI layout are intentionally absent.

## Upload and output safety

Limits: 10 MiB compressed upload, 20 MiB total expanded bytes, 2 MiB per file, 2000 ZIP entries, 1000 supported source files, maximum expansion ratio 100:1. Multipart requests are bounded to the upload limit plus 64 KiB framing overhead, including streamed/chunked bodies.

Rejects traversal, absolute paths, drive paths, backslashes, Windows alternate streams/device names, case-insensitive duplicate paths, symlinks/special files, encrypted ZIPs and malformed archives. Extraction writes each member manually under a controlled directory.

The local path limits apply to supported source files; ZIP limits apply to every archive member. Default queue capacity is four outstanding jobs with two worker threads. A full queue returns 429.

PEM private-key detection suppresses all source evidence from that file before database persistence, CBOM generation or API responses. Binary/private-key formats outside the scanner's supported source formats are not parsed. This is not a general secret scrubber: other findings may contain sensitive source. Treat the local database and exports accordingly. CSV is raw evidence; import spreadsheet cells as text.

Known static-analysis limitations remain unchanged: heuristic JS/Java detection, limited Python dataflow, no TLS/config/certificate scanning, no binary analysis or execution. CBOM is the existing custom CryptoBOM schema, not certified CycloneDX.

## Errors

400: prohibited local path, invalid/unsafe ZIP or unsupported/empty ZIP.
413: upload too large.
404: unknown scan or finding.
409: results not ready or scan failed.
422: invalid UUID, body, context, pagination or export format.
429: bounded job queue full.
503: bundled demo missing.

Local snapshot, source parse/read or engine failures are recorded as FAILED with a safe message. Parser exception text is not returned because it may include source secrets.

## Tests

From repository root:

~~~powershell
.\.venv\Scripts\python -B -m pytest -q -p no:cacheprovider
~~~

The real API E2E test posts a demo scan, polls, fetches summary/findings/detail/CBOM/roadmap/graph and exports, and compares source identities/evidence to independent discovery. Tests also cover persistence/restart, queue progress, path/ZIP limits, non-execution, PEM redaction and error isolation.

Implementation references: https://fastapi.tiangolo.com/tutorial/background-tasks/ ; https://fastapi.tiangolo.com/tutorial/cors/ ; https://docs.sqlalchemy.org/en/20/dialects/sqlite.html

