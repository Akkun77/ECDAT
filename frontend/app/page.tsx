'use client';

import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, severityBg, currentSecurityColor, quantumRiskColor, moscaColor, moscaBg } from '@/lib/display';
import { Shield, Search, BarChart3, ArrowRightLeft, FileText, Network, ChevronRight, Zap, Eye, Target, Route, ListChecks, Boxes } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

function MetricCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 text-center shadow-sm">
      <div className={`text-3xl font-bold mb-1 ${accent || 'text-slate-100'}`}>{value}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, href, accent }: { icon: React.ElementType; title: string; description: string; href: string; accent?: string }) {
  return (
    <Link href={href} className={`group bg-[#0e1726] border rounded-xl p-5 hover:bg-[#152033] transition-all duration-150 ${accent || 'border-[#1e2d42]'}`}>
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-lg transition-colors shrink-0 ${accent ? 'bg-blue-600/15 text-blue-400' : 'bg-slate-800/80 text-slate-300 group-hover:text-blue-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 mt-1 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

function RiskComparisonSection() {
  const { findings } = useScanContext();
  if (findings.length === 0) return null;

  // Extract unique algorithms and their dominant risk states
  const algoStats = new Map<string, { current: string, quantum: string, count: number }>();
  
  findings.forEach(f => {
    const algo = f.algorithm || 'Unknown';
    const cs = f.current_security || f.risk_assessment?.current_security_status || 'unknown';
    const qs = f.quantum_status || f.risk_assessment?.quantum_risk_status || 'unknown';
    
    // Only group by clear names and avoid hygiene finding grouping here if possible
    if (f.category === 'security_hygiene') return;
    
    const key = f.key_size ? `${algo}-${f.key_size}` : algo;
    
    if (!algoStats.has(key)) {
      algoStats.set(key, { current: cs, quantum: qs, count: 1 });
    } else {
      algoStats.get(key)!.count++;
    }
  });

  // Sort by count descending and take top 5
  const topAlgos = Array.from(algoStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <section className="mb-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Current Security vs. Quantum Risk</h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          An algorithm can be secure against today&apos;s classical attacks while still requiring future quantum migration.
        </p>
      </div>

      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl overflow-hidden">
        {/* Header Split */}
        <div className="flex bg-[#152033] border-b border-[#1e2d42]">
          <div className="flex-1 p-4 border-r border-[#1e2d42]/50">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-400" /> Current Security (Today)
            </h3>
          </div>
          <div className="w-[120px] shrink-0 p-4 flex justify-center items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Algorithm</span>
          </div>
          <div className="flex-1 p-4 border-l border-[#1e2d42]/50 text-right">
            <h3 className="text-xs font-bold text-slate-200 flex items-center justify-end gap-2 uppercase tracking-wider">
              Quantum Migration (Future) <Zap className="w-4 h-4 text-amber-400" />
            </h3>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#1e2d42]">
          {topAlgos.map(([key, data], idx) => {
            const formattedAlgo = formatAlgorithm(key.split('-')[0]) + (key.includes('-') ? `-${key.split('-')[1]}` : '');
            
            return (
              <div key={key} className={`flex items-stretch hover:bg-[#070b14]/50 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#070b14]/30'}`}>
                {/* Left Side: Current Security */}
                <div className="flex-1 p-4 flex items-center border-r border-[#1e2d42]/30">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded border bg-[#070b14] ${currentSecurityColor(data.current).replace('text-', 'border-').replace('400', '500/30')} ${currentSecurityColor(data.current)}`}>
                    {data.current.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                {/* Center: Algorithm */}
                <div className="w-[120px] shrink-0 p-4 flex justify-center items-center relative">
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-[#1e2d42] via-blue-500/20 to-[#1e2d42] -z-10" />
                  <span className="text-sm font-bold text-slate-200 bg-[#0e1726] px-2">{formattedAlgo}</span>
                </div>
                
                {/* Right Side: Quantum Status */}
                <div className="flex-1 p-4 flex items-center justify-end border-l border-[#1e2d42]/30">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded border bg-[#070b14] ${quantumRiskColor(data.quantum).replace('text-', 'border-').replace('400', '500/30')} ${quantumRiskColor(data.quantum)}`}>
                    {data.quantum.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MigrationReadinessSection() {
  const { migration } = useScanContext();
  if (!migration) return null;

  const groupStyles: Record<string, { color: string; bg: string }> = {
    'Act Now': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    'Plan Migration': { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    'Monitor': { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    'No Urgent Action': { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  };

  return (
    <section className="mb-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Migration Readiness Tiers</h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          ECDAT combines technical risk with Mosca-style migration urgency to prioritize remediation.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {migration.groups.map(group => {
          const style = groupStyles[group.name] || groupStyles['Monitor'];
          return (
            <div key={group.name} className={`border rounded-xl p-4 text-center ${style.bg}`}>
              <div className={`text-2xl font-bold mb-0.5 ${style.color}`}>{group.count}</div>
              <div className="text-xs text-slate-300 font-semibold">{group.name}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-lg p-3 text-center">
        <p className="text-[11px] text-slate-400">
          Migration urgency formula: <span className="font-mono text-blue-400">Urgency = Data Lifetime (X) + Migration Time (Y) − Threat Horizon (Z)</span>. Demo values are configured planning assumptions.
        </p>
      </div>
    </section>
  );
}

function LiveCryptoFootprint() {
  const { cbom, summary, scanId } = useScanContext();
  if (!cbom || !summary) return null;

  const components = cbom.components || [];
  
  // Group by Language/Asset Type -> Algorithm
  const tree = new Map<string, Set<string>>();
  components.forEach((c: any) => {
    // We don't have language directly on cbom component, use source file extension
    const ext = c.source_file ? c.source_file.split('.').pop()?.toLowerCase() : 'unknown';
    const lang = {
      'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'java': 'Java', 'go': 'Go', 'c': 'C/C++', 'cpp': 'C/C++'
    }[ext || 'unknown'] || 'Other';
    
    if (c.category === 'security_hygiene') return;
    
    if (!tree.has(lang)) tree.set(lang, new Set());
    tree.get(lang)!.add(c.algorithm || c.name || 'Unknown');
  });

  return (
    <section className="mb-10">
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center">
        {/* Left: Summary Stats */}
        <div className="flex-1 w-full">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-400" /> Live Crypto Footprint
            </h2>
            <p className="text-xs text-slate-400">Real-time inventory schematic mapped from source code discovery.</p>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="bg-[#070b14] border border-[#1e2d42] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-slate-200">{summary.files_scanned}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Files</div>
            </div>
            <div className="bg-[#070b14] border border-[#1e2d42] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-slate-200">{summary.languages_detected.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Languages</div>
            </div>
            <div className="bg-[#070b14] border border-[#1e2d42] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-teal-400">{components.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Crypto Assets</div>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Link href="/cbom" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors">
              Open Full CBOM Inventory
            </Link>
            {scanId && (
              <a href={api.exportJson(scanId)} className="px-4 py-2 bg-[#152033] hover:bg-slate-800 text-slate-200 border border-[#1e2d42] rounded-lg text-xs font-medium transition-colors" download>
                Export JSON
              </a>
            )}
          </div>
        </div>

        {/* Right: Technical Tree Diagram */}
        <div className="flex-1 w-full bg-[#070b14] border border-[#1e2d42]/50 rounded-xl p-5 shadow-inner">
          <div className="font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
              <FolderOpen className="w-4 h-4 text-blue-400" /> Repository
            </div>
            <div className="pl-2 border-l border-[#1e2d42] ml-2 space-y-2">
              {Array.from(tree.entries()).slice(0, 3).map(([lang, algos]) => (
                <div key={lang}>
                  <div className="flex items-center gap-2 mb-1.5 before:content-[''] before:w-3 before:h-px before:bg-[#1e2d42] before:-ml-2">
                    <span className="text-[#14b8a6]">{lang}</span>
                  </div>
                  <div className="pl-4 border-l border-[#1e2d42]/50 ml-2 space-y-1">
                    {Array.from(algos).slice(0, 3).map((algo, i, arr) => (
                      <div key={algo} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-[#1e2d42]">├─</span>
                        <span className="bg-[#0e1726] border border-[#1e2d42] px-1.5 rounded text-slate-300">{formatAlgorithm(algo)}</span>
                      </div>
                    ))}
                    {algos.size > 3 && (
                      <div className="flex items-center gap-2 opacity-60">
                        <span className="text-[#1e2d42]">└─</span>
                        <span className="text-slate-500 italic">+{algos.size - 3} more</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    <section className="mb-10">
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" /> Crypto Architecture Map
            </h2>
            <p className="text-xs text-slate-400">Interactive graph topology mapping cryptographic call sites to source locations.</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mb-5 text-xs font-medium">
          <span className="text-slate-400">{graph.nodes.length} nodes</span>
          <span className="text-slate-400">{graph.edges.length} edges</span>
          <span className="text-red-400">{severityCounts.critical} critical</span>
          <span className="text-amber-400">{severityCounts.high} high</span>
          <span className="text-emerald-400">{severityCounts.low + severityCounts.informational} acceptable</span>
        </div>
        <Link href="/crypto-map" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors">
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
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section className="pt-6 pb-4">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-4">
              <Shield className="w-3.5 h-3.5" /> Enterprise Cryptographic Discovery &amp; Analysis
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3 tracking-tight leading-snug">
              Discover the cryptography <br />hidden inside your software.
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mb-6 leading-relaxed">
              ECDAT scans source repositories, builds a Cryptographic Bill of Materials, separates present-day security risk from quantum migration risk, and creates a prioritized migration roadmap.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={startDemoScan}
                disabled={isScanning}
                className="px-7 py-3 bg-[#2563eb] hover:bg-blue-600 disabled:bg-blue-900 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/10 border border-blue-400/30 shrink-0 flex items-center gap-2"
              >
                {isScanning ? 'Scanning Repository...' : 'Scan Demo Repository'}
              </button>
              <Link
                href="/scan"
                className="px-7 py-3 bg-[#152033] hover:bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 border border-[#1e2d42]"
              >
                Upload Repository
              </Link>
              {hasResults && (
                <Link
                  href="/crypto-map"
                  className="px-5 py-3 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  View Crypto Map →
                </Link>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 inline-block">
                {error}
              </div>
            )}
          </div>
          
          {/* Hero Technical Visual */}
          <div className="hidden md:flex flex-1 justify-end items-center">
            <div className="relative w-[340px] h-[280px] bg-[#0e1726]/50 border border-[#1e2d42]/50 rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden group">
              {/* Animated pulse background */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#152033] border border-[#1e2d42] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#1e2d42] to-blue-500/30 relative">
                  <div className="absolute top-0 left-0 w-4 h-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#152033] border border-blue-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                  <Search className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              
              <div className="relative z-10 flex justify-center py-2">
                <div className="w-[1px] h-8 bg-gradient-to-b from-blue-500/30 to-[#14b8a6]/30" />
              </div>
              
              <div className="relative z-10 flex justify-center">
                <div className="px-4 py-2 rounded-lg bg-[#070b14] border border-[#14b8a6]/40 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#14b8a6]" />
                  <span className="text-xs font-mono text-[#14b8a6]">Risk Analysis</span>
                </div>
              </div>

              <div className="relative z-10 flex justify-center py-2 gap-12">
                <div className="w-[1px] h-8 bg-gradient-to-b from-[#14b8a6]/30 to-amber-500/40 relative left-6" />
                <div className="w-[1px] h-8 bg-gradient-to-b from-[#14b8a6]/30 to-blue-500/40 relative right-6" />
              </div>

              <div className="relative z-10 flex justify-between px-2">
                <div className="flex flex-col items-center">
                  <div className="px-3 py-1.5 rounded-lg bg-amber-950/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    Mitigate
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-500/50 text-blue-400 text-[11px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(37,99,235,0.1)]">
                    Migrate
                  </div>
                </div>
              </div>
            </div>
            <style jsx>{`
              @keyframes scan {
                0% { left: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { left: 100%; opacity: 0; }
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* Scan Progress */}
      {isScanning && scanStatus && (
        <section className="mb-8">
          <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-200">
                  {scanStatus.stage === 'SCANNING' ? 'Parsing repository AST & files...' :
                   scanStatus.stage === 'ASSESSING_RISK' ? 'Assessing classical & quantum risk...' :
                   scanStatus.stage === 'GENERATING_CBOM' ? 'Generating CBOM inventory...' :
                   scanStatus.stage}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {scanStatus.files_scanned} / {scanStatus.total_files || '?'} files
              </span>
            </div>
            <div className="w-full bg-[#070b14] rounded-full h-2 border border-[#1e2d42]">
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
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <MetricCard value={summary.total_findings} label="Crypto Findings" accent="text-blue-400" />
            <MetricCard value={summary.current_critical_findings} label="Critical Now" accent="text-red-400" />
            <MetricCard value={summary.quantum_migration_concerns} label="Quantum Concerns" accent="text-amber-400" />
            <MetricCard value={summary.files_scanned} label="Files Scanned" />
            <MetricCard value={summary.languages_detected.length} label="Languages" />
            <MetricCard value={`${summary.scan_duration_seconds.toFixed(2)}s`} label="Scan Duration" />
          </div>
        </section>
      )}

      {/* 6-Stage Discovery Workflow Cards */}
      <section className="mb-10">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-100 mb-1">End-to-End Cryptographic Lifecycle</h2>
          <p className="text-xs text-slate-400">Deterministic discovery, inventorying, risk assessment, and migration roadmap execution.</p>
        </div>
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
            description="Build a structured cryptographic bill of materials (CBOM) from discovered evidence."
            href="/cbom"
          />
          <FeatureCard
            icon={Target}
            title="Assess"
            description="Separate present-day security weaknesses from future post-quantum migration exposure."
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
            description="Reduce immediate exposure while migration is prepared."
            href="/migration"
            accent="border-amber-500/40 bg-amber-950/15"
          />
          <FeatureCard
            icon={ArrowRightLeft}
            title="Migrate"
            description="Move to the target cryptographic state."
            href="/migration"
            accent="border-blue-500/40 bg-blue-950/20"
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
      <section className="mb-6">
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 text-center">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Explainable by Design</h3>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ECDAT relies strictly on deterministic static-analysis rules and traceable security policies based on NIST SP 800-131A and CNSA 2.0 standards. Every finding links to exact line numbers and policy IDs.
          </p>
        </div>
      </section>
    </div>
  );
}
