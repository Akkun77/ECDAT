import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatAlgorithm,
  formatSeverity,
  formatCurrentSecurity,
  formatQuantumRisk,
  formatOperation,
  severityColor,
  severityBg,
  currentSecurityColor,
  quantumRiskColor,
  moscaColor,
  moscaBg,
} from '../lib/display.ts';

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
  assert.equal(moscaColor('MONITOR'), 'text-green-400');
});


const findingsPage = readFileSync(new URL('../app/findings/page.tsx', import.meta.url), 'utf8');
const migrationPage = readFileSync(new URL('../app/migration/page.tsx', import.meta.url), 'utf8');

test('29. finding details render mitigation before migration', () => {
  const mitigation = findingsPage.indexOf('Mitigation Guidance');
  const migration = findingsPage.indexOf('Migration — Target Cryptographic State');
  assert.ok(mitigation >= 0 && migration > mitigation);
  assert.match(findingsPage, /mitigation && \(/);
});

test('30. migration roadmap keeps mitigation and migration visible', () => {
  assert.match(migrationPage, /> Mitigate/);
  assert.match(migrationPage, /> Migrate/);
  assert.match(migrationPage, /mitigation \? \(/);
  assert.match(migrationPage, /No structured mitigation is available/);
});

test('31. guidance cards guard long text from overflow', () => {
  assert.match(findingsPage, /break-words/);
  assert.match(findingsPage, /min-w-0/);
  assert.match(migrationPage, /break-words/);
  assert.match(migrationPage, /min-w-0/);
});

// Focused Mitigation Hub Tests
import { getStatusLabel, getMitigationSummaryLine } from '../components/interactive-mitigation.tsx';

test('32. getStatusLabel derives IMMEDIATE for MD5 / broken algorithms', () => {
  const status = getStatusLabel('md5', 'broken', 'not_applicable', 'cryptographic');
  assert.equal(status.label, 'IMMEDIATE');
});

test('33. getStatusLabel derives PLAN for RSA / quantum-vulnerable algorithms', () => {
  const status = getStatusLabel('rsa', 'acceptable', 'vulnerable', 'cryptographic');
  assert.equal(status.label, 'PLAN');
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
});

