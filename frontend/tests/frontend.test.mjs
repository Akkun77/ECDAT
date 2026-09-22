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
