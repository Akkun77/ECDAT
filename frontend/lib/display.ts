// Display name normalization
export function formatAlgorithm(algo?: string | null): string {
  if (!algo) return '';
  const map: Record<string, string> = {
    'md5': 'MD5',
    'sha1': 'SHA-1',
    'sha_1': 'SHA-1',
    'sha-1': 'SHA-1',
    'sha224': 'SHA-224',
    'sha_224': 'SHA-224',
    'sha-224': 'SHA-224',
    'sha256': 'SHA-256',
    'sha_256': 'SHA-256',
    'sha-256': 'SHA-256',
    'sha384': 'SHA-384',
    'sha_384': 'SHA-384',
    'sha-384': 'SHA-384',
    'sha512': 'SHA-512',
    'sha_512': 'SHA-512',
    'sha-512': 'SHA-512',
    'rsa': 'RSA',
    'ecdsa': 'ECDSA',
    'ecc': 'ECC',
    'des': 'DES',
    '3des': '3DES',
    'tripledes': '3DES',
    'triple_des': '3DES',
    'aes': 'AES',
    'aes-gcm': 'AES-GCM',
    'aes_gcm': 'AES-GCM',
    'blowfish': 'Blowfish',
    'rc4': 'RC4',
    'arc4': 'RC4',
    'ecb': 'ECB',
    'hardcoded_secret': 'Hardcoded Secret',
    'hard_coded_secret': 'Hardcoded Secret',
    'hardcoded secret': 'Hardcoded Secret',
    'hardcodedsecret': 'Hardcoded Secret',
    'insecure_random': 'Insecure Random',
    'insecure random': 'Insecure Random',
    'tls_1_0': 'TLS 1.0',
    'tls_1_1': 'TLS 1.1',
    'ssl_v3': 'SSLv3',
    'tls_1_2': 'TLS 1.2',
    'tls_1_3': 'TLS 1.3',
  };
  const lower = algo.toLowerCase().replace(/[_\s-]+/g, '_');
  if (map[lower]) return map[lower];
  // Try with key size: "RSA-2048" -> "RSA-2048"
  if (algo.includes('-') && /\d/.test(algo)) return algo.toUpperCase();
  return algo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatSeverity(severity?: string | null): string {
  if (!severity) return 'Unknown';
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

export function formatCurrentSecurity(status?: string | null): string {
  if (!status) return 'Unknown';
  const map: Record<string, string> = {
    'broken': 'Broken',
    'deprecated': 'Deprecated',
    'acceptable': 'Acceptable',
    'strong': 'Strong',
    'review_required': 'Review Required',
  };
  return map[status.toLowerCase()] || status;
}

export function formatQuantumRisk(status?: string | null): string {
  if (!status) return 'Unknown';
  const map: Record<string, string> = {
    'vulnerable': 'Vulnerable',
    'migration_concern': 'Migration Concern',
    'low_concern': 'Low Concern',
    'not_applicable': 'Not Applicable',
    'review_required': 'Review Required',
  };
  return map[status.toLowerCase()] || status;
}

export function formatOperation(op?: string | null): string {
  if (!op) return 'Unknown';
  const map: Record<string, string> = {
    'hash': 'Hash',
    'symmetric_encryption': 'Symmetric Encryption',
    'asymmetric_encryption': 'Asymmetric Encryption',
    'key_generation': 'Key Generation',
    'key_exchange': 'Key Exchange',
    'signature': 'Digital Signature',
    'random_number_generation': 'Random Generation',
    'certificate': 'Certificate',
    'protocol': 'Protocol',
    'secret_storage': 'Secret Storage',
    'unknown': 'Unknown',
  };
  return map[op.toLowerCase()] || op;
}

// Color utilities for Tailwind classes following the approved semantic palette
export function severityColor(severity?: string | null): string {
  if (!severity) return 'text-slate-400';
  const colors: Record<string, string> = {
    'critical': 'text-red-400',
    'high': 'text-amber-400',
    'medium': 'text-amber-400',
    'low': 'text-blue-400',
    'informational': 'text-slate-400',
  };
  return colors[severity.toLowerCase()] || 'text-slate-400';
}

export const getSeverityColor = severityColor;

export function severityBg(severity?: string | null): string {
  if (!severity) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const colors: Record<string, string> = {
    'critical': 'bg-red-500/10 text-red-400 border-red-500/30',
    'high': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'medium': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'low': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'informational': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return colors[severity.toLowerCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

export function currentSecurityColor(status?: string | null): string {
  if (!status) return 'text-slate-400';
  const colors: Record<string, string> = {
    'broken': 'text-red-400',
    'deprecated': 'text-amber-400',
    'acceptable': 'text-emerald-400',
    'strong': 'text-emerald-400',
    'review_required': 'text-amber-400',
  };
  return colors[status.toLowerCase()] || 'text-slate-400';
}

export function quantumRiskColor(status?: string | null): string {
  if (!status) return 'text-slate-400';
  const colors: Record<string, string> = {
    'vulnerable': 'text-red-400',
    'migration_concern': 'text-amber-400',
    'low_concern': 'text-emerald-400',
    'not_applicable': 'text-slate-500',
    'review_required': 'text-amber-400',
  };
  return colors[status.toLowerCase()] || 'text-slate-400';
}

export function moscaColor(label?: string | null): string {
  if (!label) return 'text-emerald-400';
  if (label === 'ACT_NOW') return 'text-red-400';
  if (label === 'PLAN_NOW') return 'text-amber-400';
  return 'text-emerald-400';
}

export function moscaBg(label?: string | null): string {
  if (!label) return 'bg-emerald-500/10 border-emerald-500/20';
  if (label === 'ACT_NOW') return 'bg-red-500/10 border-red-500/30';
  if (label === 'PLAN_NOW') return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-emerald-500/10 border-emerald-500/20';
}
