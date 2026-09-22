'use client';

import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, severityBg, currentSecurityColor, quantumRiskColor, moscaColor, moscaBg } from '@/lib/display';
import { Shield, Search, BarChart3, ArrowRightLeft, FileText, Network, ChevronRight, Zap, Eye, Target, Route, ListChecks, Boxes } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

function MetricCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
      <div className={`text-4xl font-bold mb-1 ${accent || 'text-slate-100'}`}>{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, href }: { icon: React.ElementType; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group bg-slate-800/30 border border-slate-700/40 rounded-xl p-6 hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 mt-1 transition-colors" />
      </div>
    </Link>
  );
}

function RiskComparisonSection() {
  const { findings } = useScanContext();
  if (findings.length === 0) return null;

  const currentCounts = { broken: 0, deprecated: 0, acceptable: 0, strong: 0 };
  const quantumCounts = { vulnerable: 0, migration_concern: 0, low_concern: 0, not_applicable: 0 };

  findings.forEach(f => {
    const cs = f.current_security as keyof typeof currentCounts;
    const qs = f.quantum_status as keyof typeof quantumCounts;
    if (cs in currentCounts) currentCounts[cs]++;
    if (qs in quantumCounts) quantumCounts[qs]++;
  });

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Current Security vs. Quantum Migration</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          An algorithm can be secure against today&apos;s attacks while still requiring future quantum migration.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Security */}
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" /> Current Security
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Broken', count: currentCounts.broken, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Deprecated', count: currentCounts.deprecated, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Acceptable', count: currentCounts.acceptable, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Strong', count: currentCounts.strong, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.bg} border ${item.color.replace('text-', 'border-')}`} />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <span className={`text-lg font-semibold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quantum Migration */}
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Quantum Migration
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Vulnerable', count: quantumCounts.vulnerable, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Migration Concern', count: quantumCounts.migration_concern, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Low Concern', count: quantumCounts.low_concern, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Not Applicable', count: quantumCounts.not_applicable, color: 'text-slate-500', bg: 'bg-slate-500/10' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.bg} border ${item.color.replace('text-', 'border-')}`} />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <span className={`text-lg font-semibold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MigrationReadinessSection() {
  const { migration } = useScanContext();
  if (!migration) return null;

  const groupStyles: Record<string, { color: string; bg: string; icon: string }> = {
    'Act Now': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '🔴' },
    'Plan Migration': { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: '🟡' },
    'Monitor': { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '🔵' },
    'No Urgent Action': { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: '🟢' },
  };

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Migration Readiness</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          ECDAT combines technical risk with migration planning so organizations can decide what to fix first.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {migration.groups.map(group => {
          const style = groupStyles[group.name] || groupStyles['Monitor'];
          return (
            <div key={group.name} className={`border rounded-xl p-5 text-center ${style.bg}`}>
              <div className={`text-3xl font-bold mb-1 ${style.color}`}>{group.count}</div>
              <div className="text-sm text-slate-300 font-medium">{group.name}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-500">
          Migration urgency considers data lifetime, migration time, a configurable threat horizon, and business criticality.
          Demo values are clearly marked as assumptions.
        </p>
      </div>
    </section>
  );
}

function CBOMPreviewSection() {
  const { cbom, scanId } = useScanContext();
  if (!cbom) return null;

  const components = cbom.components || [];
  const uniqueAlgos = new Set(components.map((c: { algorithm: string }) => c.algorithm));
  const criticalCount = components.filter((c: { severity: string }) => c.severity === 'critical').length;
  const quantumCount = components.filter((c: { quantum_risk: string }) => c.quantum_risk === 'vulnerable' || c.quantum_risk === 'migration_concern').length;

  return (
    <section className="mb-12">
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" /> Cryptographic Bill of Materials
            </h2>
            <p className="text-slate-400">An ingredient list of the cryptography used across your application.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-100">{components.length}</div>
            <div className="text-xs text-slate-400">Crypto Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{uniqueAlgos.size}</div>
            <div className="text-xs text-slate-400">Unique Algorithms</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-xs text-slate-400">Critical Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{quantumCount}</div>
            <div className="text-xs text-slate-400">Quantum Concerns</div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/cbom" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            Open CBOM
          </Link>
          {scanId && (
            <>
              <a href={api.exportJson(scanId)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors" download>
                Export JSON
              </a>
              <a href={api.exportCsv(scanId)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors" download>
                Export CSV
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CryptoMapPreview() {
  const { graph } = useScanContext();
  if (!graph) return null;

  const cryptoNodes = graph.nodes.filter(n => n.type === 'crypto');
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  cryptoNodes.forEach(n => {
    const s = n.data.severity as keyof typeof severityCounts;
    if (s in severityCounts) severityCounts[s]++;
  });

  return (
    <section className="mb-12">
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Network className="w-6 h-6 text-blue-400" /> Crypto Architecture Map
            </h2>
            <p className="text-slate-400">See exactly where cryptography lives across the application and how each component contributes to risk.</p>
          </div>
        </div>
        <div className="flex items-center gap-8 mb-6 text-sm">
          <span className="text-slate-400">{graph.nodes.length} nodes</span>
          <span className="text-slate-400">{graph.edges.length} edges</span>
          <span className="text-red-400">{severityCounts.critical} critical</span>
          <span className="text-orange-400">{severityCounts.high} high</span>
          <span className="text-green-400">{severityCounts.low + severityCounts.informational} acceptable</span>
        </div>
        <Link href="/crypto-map" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          Explore Crypto Map <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const { state, summary, findings, scanStatus, startDemoScan, error } = useScanContext();
  const hasResults = state === 'completed' && summary;
  const isScanning = state === 'scanning';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          <Shield className="w-3.5 h-3.5" /> Enterprise Cryptographic Discovery & Analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4 leading-tight">
          Discover the cryptography <br />hidden inside your software.
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
          ECDAT scans source repositories, builds a Cryptographic Bill of Materials, separates present-day security risk from quantum migration risk, and creates a prioritized migration roadmap.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={startDemoScan}
            disabled={isScanning}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            {isScanning ? 'Scanning...' : 'Scan Demo Repository'}
          </button>
          <Link
            href="/scan"
            className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-base font-medium transition-all duration-200 border border-slate-700"
          >
            Upload Repository
          </Link>
          {hasResults && (
            <Link
              href="/crypto-map"
              className="px-6 py-3.5 text-slate-400 hover:text-slate-200 text-base font-medium transition-colors"
            >
              View Crypto Map →
            </Link>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 inline-block">
            {error}
          </div>
        )}
      </section>

      {/* Scan Progress */}
      {isScanning && scanStatus && (
        <section className="mb-12">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-200">
                  {scanStatus.stage === 'SCANNING' ? 'Scanning files...' :
                   scanStatus.stage === 'ASSESSING_RISK' ? 'Assessing risk...' :
                   scanStatus.stage === 'GENERATING_CBOM' ? 'Generating CBOM...' :
                   scanStatus.stage}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {scanStatus.files_scanned} / {scanStatus.total_files || '?'} files
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${scanStatus.progress ? Math.min(scanStatus.progress * 100, 100) : 30}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Hero Metrics */}
      {hasResults && summary && (
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard value={summary.total_findings} label="Crypto Findings" accent="text-blue-400" />
            <MetricCard value={summary.current_critical_findings} label="Critical Now" accent="text-red-400" />
            <MetricCard value={summary.quantum_migration_concerns} label="Quantum Concerns" accent="text-amber-400" />
            <MetricCard value={summary.files_scanned} label="Files Scanned" />
            <MetricCard value={summary.languages_detected.length} label="Languages" />
            <MetricCard value={`${summary.scan_duration_seconds.toFixed(2)}s`} label="Scan Duration" />
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Eye}
            title="Discover"
            description="Find algorithms, libraries, key sizes and call sites directly in source code."
            href="/findings"
          />
          <FeatureCard
            icon={Boxes}
            title="Inventory"
            description="Build a structured cryptographic bill of materials from discovered evidence."
            href="/cbom"
          />
          <FeatureCard
            icon={Target}
            title="Assess"
            description="Separate current security weaknesses from future quantum migration exposure."
            href="/findings"
          />
          <FeatureCard
            icon={Route}
            title="Prioritize"
            description="Use Mosca-style migration planning and business criticality to decide what moves first."
            href="/migration"
          />
          <FeatureCard
            icon={ListChecks}
            title="Mitigate"
            description="Reduce immediate exposure before migration."
            href="/migration"
          />
          <FeatureCard
            icon={ArrowRightLeft}
            title="Migrate"
            description="Move to the target cryptographic state."
            href="/migration"
          />
        </div>
      </section>

      {/* Risk Comparison */}
      {hasResults && <RiskComparisonSection />}

      {/* Migration Readiness */}
      {hasResults && <MigrationReadinessSection />}

      {/* CBOM Preview */}
      {hasResults && <CBOMPreviewSection />}

      {/* Crypto Map Preview */}
      {hasResults && <CryptoMapPreview />}

      {/* Trust Section */}
      <section className="mb-8">
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 text-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Explainable by design</h3>
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            ECDAT uses deterministic static-analysis rules and traceable security policies. Every finding links back to source evidence and the rule that produced it. No black-box AI classification.
          </p>
        </div>
      </section>
    </div>
  );
}
