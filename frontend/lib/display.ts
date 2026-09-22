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

export function getStatusLabel(
  algorithm?: string | null,
  currentSecurity?: string | null,
  quantumStatus?: string | null,
  category?: string | null
): { label: 'IMMEDIATE' | 'PLAN' | 'VALIDATE' | 'RETAIN'; color: string; bg: string; border: string } {
  const algo = (algorithm || '').toLowerCase().replace(/[-_\s]+/g, '');
  const cs = (currentSecurity || '').toLowerCase();
  const qs = (quantumStatus || '').toLowerCase();

  if (category === 'security_hygiene' || algo.includes('secret') || cs === 'broken' || ['md5', 'sha1', 'des', '3des', 'rc4'].includes(algo)) {
    return {
      label: 'IMMEDIATE',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    };
  }

  if (qs === 'vulnerable' || qs === 'migration_concern' || ['rsa', 'ecdsa', 'ecc'].includes(algo)) {
    return {
      label: 'PLAN',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    };
  }

  if (algo.includes('aes') && (cs === 'strong' || cs === 'acceptable') && (qs === 'low_concern' || qs === 'not_applicable')) {
    return {
      label: 'RETAIN',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    };
  }

  return {
    label: 'VALIDATE',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  };
}

export function getMitigationSummaryLine(
  algorithm?: string | null,
  currentSecurity?: string | null,
  quantumStatus?: string | null,
  keySize?: number | null,
  defaultAction?: string | null
): string {
  const algo = (algorithm || '').toLowerCase();
  const cs = (currentSecurity || '').toLowerCase();

  if (algo === 'md5') {
    return 'Stop security-sensitive MD5 use immediately.';
  }
  if (algo === 'sha1' || algo === 'sha-1') {
    return 'Stop introducing new security-sensitive SHA-1 usage.';
  }
  if (algo.includes('rsa') && keySize && keySize < 2048) {
    return 'Treat weak RSA key size as an immediate current-security priority.';
  }
  if (algo.includes('rsa')) {
    return 'Reduce future migration exposure while compatibility planning begins.';
  }
  if (algo.includes('ecdsa') || algo.includes('ecc')) {
    return 'Plan post-quantum migration for public-key elliptic curve dependencies.';
  }
  if (algo.includes('aes') && keySize === 256) {
    return 'Validate implementation controls; no cryptographic replacement required.';
  }
  if (algo.includes('des') || algo.includes('3des') || cs === 'broken') {
    return 'Stop deprecated algorithm usage and isolate dependent legacy systems.';
  }
  if (defaultAction) {
    return defaultAction;
  }
  return 'Apply interim controls while long-term post-quantum migration is prepared.';
}

