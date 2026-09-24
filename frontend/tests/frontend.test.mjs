import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatAlgorithm,
  formatSeverity,
  formatCurrentSecurity,
  formatQuantumRisk,
  formatOperation,
  moscaColor,
} from '../lib/display.ts';
import {
  buildExposureMap,
  buildExposureComparison,
  getAlgorithmDistribution,
  getAssetFamily,
  matchesExposureSelection,
} from '../lib/cbom.ts';
import {
  buildArchitectureModel,
  buildArchitecturePresentation,
  findArchitectureSearchResults,
} from '../lib/crypto-map.ts';

test('1. formatAlgorithm normalizes md5 to MD5', () => {
  assert.equal(formatAlgorithm('md5'), 'MD5');
});

test('2. formatAlgorithm normalizes sha1 to SHA-1', () => {
  assert.equal(formatAlgorithm('sha1'), 'SHA-1');
});

test('3. formatAlgorithm normalizes sha_1 to SHA-1', () => {
  assert.equal(formatAlgorithm('sha_1'), 'SHA-1');
});

test('4. formatAlgorithm normalizes uppercase SHA1 to SHA-1', () => {
  assert.equal(formatAlgorithm('SHA1'), 'SHA-1');
});

test('5. formatAlgorithm normalizes sha256 to SHA-256', () => {
  assert.equal(formatAlgorithm('sha256'), 'SHA-256');
});

test('6. formatAlgorithm normalizes sha_256 to SHA-256', () => {
  assert.equal(formatAlgorithm('sha_256'), 'SHA-256');
});

test('7. formatAlgorithm normalizes uppercase SHA256 to SHA-256', () => {
  assert.equal(formatAlgorithm('SHA256'), 'SHA-256');
});

test('8. formatAlgorithm normalizes sha512 to SHA-512', () => {
  assert.equal(formatAlgorithm('sha512'), 'SHA-512');
});

test('9. formatAlgorithm normalizes uppercase SHA512 to SHA-512', () => {
  assert.equal(formatAlgorithm('SHA512'), 'SHA-512');
});

test('10. formatAlgorithm normalizes hardcoded_secret to Hardcoded Secret', () => {
  assert.equal(formatAlgorithm('hardcoded_secret'), 'Hardcoded Secret');
});

test('11. formatAlgorithm normalizes HARD_CODED SECRET to Hardcoded Secret', () => {
  assert.equal(formatAlgorithm('HARD_CODED SECRET'), 'Hardcoded Secret');
});

test('12. formatAlgorithm normalizes HARDCODED_SECRET to Hardcoded Secret', () => {
  assert.equal(formatAlgorithm('HARDCODED_SECRET'), 'Hardcoded Secret');
});

test('13. formatAlgorithm normalizes des to DES', () => {
  assert.equal(formatAlgorithm('des'), 'DES');
});

test('14. formatAlgorithm normalizes 3des to 3DES', () => {
  assert.equal(formatAlgorithm('3des'), '3DES');
});

test('15. formatAlgorithm normalizes triple_des to 3DES', () => {
  assert.equal(formatAlgorithm('triple_des'), '3DES');
});

test('16. formatAlgorithm normalizes aes to AES', () => {
  assert.equal(formatAlgorithm('aes'), 'AES');
});

test('17. formatAlgorithm normalizes aes-gcm to AES-GCM', () => {
  assert.equal(formatAlgorithm('aes-gcm'), 'AES-GCM');
});

test('18. formatAlgorithm normalizes blowfish to Blowfish', () => {
  assert.equal(formatAlgorithm('blowfish'), 'Blowfish');
});

test('19. formatAlgorithm normalizes rc4 to RC4', () => {
  assert.equal(formatAlgorithm('rc4'), 'RC4');
});

test('20. formatAlgorithm preserves key size in RSA-2048', () => {
  assert.equal(formatAlgorithm('rsa-2048'), 'RSA-2048');
});

test('21. formatSeverity capitalizes severity levels', () => {
  assert.equal(formatSeverity('critical'), 'Critical');
  assert.equal(formatSeverity('high'), 'High');
  assert.equal(formatSeverity('informational'), 'Informational');
});

test('22. formatCurrentSecurity handles broken and deprecated', () => {
  assert.equal(formatCurrentSecurity('broken'), 'Broken');
  assert.equal(formatCurrentSecurity('deprecated'), 'Deprecated');
});

test('23. formatCurrentSecurity handles acceptable and strong', () => {
  assert.equal(formatCurrentSecurity('acceptable'), 'Acceptable');
  assert.equal(formatCurrentSecurity('strong'), 'Strong');
});

test('24. formatQuantumRisk handles vulnerable', () => {
  assert.equal(formatQuantumRisk('vulnerable'), 'Vulnerable');
});

