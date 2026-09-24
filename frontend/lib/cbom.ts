import type { CBOMComponent } from '@/types/api';

export type AlgorithmDistributionItem = {
  algorithm: string;
  count: number;
};

export type ExposureMode = 'current' | 'quantum';
export type ExposureColumn = 'language' | 'family' | 'classification';

export type ExposureSelection =
  | { type: 'node'; column: ExposureColumn; value: string }
  | {
      type: 'link';
      sourceColumn: ExposureColumn;
      sourceValue: string;
      targetColumn: ExposureColumn;
      targetValue: string;
    };

export type ExposureRecord = {
  componentIndex: number;
  language: string;
  family: string;
  classification: string;
  assetLabel: string;
};

export type ExposureNode = {
  id: string;
  column: ExposureColumn;
  value: string;
  count: number;
  componentIndexes: number[];
};

export type ExposureLink = {
  id: string;
  sourceColumn: ExposureColumn;
  sourceValue: string;
  targetColumn: ExposureColumn;
  targetValue: string;
  count: number;
  componentIndexes: number[];
};

export type ExposureMap = {
  mode: ExposureMode;
  records: ExposureRecord[];
  nodes: ExposureNode[];
  links: ExposureLink[];
};

export type ExposureComparisonRow = {
  label: string;
  kind: 'algorithm' | 'security_hygiene';
  total: number;
  currentConcernCount: number;
  quantumConcernCount: number;
  componentIndexes: number[];
};

type LooseComponent = CBOMComponent & Record<string, unknown>;

