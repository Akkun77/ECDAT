# ECDAT — Live Demo Checklist & Judge Presentation Runbook

This document is the official operational checklist for the Smart India Hackathon (SIH 2026) live demonstration of **ECDAT (Enterprise Cryptographic Discovery & Analysis Tool)**.

---

### 1. Exact Backend Launch Command

From the project root directory (`c:\Users\anime\OneDrive\Desktop\ecdat`) in PowerShell:

```powershell
# In Terminal 1
cd c:\Users\anime\OneDrive\Desktop\ecdat
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

Verify backend health:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -Method Get
# Expected output: status: ok
```

---

### 2. Exact Frontend Launch Command

From the frontend directory (`c:\Users\anime\OneDrive\Desktop\ecdat\frontend`) in PowerShell:

```powershell
# In Terminal 2
cd c:\Users\anime\OneDrive\Desktop\ecdat\frontend
npm run start -- -p 3000
```
*(Alternatively, for hot-reloading development mode: `npm run dev -- -p 3000`)*

Open your browser to: **`http://localhost:3000`**

---

### 3. Exact Live Demo Sequence

Follow this scripted 90-second to 3-minute sequence for judges:

1. **Step 1 — Landing & Problem Statement (Overview `/`)**:
   - Point to the headline: *"Discover the cryptography hidden inside your software."*
   - Explain the core SIH problem: Organizations have legacy and post-quantum cryptographic debt buried in source repositories without visibility or structured migration paths.
   - Click the prominent primary CTA: **[Scan Demo Repository]**.

2. **Step 2 — Real Scan Execution**:
   - Watch the animated progress banner transition through real stages: `SCANNING` $\rightarrow$ `ASSESSING_RISK` $\rightarrow$ `GENERATING_CBOM` $\rightarrow$ `COMPLETED`.
   - Point out that this is an actual static scan of 10 repository files (Python AST + Node.js + Java) executing in under 1 second.
   - Show the real hero metrics populated:
     - **50** Cryptographic Findings
     - **15** Critical Current Issues
     - **12** Quantum Migration Concerns
     - **10** Files Scanned
     - **3** Languages Detected

3. **Step 3 — Present-Day vs. Quantum Risk Distinction**:
   - Scroll to the **Current Security vs. Quantum Migration** two-column comparison.
   - Highlight the critical distinction: *An algorithm can be secure against today's classical attacks while still requiring future quantum migration.*
   - Point to the **Migration Readiness** strip showing the 4 priority tiers: *Act Now*, *Plan Migration*, *Monitor*, *No Urgent Action*.