test('25. formatQuantumRisk handles migration_concern and not_applicable', () => {
  assert.equal(formatQuantumRisk('migration_concern'), 'Migration Concern');
  assert.equal(formatQuantumRisk('not_applicable'), 'Not Applicable');
});

test('26. formatOperation formats signature to Digital Signature', () => {
  assert.equal(formatOperation('signature'), 'Digital Signature');
});

test('27. formatOperation formats asymmetric_encryption properly', () => {
  assert.equal(formatOperation('asymmetric_encryption'), 'Asymmetric Encryption');
  assert.equal(formatOperation('symmetric_encryption'), 'Symmetric Encryption');
});

test('28. moscaColor assigns distinct color classes based on urgency tier', () => {
  assert.equal(moscaColor('ACT_NOW'), 'text-red-400');
  assert.equal(moscaColor('PLAN_NOW'), 'text-amber-400');
  assert.equal(moscaColor('MONITOR'), 'text-emerald-400');
});


const findingsPage = readFileSync(new URL('../app/findings/page.tsx', import.meta.url), 'utf8');
const migrationPage = readFileSync(new URL('../app/migration/page.tsx', import.meta.url), 'utf8');

test('29. finding details render InteractiveMitigation component', () => {
  assert.match(findingsPage, /<InteractiveMitigation/);
});

test('30. migration roadmap renders InteractiveMitigation keeping mitigation and migration visible', () => {
  assert.match(migrationPage, /<InteractiveMitigation/);
  assert.match(interactiveMitigationFile, />Mitigate</);
  assert.match(interactiveMitigationFile, />Migrate</);
});

const interactiveMitigationFile = readFileSync(new URL('../components/interactive-mitigation.tsx', import.meta.url), 'utf8');

test('31. guidance cards guard long text from overflow', () => {
  assert.match(interactiveMitigationFile, /break-words/);
  assert.match(interactiveMitigationFile, /min-w-0/);
});

// Focused Mitigation Hub Tests
import { getStatusLabel, getMitigationSummaryLine } from '../lib/display.ts';

test('32. getStatusLabel derives IMMEDIATE for MD5 / broken algorithms', () => {
  const status = getStatusLabel('md5', 'broken', 'not_applicable', 'cryptographic');
  assert.equal(status.label, 'IMMEDIATE');
});

test('33. getStatusLabel derives PLAN for RSA / quantum-vulnerable algorithms', () => {
  const status = getStatusLabel('rsa', 'acceptable', 'vulnerable', 'cryptographic');
  assert.equal(status.label, 'PLAN');
});

test('33a. getStatusLabel derives IMMEDIATE for weak RSA key sizes', () => {
  const status = getStatusLabel('rsa', 'deprecated', 'vulnerable', 'cryptographic', 1024);
  assert.equal(status.label, 'IMMEDIATE');
});

test('34. getStatusLabel derives RETAIN for AES-256-GCM', () => {
  const status = getStatusLabel('aes-gcm', 'strong', 'low_concern', 'cryptographic');
  assert.equal(status.label, 'RETAIN');
});

test('35. getMitigationSummaryLine produces concise summary for MD5 and RSA', () => {
  assert.equal(
    getMitigationSummaryLine('md5', 'broken', 'not_applicable', null),
    'Stop security-sensitive MD5 use immediately.'
  );
  assert.equal(
    getMitigationSummaryLine('rsa', 'acceptable', 'vulnerable', 2048),
    'Reduce future migration exposure while compatibility planning begins.'
  );
  assert.equal(
    getMitigationSummaryLine('aes-256-gcm', 'strong', 'low_concern', 256),
    'Validate implementation controls; no cryptographic replacement required.'
  );
});

const sidebarFile = readFileSync(new URL('../components/sidebar.tsx', import.meta.url), 'utf8');
const mitigationHubPage = readFileSync(new URL('../app/mitigation/page.tsx', import.meta.url), 'utf8');
const scanPage = readFileSync(new URL('../app/scan/page.tsx', import.meta.url), 'utf8');
const cryptographicCore = readFileSync(new URL('../components/cryptographic-core.tsx', import.meta.url), 'utf8');
const exposureComparisonChart = readFileSync(new URL('../components/exposure-comparison-chart.tsx', import.meta.url), 'utf8');

test('36. sidebar navigation includes Mitigation Hub between Crypto Map and Migration Plan', () => {
  const cryptoMapIdx = sidebarFile.indexOf("href: '/crypto-map'");
  const mitigationIdx = sidebarFile.indexOf("href: '/mitigation'");
  const migrationIdx = sidebarFile.indexOf("href: '/migration'");
  assert.ok(cryptoMapIdx >= 0 && mitigationIdx > cryptoMapIdx && migrationIdx > mitigationIdx);
});