const normalized = (value?: string | null) =>
  (value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const valueOrUnknown = (value?: string | null, fallback = 'Unknown') =>
  value?.trim() || fallback;

function isHardcodedSecret(component: LooseComponent) {
  const algorithm = normalized(component.algorithm || component.name);
  const operation = normalized(component.operation);
  return component.category === 'security_hygiene'
    || algorithm === 'hardcodedsecret'
    || operation === 'secretstorage';
}

function isInsecureRandomness(component: LooseComponent) {
  return normalized(component.algorithm || component.name) === 'insecurerandom';
}

export function getComponentAssetLabel(component: LooseComponent): string {
  if (isHardcodedSecret(component)) return 'Hardcoded secret';
  if (isInsecureRandomness(component)) return 'Insecure randomness';
  return valueOrUnknown(component.algorithm || component.name, 'Unknown asset');
}

/**
 * Canonical labels are used only for compact summary counts. The map and table
 * keep every source record separate, so variant evidence is never discarded.
 */
export function getCanonicalAlgorithmName(component: LooseComponent): string | null {
  if (isHardcodedSecret(component) || isInsecureRandomness(component)) return null;
  const raw = valueOrUnknown(component.algorithm || component.name, '');
  const algorithm = normalized(raw);
  const known: Record<string, string> = {
    rsa: 'RSA',
    aes: 'AES',
    des: 'DES',
    md5: 'MD5',
    ecc: 'ECC',
    ecb: 'ECB',
    rc4: 'RC4',
    sha1: 'SHA-1',
    sha224: 'SHA-224',
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
    tripledes: '3DES',
    '3des': '3DES',
  };
  return known[algorithm] || raw || null;
}

function comparisonLabel(component: LooseComponent) {
  if (isHardcodedSecret(component)) return 'Hardcoded secret';
  if (isInsecureRandomness(component)) return 'Insecure randomness';
  return getCanonicalAlgorithmName(component) || 'Unknown asset';
}

function isCurrentConcern(component: LooseComponent) {
  const risk = normalized(String(component.current_risk || component.current_security || ''));
  return risk === 'broken' || risk === 'deprecated' || risk === 'reviewrequired';
}

function isQuantumConcern(component: LooseComponent) {
  const risk = normalized(component.quantum_risk);
  return risk === 'vulnerable' || risk === 'migrationconcern';
}

/**
 * A compact comparison of source findings. Security-hygiene findings are not
 * coerced into algorithms, and each row retains its source-record indexes.
 */
export function buildExposureComparison(components: LooseComponent[]): ExposureComparisonRow[] {
  const rows = new Map<string, ExposureComparisonRow>();

  components.forEach((component, componentIndex) => {
    const label = comparisonLabel(component);
    const kind = isHardcodedSecret(component) || isInsecureRandomness(component)
      ? 'security_hygiene'
      : 'algorithm';
    const existing = rows.get(label) || {
      label,
      kind,
      total: 0,
      currentConcernCount: 0,
      quantumConcernCount: 0,
      componentIndexes: [],
    };
    existing.total += 1;
    existing.currentConcernCount += isCurrentConcern(component) ? 1 : 0;
    existing.quantumConcernCount += isQuantumConcern(component) ? 1 : 0;
    existing.componentIndexes.push(componentIndex);
    rows.set(label, existing);
  });

  return [...rows.values()].sort((a, b) =>
    Math.max(b.currentConcernCount, b.quantumConcernCount)
      - Math.max(a.currentConcernCount, a.quantumConcernCount)
      || b.total - a.total
      || a.label.localeCompare(b.label),
  );
}

export function getSourceLanguage(component: LooseComponent): string {
  const source = (component.source_file || '').toLowerCase();
  const extension = source.match(/\.([a-z0-9]+)$/)?.[1];
  if (extension === 'py') return 'Python';
  if (extension === 'java') return 'Java';
  if (['js', 'jsx', 'mjs', 'cjs'].includes(extension || '')) return 'JavaScript';
  if (['ts', 'tsx'].includes(extension || '')) return 'TypeScript';
  return source ? 'Other source' : 'Unknown source';
}

export function getAssetFamily(component: LooseComponent): string {
  if (isHardcodedSecret(component)) return 'Credentials / secrets';
  if (isInsecureRandomness(component)) return 'Insecure randomness';

  const algorithm = normalized(component.algorithm || component.name);
  if (['rsa', 'dsa', 'ecdsa', 'ecdh', 'ecc', 'dh', 'ed25519', 'ed448'].includes(algorithm)) {
    return 'Public-key cryptography';
  }
  if (['aes', 'des', '3des', 'tripledes', 'rc4', 'blowfish', 'chacha20', 'chacha'].includes(algorithm)) {
    return 'Symmetric cryptography';
  }
  if (['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'sha3', 'bcrypt', 'scrypt', 'argon2'].includes(algorithm)) {
    return 'Hash functions';
  }
  if (['hmac', 'cmac', 'poly1305'].includes(algorithm)) return 'Message authentication';
  if (['x509', 'certificate', 'tls', 'ssl'].includes(algorithm)) return 'Certificates / protocols';
  return algorithm ? 'Unclassified cryptographic asset' : 'Unknown asset category';
}

export function getCurrentClassification(component: LooseComponent): string {
  const risk = normalized(String(component.current_risk || component.current_security || ''));
  if (risk === 'broken') return 'Broken';
  if (risk === 'deprecated') return 'Deprecated';
  if (risk === 'acceptable') return 'Acceptable';
  if (risk === 'strong') return 'Strong';
  if (risk === 'reviewrequired') return 'Review required';
  if (risk === 'unknown') return 'Unknown';
  return 'Not assessed';
}

export function getQuantumClassification(component: LooseComponent): string {
  const risk = normalized(component.quantum_risk);
  if (risk === 'vulnerable') return 'Vulnerable';
  if (risk === 'migrationconcern') return 'Migration concern';
  if (risk === 'lowconcern') return 'Low concern';
  if (risk === 'reviewrequired') return 'Review required';
  if (risk === 'notapplicable') return 'Not applicable';
  if (risk === 'unknown') return 'Unknown';
  return 'Not assessed';
}

export function getExposureRecords(components: LooseComponent[], mode: ExposureMode): ExposureRecord[] {
  return components.map((component, componentIndex) => ({
    componentIndex,
    language: getSourceLanguage(component),
    family: getAssetFamily(component),
    classification: mode === 'current'
      ? getCurrentClassification(component)
      : getQuantumClassification(component),
    assetLabel: getComponentAssetLabel(component),
  }));
}

function nodeId(column: ExposureColumn, value: string) {
  return `${column}:${value}`;
}

function linkId(
  sourceColumn: ExposureColumn,
  sourceValue: string,
  targetColumn: ExposureColumn,
  targetValue: string,
) {
  return `${nodeId(sourceColumn, sourceValue)}>${nodeId(targetColumn, targetValue)}`;
}

export function buildExposureMap(components: LooseComponent[], mode: ExposureMode): ExposureMap {
  const records = getExposureRecords(components, mode);
  const nodeBuckets = new Map<string, ExposureNode>();
  const linkBuckets = new Map<string, ExposureLink>();

  const addNode = (column: ExposureColumn, value: string, componentIndex: number) => {
    const id = nodeId(column, value);
    const existing = nodeBuckets.get(id) || { id, column, value, count: 0, componentIndexes: [] };
    existing.count += 1;
    existing.componentIndexes.push(componentIndex);
    nodeBuckets.set(id, existing);
  };

  const addLink = (
    sourceColumn: ExposureColumn,
    sourceValue: string,
    targetColumn: ExposureColumn,
    targetValue: string,
    componentIndex: number,
  ) => {
    const id = linkId(sourceColumn, sourceValue, targetColumn, targetValue);
    const existing = linkBuckets.get(id) || {
      id,
      sourceColumn,
      sourceValue,
      targetColumn,
      targetValue,
      count: 0,
      componentIndexes: [],
    };
    existing.count += 1;
    existing.componentIndexes.push(componentIndex);
    linkBuckets.set(id, existing);
  };

  for (const record of records) {
    addNode('language', record.language, record.componentIndex);
    addNode('family', record.family, record.componentIndex);
    addNode('classification', record.classification, record.componentIndex);
    addLink('language', record.language, 'family', record.family, record.componentIndex);
    addLink('family', record.family, 'classification', record.classification, record.componentIndex);
  }

  const byCount = <T extends { count: number }>(a: T, b: T) =>
    b.count - a.count || JSON.stringify(a).localeCompare(JSON.stringify(b));

  return {
    mode,
    records,
    nodes: [...nodeBuckets.values()].sort(byCount),
    links: [...linkBuckets.values()].sort(byCount),
  };
}

export function matchesExposureSelection(
  componentIndex: number,
  map: ExposureMap,
  selection: ExposureSelection | null,
): boolean {
  if (!selection) return true;
  const record = map.records.find((item) => item.componentIndex === componentIndex);
  if (!record) return false;
  const valueFor = (column: ExposureColumn) => record[column];
  if (selection.type === 'node') return valueFor(selection.column) === selection.value;
  return valueFor(selection.sourceColumn) === selection.sourceValue
    && valueFor(selection.targetColumn) === selection.targetValue;
}

export function getAlgorithmDistribution(components: CBOMComponent[]): AlgorithmDistributionItem[] {
  const counts = new Map<string, number>();

  for (const component of components) {
    const algorithm = component.category === 'security_hygiene'
      ? 'Hardcoded Secret'
      : component.algorithm || component.name || 'Unknown';
    counts.set(algorithm, (counts.get(algorithm) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([algorithm, count]) => ({ algorithm, count }))
    .sort((a, b) => b.count - a.count || a.algorithm.localeCompare(b.algorithm));
}