4. **Step 4 — Findings Explorer (`/findings`)**:
   - Navigate to `/findings` from the sidebar.
   - Show the 50 real findings with filter pills (Severity, Current Security, Quantum Risk, Category).
   - **Exemplar A (Broken Classical Primitive)**:
     - Search or click **MD5** (`hasher.py:8`).
     - Show: Current Security = **Broken**, Quantum Risk = **Not Applicable**, Severity = **Critical**.
     - Recommendation: Migrate to SHA-256/SHA-3; use bcrypt/Argon2 for passwords.
   - **Exemplar B (Quantum Migration Concern)**:
     - Search or click **RSA-2048** (`auth.py:21`).
     - Show: Current Security = **Acceptable** (classical security intact), Quantum Risk = **Vulnerable** (Shor's algorithm threat).
     - Point to the **Mosca Analysis**: Data lifetime ($X=7$y) + Migration time ($Y=3$y) − Threat horizon ($Z=15$y), with the explicit note: *(demo assumption)*.
     - Show the context-aware recommendation: Plan migration toward **ML-KEM** (for key establishment) or **ML-DSA** (for signatures).
   - **Exemplar C (Strong Current & Quantum Posture)**:
     - Show **AES-256-GCM** (`encryption.py:17`): Current Security = **Strong**, Quantum Risk = **Low Concern**, Severity = **Informational**.
   - **Exemplar D (Security Hygiene)**:
     - Show **Hardcoded Secret** (`utils.py:10`): Tagged with `Security Hygiene Finding`, recommending dedicated vault/secrets management.

5. **Step 5 — Cryptographic Bill of Materials (`/cbom`)**:
   - Navigate to `/cbom`.
   - Show the structured tabular inventory (50 components) with Algorithm, Asset Type, Library, Operation, Key Size, File:Line, and Risk levels.
   - Click the **[Export JSON]** and **[Export CSV]** buttons to demonstrate real downloadable artifacts for procurement audits and CI/CD gating.

6. **Step 6 — Crypto Architecture Map (`/crypto-map`)**:
   - Navigate to `/crypto-map`.
   - Show the interactive React Flow visual graph mapping Application $\rightarrow$ Directories $\rightarrow$ Source Files $\rightarrow$ Cryptographic Primitives with color-coded severity nodes.
   - Demonstrate pan, zoom, and minimap navigation.

7. **Step 7 — Migration Roadmap (`/migration`)**:
   - Navigate to `/migration`.
   - Explain the 4 priority accordions (`Act Now`, `Plan Migration`, `Monitor`, `No Urgent Action`).
   - Highlight operation-specific guidance:
     - Signatures $\rightarrow$ **ML-DSA** (FIPS 204).
     - Key establishment $\rightarrow$ **ML-KEM** (FIPS 203).

---

### 4. Expected Demo Behavior

- **Scan Duration**: Between 0.45s and 0.85s for the bundled demo repository.
- **Finding Count**: Exactly 50 findings across 10 source files (`python_app`, `node_app`, `java_app`).
- **Severity Breakdown**: 15 Critical, 15 High, 5 Medium, 1 Low, 14 Informational.
- **Quantum Breakdown**: 12 Vulnerable / Migration Concern, 19 Low Concern, 19 Not Applicable.
- **Persistence**: Results are stored in SQLite (`.ecdat/ecdat.sqlite3`) and cached in browser `localStorage`. Refreshing any page preserves the full scan state.

---

### 5. Known Limitations

- **Local Single-User Deployment**: The prototype runs on loopback (`localhost:8000` / `localhost:3000`) for evaluation and demo safety; multi-tenant enterprise auth is out of scope.
- **Parser Coverage**: Python utilizes native AST parsing with import alias tracking. JavaScript and Java utilize static regex pattern matching.
- **Mosca Horizon**: Threat horizon ($Z=15$ years) and data lifetime ($X=5$–$10$ years) are configurable policy assumptions, not quantum arrival prophecies.

---

### 6. Backup Steps If Scan Fails

If clicking "Scan Demo Repository" does not complete within 5 seconds:
1. Open a PowerShell terminal and run:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8000/api/scan/demo" -Method Post -ContentType "application/json" -Body "{}"
   ```
2. Copy the returned `scan_id`.
3. In browser dev tools console (F12), type:
   ```javascript
   localStorage.setItem('ecdat_last_scan_id', '<YOUR_SCAN_ID>');
   window.location.reload();
   ```
4. The dashboard will automatically rehydrate the results from SQLite.

---

### 7. Backup Steps If Frontend Cannot Reach Backend

1. Verify backend port 8000 is listening:
   ```powershell
   Get-NetTCPConnection -LocalPort 8000
   ```
2. If port 8000 is not listening, restart backend:
   ```powershell
   cd c:\Users\anime\OneDrive\Desktop\ecdat
   python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
   ```
3. Verify CORS: the backend allows `http://localhost:3000`. Access the frontend through `http://localhost:3000` (not `127.0.0.1:3000`).

---

### 8. How to Reopen a Previously Successful Demo State

Because ECDAT stores results in SQLite and caches the active `scan_id` in browser `localStorage`:
- Simply open **`http://localhost:3000`** in Chrome/Edge.
- If a demo scan was previously executed, the application automatically rehydrates the findings, CBOM, graph, and migration plan on page load without needing to re-scan.

---

### 9. What NOT to Click or Change During the Live Presentation

1. **Do NOT enter invalid paths in "Local Path"**: Stick to the bundled demo repository or a known valid local folder.
2. **Do NOT upload non-ZIP or >10 MiB files**: The intake limit will safely reject them, but it interrupts demo flow.
3. **Do NOT change backend port 8000 or frontend port 3000**: CORS and API client are configured for `http://localhost:3000` $\leftrightarrow$ `http://localhost:8000`.
4. **Do NOT clear browser site data / cookies during demo**: Doing so clears `localStorage` caching and requires a re-scan.