test('37. mitigation hub page includes metric cards, filters, and distinction explanation', () => {
  assert.match(mitigationHubPage, /Mitigation Hub/);
  assert.match(mitigationHubPage, /Understanding Mitigation vs\. Migration/);
  assert.match(mitigationHubPage, /Immediate Actions/);
  assert.match(mitigationHubPage, /InteractiveMitigation/);
  assert.match(mitigationHubPage, /actionStatusByFilter/);
});

test('38. algorithm distribution aggregates real CBOM components and sorts by count', () => {
  const distribution = getAlgorithmDistribution([
    { algorithm: 'RSA', name: 'RSA', category: 'cryptographic' },
    { algorithm: 'AES', name: 'AES', category: 'cryptographic' },
    { algorithm: 'RSA', name: 'RSA', category: 'cryptographic' },
    { algorithm: '', name: 'secret', category: 'security_hygiene' },
  ]);
  assert.deepEqual(distribution, [
    { algorithm: 'RSA', count: 2 },
    { algorithm: 'AES', count: 1 },
    { algorithm: 'Hardcoded Secret', count: 1 },
  ]);
});

test('39. exposure map keeps credentials and insecure randomness out of algorithm families', () => {
  const records = [
    { algorithm: 'RSA', name: 'RSA', source_file: 'src/auth.py', current_risk: 'acceptable', quantum_risk: 'vulnerable' },
    { algorithm: 'hardcoded_secret', name: 'hardcoded_secret', source_file: 'config/app.js', operation: 'secret_storage', current_risk: 'broken', quantum_risk: 'not_applicable' },
    { algorithm: 'insecure_random', name: 'insecure_random', source_file: 'src/token.java', current_risk: 'deprecated', quantum_risk: 'not_applicable' },
  ];
  const currentMap = buildExposureMap(records, 'current');

  assert.equal(getAssetFamily(records[0]), 'Public-key cryptography');
  assert.equal(getAssetFamily(records[1]), 'Credentials / secrets');
  assert.equal(getAssetFamily(records[2]), 'Insecure randomness');
  assert.deepEqual(
    currentMap.nodes.filter((node) => node.column === 'classification').map((node) => [node.value, node.count]),
    [['Acceptable', 1], ['Broken', 1], ['Deprecated', 1]],
  );
});

test('40. exposure map selection resolves to original CBOM records for inventory filtering', () => {
  const records = [
    { algorithm: 'RSA', name: 'RSA', source_file: 'src/auth.py', current_risk: 'acceptable', quantum_risk: 'vulnerable' },
    { algorithm: 'AES', name: 'AES', source_file: 'src/crypto.py', current_risk: 'strong', quantum_risk: 'low_concern' },
  ];
  const map = buildExposureMap(records, 'quantum');
  const selection = { type: 'link', sourceColumn: 'family', sourceValue: 'Public-key cryptography', targetColumn: 'classification', targetValue: 'Vulnerable' };

  assert.equal(matchesExposureSelection(0, map, selection), true);
  assert.equal(matchesExposureSelection(1, map, selection), false);
});

test('41. exposure comparison keeps security-hygiene findings separate from algorithms', () => {
  const rows = buildExposureComparison([
    { algorithm: 'RSA', name: 'RSA', current_risk: 'acceptable', quantum_risk: 'vulnerable' },
    { algorithm: 'RSA', name: 'RSA', current_risk: 'deprecated', quantum_risk: 'vulnerable' },
    { algorithm: 'hardcoded_secret', name: 'hardcoded_secret', operation: 'secret_storage', current_risk: 'deprecated', quantum_risk: 'not_applicable' },
    { algorithm: 'insecure_random', name: 'insecure_random', current_risk: 'deprecated', quantum_risk: 'not_applicable' },
  ]);

  assert.deepEqual(rows.find((row) => row.label === 'RSA'), {
    label: 'RSA', kind: 'algorithm', total: 2, currentConcernCount: 1, quantumConcernCount: 2, componentIndexes: [0, 1],
  });
  assert.equal(rows.find((row) => row.label === 'Hardcoded secret')?.kind, 'security_hygiene');
  assert.equal(rows.find((row) => row.label === 'Insecure randomness')?.currentConcernCount, 1);
  assert.equal(rows.find((row) => row.label === 'Hardcoded secret')?.quantumConcernCount, 0);
});

test('42. exposure comparison uses plotted Recharts views with an explicit zero baseline', () => {
  assert.match(exposureComparisonChart, /BarChart/);
  assert.match(exposureComparisonChart, /ScatterChart/);
  assert.match(exposureComparisonChart, /domain=\{\[0, maxValue\]\}/);
  assert.match(exposureComparisonChart, /Dumbbell/);
  assert.match(exposureComparisonChart, /not a missing or not-applicable value/);
});

test('43. Crypto Map architecture starts collapsed and reveals only selected real branches', () => {
  const graph = {
    scan_id: 'scan-1',
    nodes: [
      { id: 'app', type: 'application', data: { label: 'demo' } },
      { id: 'dir-py', type: 'directory', data: { label: 'python_app', path: 'python_app' } },
      { id: 'file-py', type: 'file', data: { label: 'auth.py', path: 'python_app/auth.py' } },
      { id: 'rsa', type: 'crypto', data: { label: 'rsa', finding_id: 'f-rsa', current_security: 'acceptable', quantum_status: 'vulnerable' } },
      { id: 'dir-java', type: 'directory', data: { label: 'java_app', path: 'java_app' } },
      { id: 'file-java', type: 'file', data: { label: 'Crypto.java', path: 'java_app/Crypto.java' } },
      { id: 'md5', type: 'crypto', data: { label: 'md5', finding_id: 'f-md5', current_security: 'broken', quantum_status: 'not_applicable' } },
    ],
    edges: [
      { id: 'app-py', source: 'app', target: 'dir-py' }, { id: 'dir-file-py', source: 'dir-py', target: 'file-py' }, { id: 'file-rsa', source: 'file-py', target: 'rsa' },
      { id: 'app-java', source: 'app', target: 'dir-java' }, { id: 'dir-file-java', source: 'dir-java', target: 'file-java' }, { id: 'file-md5', source: 'file-java', target: 'md5' },
    ],
  };
  const model = buildArchitectureModel(graph);
  const python = model.languages.find((language) => language.label === 'Python');
  assert.ok(python);
  assert.equal(python.currentConcernCount, 0);
  assert.equal(python.quantumConcernCount, 1);
  const collapsed = buildArchitecturePresentation(model, new Set(), new Set());
  assert.deepEqual(collapsed.nodes.map((node) => node.type), ['application', 'language', 'language']);
  const filesVisible = buildArchitecturePresentation(model, new Set([python.id]), new Set());
  assert.ok(filesVisible.nodes.some((node) => node.id === 'file-py'));
  assert.equal(filesVisible.nodes.some((node) => node.id === 'rsa'), false);
  const findingVisible = buildArchitecturePresentation(model, new Set([python.id]), new Set(['file-py']));
  assert.ok(findingVisible.nodes.some((node) => node.id === 'rsa'));
  assert.equal(findingVisible.nodes.some((node) => node.id === 'md5'), false);
});

test('44. Crypto Map search reveals hidden source and algorithm records', () => {
  const graph = {
    scan_id: 'scan-2',
    nodes: [
      { id: 'app', type: 'application', data: { label: 'demo' } },
      { id: 'file-js', type: 'file', data: { label: 'crypto.js', path: 'node_app/crypto.js' } },
      { id: 'md5', type: 'crypto', data: { label: 'md5', finding_id: 'f-md5', current_security: 'broken', quantum_status: 'not_applicable' } },
    ],
    edges: [{ id: 'app-file', source: 'app', target: 'file-js' }, { id: 'file-md5', source: 'file-js', target: 'md5' }],
  };
  const model = buildArchitectureModel(graph);
  const byFile = findArchitectureSearchResults(model, 'crypto.js', new Map([['f-md5', { file: 'node_app/crypto.js', line: 9, operation: 'hash' }]]));
  const byAlgorithm = findArchitectureSearchResults(model, 'md5', new Map([['f-md5', { file: 'node_app/crypto.js', line: 9, operation: 'hash' }]]));
  assert.equal(byFile[0]?.type, 'file');
  assert.equal(byAlgorithm[0]?.type, 'finding');
});

test('45. scan page uses an honest lifecycle pipeline rather than a simulated fallback percentage', () => {
  assert.match(scanPage, /Scanning repository and analyzing cryptography/);
  assert.match(scanPage, /Workflow stages are illustrative/);
  assert.doesNotMatch(scanPage, /: 45%/);
});

test('46. Guided scan hero keeps its product workflow and risk narrative explicit', () => {
  assert.match(cryptographicCore, /auth\.py/);
  assert.match(cryptographicCore, /SCAN & PARSE/);
  assert.match(cryptographicCore, /Hardcoded Secret/);
  assert.match(cryptographicCore, /CBOM inventory/);
  assert.match(cryptographicCore, /Current security/);
  assert.match(cryptographicCore, /Quantum risk/);
  assert.match(cryptographicCore, /MD5 is broken/);
  assert.match(cryptographicCore, /quantum exposure/);
  assert.match(cryptographicCore, /Retain AES-256-GCM/);
  assert.match(cryptographicCore, /ML-KEM\/hybrid/);
  assert.match(cryptographicCore, /not automatic fixing or runtime proof/);
  assert.match(cryptographicCore, /IntersectionObserver/);
  assert.match(cryptographicCore, /prefers-reduced-motion/);
});
