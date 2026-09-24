'use client';

import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, currentSecurityColor, quantumRiskColor } from '@/lib/display';
import { Shield, Network, ChevronRight, Zap, Eye, Target, Route, ListChecks, Boxes, FolderOpen, ArrowRightLeft, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const CryptographicCore = dynamic(() => import('@/components/cryptographic-core'), {
  ssr: false,
  loading: () => <div className="core-loading" aria-label="Loading Cryptographic Core" />,
});

function MetricCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 text-center shadow-sm">
      <div className={`text-3xl font-bold mb-1 ${accent || 'text-[#F4F1E8]'}`}>{value}</div>
      <div className="text-[11px] font-semibold text-[#8A9094] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, href, accent }: { icon: LucideIcon; title: string; description: string; href: string; accent?: string }) {
  return (
    <Link href={href} className={`group bg-[#171A1D] border rounded-xl p-5 hover:bg-[#1F2327] transition-all duration-150 ${accent || 'border-[#34393D]'}`}>
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-lg transition-colors shrink-0 ${accent ? 'bg-[#C8A96B]/15 text-[#C8A96B]' : 'bg-[#1F2327] text-[#B8BDBD] group-hover:text-[#C8A96B]'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#F4F1E8] mb-1">{title}</h3>
          <p className="text-xs text-[#8A9094] leading-relaxed">{description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#8A9094] group-hover:text-[#F4F1E8] mt-1 transition-colors shrink-0" />
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
    
    if (f.category === 'security_hygiene') return;
    
    const key = f.key_size ? `${algo}-${f.key_size}` : algo;
    
    if (!algoStats.has(key)) {
      algoStats.set(key, { current: cs, quantum: qs, count: 1 });
    } else {
      algoStats.get(key)!.count++;
    }
  });

  const topAlgos = Array.from(algoStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <section className="mb-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#F4F1E8] mb-1">Current Security vs. Quantum Risk</h2>
        <p className="text-xs text-[#8A9094] max-w-xl mx-auto">
          An algorithm can be secure against today&apos;s classical attacks while still requiring future quantum migration.
        </p>
      </div>

      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl overflow-hidden">
        {/* Header Split */}
        <div className="flex bg-[#1F2327] border-b border-[#34393D]">
          <div className="flex-1 min-w-0 p-3 sm:p-4 border-r border-[#34393D]/50">
            <h3 className="text-[10px] sm:text-xs font-bold text-[#E2DFD8] flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 shrink-0 text-[#78AAA4]" /> <span className="hidden sm:inline">Current Security (Today)</span>
            </h3>
          </div>
          <div className="w-24 sm:w-[130px] shrink-0 p-3 sm:p-4 flex justify-center items-center">
            <span className="hidden sm:inline text-[10px] font-bold text-[#8A9094] uppercase tracking-widest">Algorithm</span>
          </div>
          <div className="flex-1 min-w-0 p-3 sm:p-4 border-l border-[#34393D]/50 text-right">
            <h3 className="text-[10px] sm:text-xs font-bold text-[#E2DFD8] flex items-center justify-end gap-2 uppercase tracking-wider">
              <span className="hidden sm:inline">Quantum Migration (Future)</span> <Zap className="w-4 h-4 shrink-0 text-[#C7A15D]" />
            </h3>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#34393D]">
          {topAlgos.map(([key, data], idx) => {
            const formattedAlgo = formatAlgorithm(key.split('-')[0]) + (key.includes('-') ? `-${key.split('-')[1]}` : '');
            
            return (
              <div key={key} className={`flex items-stretch hover:bg-[#1F2327]/40 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0F1113]/40'}`}>
                {/* Left Side: Current Security */}
                <div className="flex-1 min-w-0 p-3 sm:p-4 flex items-center border-r border-[#34393D]/30">
                  <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded border bg-[#0F1113] whitespace-nowrap ${currentSecurityColor(data.current).replace('text-', 'border-').replace('400', '500/30')} ${currentSecurityColor(data.current)}`}>
                    {data.current.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                {/* Center: Algorithm */}
                <div className="w-24 sm:w-[130px] shrink-0 p-3 sm:p-4 flex justify-center items-center relative">
                  <span className="text-xs font-bold text-[#F4F1E8] bg-[#171A1D] px-2.5 py-0.5 rounded border border-[#34393D]">{formattedAlgo}</span>
                </div>
                
                {/* Right Side: Quantum Status */}
                <div className="flex-1 min-w-0 p-3 sm:p-4 flex items-center justify-end border-l border-[#34393D]/30">
                  <span className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded border bg-[#0F1113] whitespace-nowrap ${quantumRiskColor(data.quantum).replace('text-', 'border-').replace('400', '500/30')} ${quantumRiskColor(data.quantum)}`}>
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

  const total = migration.groups.reduce((acc, g) => acc + g.count, 0);

  const groupStyles: Record<string, { color: string; bg: string; fill: string }> = {
    'Act Now': { color: 'text-[#C76B6B]', bg: 'bg-[#C76B6B]/10 border-[#C76B6B]/30', fill: 'bg-[#C76B6B]' },
    'Plan Migration': { color: 'text-[#C7A15D]', bg: 'bg-[#C7A15D]/10 border-[#C7A15D]/30', fill: 'bg-[#C7A15D]' },
    'Monitor': { color: 'text-[#6E84A3]', bg: 'bg-[#6E84A3]/10 border-[#6E84A3]/30', fill: 'bg-[#6E84A3]' },
    'No Urgent Action': { color: 'text-[#7EA992]', bg: 'bg-[#7EA992]/10 border-[#7EA992]/30', fill: 'bg-[#7EA992]' },
  };

  return (
    <section className="mb-10">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#F4F1E8] mb-1">Migration Readiness Timeline</h2>
        <p className="text-xs text-[#8A9094] max-w-xl mx-auto">
          ECDAT combines technical risk with Mosca-style migration urgency to prioritize remediation.
        </p>
      </div>
      
      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-6 mb-4">
        {/* Horizontal Stacked Bar */}
        <div className="w-full h-3 flex rounded-full overflow-hidden mb-6 bg-[#0F1113] border border-[#34393D]">
          {migration.groups.map(group => {
            const style = groupStyles[group.name] || groupStyles['Monitor'];
            const percent = total > 0 ? (group.count / total) * 100 : 0;
            if (percent === 0) return null;
            return (
              <div 
                key={`${group.name}-bar`} 
                style={{ width: `${percent}%` }} 
                className={`${style.fill} h-full transition-all duration-500 hover:brightness-110`}
                title={`${group.name}: ${group.count}`}
              />
            );
          })}
        </div>

        {/* Legend / Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {migration.groups.map(group => {
            const style = groupStyles[group.name] || groupStyles['Monitor'];
            return (
              <div key={group.name} className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full mb-2 ${style.fill}`} />
                <div className={`text-xl font-bold mb-0.5 ${style.color}`}>{group.count}</div>
                <div className="text-[11px] text-[#B8BDBD] font-semibold uppercase tracking-wider">{group.name}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-[#171A1D] border border-[#34393D] rounded-lg p-3 text-center">
        <p className="text-[11px] text-[#8A9094]">
          Migration urgency formula: <span className="font-mono text-[#C8A96B]">Urgency = Data Lifetime (X) + Migration Time (Y) − Threat Horizon (Z)</span>. Demo values are configured planning assumptions.
        </p>
      </div>
    </section>
  );
}

function LiveCryptoFootprint() {
  const { cbom, summary, scanId } = useScanContext();
  if (!cbom || !summary) return null;

  const components = cbom.components || [];
  
  const tree = new Map<string, Set<string>>();
  components.forEach((c: { source_file?: string; category?: string; algorithm?: string; name?: string }) => {
    const ext = c.source_file ? c.source_file.split('.').pop()?.toLowerCase() : 'unknown';
    const extMap: Record<string, string> = {
      'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'java': 'Java', 'go': 'Go', 'c': 'C/C++', 'cpp': 'C/C++'
    };
    const lang = extMap[ext || 'unknown'] || 'Other';
    
    if (c.category === 'security_hygiene') return;
    
    if (!tree.has(lang)) tree.set(lang, new Set());
    tree.get(lang)!.add(c.algorithm || c.name || 'Unknown');
  });

  return (
    <section className="mb-10">
      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-6 flex flex-col md:flex-row gap-8 items-center">
        {/* Left: Summary Stats */}
        <div className="flex-1 w-full">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#F4F1E8] mb-1 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#78AAA4]" /> Live Crypto Footprint
            </h2>
            <p className="text-xs text-[#8A9094]">Real-time inventory schematic mapped from source code discovery.</p>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="bg-[#0F1113] border border-[#34393D] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-[#E2DFD8]">{summary.files_scanned}</div>
              <div className="text-[10px] text-[#8A9094] uppercase tracking-wider font-semibold">Files</div>
            </div>
            <div className="bg-[#0F1113] border border-[#34393D] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-[#E2DFD8]">{summary.languages_detected.length}</div>
              <div className="text-[10px] text-[#8A9094] uppercase tracking-wider font-semibold">Languages</div>
            </div>
            <div className="bg-[#0F1113] border border-[#34393D] px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-[#78AAA4]">{components.length}</div>
              <div className="text-[10px] text-[#8A9094] uppercase tracking-wider font-semibold">Crypto Assets</div>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Link href="/cbom" className="px-4 py-2 bg-gradient-to-b from-[#C8A96B] to-[#B89658] hover:from-[#D4B679] hover:to-[#C8A96B] text-[#0F1113] rounded-lg text-xs font-semibold transition-colors">
              Open Full CBOM Inventory
            </Link>
            {scanId && (
              <a href={api.exportJson(scanId)} className="px-4 py-2 bg-[#1F2327] hover:bg-[#23282D] text-[#F4F1E8] border border-[#34393D] rounded-lg text-xs font-medium transition-colors" download>
                Export JSON
              </a>
            )}
          </div>
        </div>

        {/* Right: Technical Tree Diagram */}
        <div className="flex-1 w-full bg-[#0F1113] border border-[#34393D] rounded-xl p-5 shadow-inner">
          <div className="font-mono text-xs text-[#8A9094]">
            <div className="flex items-center gap-2 text-[#E2DFD8] font-semibold mb-2">
              <FolderOpen className="w-4 h-4 text-[#78AAA4]" /> Repository Root
            </div>
            <div className="pl-2 border-l border-[#34393D] ml-2 space-y-2">
              {Array.from(tree.entries()).slice(0, 3).map(([lang, algos]) => (
                <div key={lang}>
                  <div className="flex items-center gap-2 mb-1.5 before:content-[''] before:w-3 before:h-px before:bg-[#34393D] before:-ml-2">
                    <span className="text-[#C8A96B] font-semibold">{lang}</span>
                  </div>
                  <div className="pl-4 border-l border-[#34393D]/50 ml-2 space-y-1">
                    {Array.from(algos).slice(0, 3).map((algo) => (
                      <div key={algo} className="flex items-center gap-2 opacity-85 hover:opacity-100 transition-opacity">
                        <span className="text-[#34393D]">├─</span>
                        <span className="bg-[#171A1D] border border-[#34393D] px-1.5 py-0.5 rounded text-[#E2DFD8] text-[11px]">{formatAlgorithm(algo)}</span>
                      </div>
                    ))}
                    {algos.size > 3 && (
                      <div className="flex items-center gap-2 opacity-60">
                        <span className="text-[#34393D]">└─</span>
                        <span className="text-[#8A9094] italic text-[11px]">+{algos.size - 3} more primitives</span>
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
      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#F4F1E8] mb-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-[#6E84A3]" /> Crypto Architecture Map
            </h2>
            <p className="text-xs text-[#8A9094]">Interactive graph topology mapping cryptographic call sites to source locations.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5 text-xs font-medium">
          <span className="text-[#8A9094]">{graph.nodes.length} nodes</span>
          <span className="text-[#8A9094]">{graph.edges.length} edges</span>
          <span className="text-[#C76B6B]">{severityCounts.critical} critical</span>
          <span className="text-[#C7A15D]">{severityCounts.high} high</span>
          <span className="text-[#7EA992]">{severityCounts.low + severityCounts.informational} acceptable</span>
        </div>
        <Link href="/crypto-map" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F2327] hover:bg-[#23282D] text-[#F4F1E8] border border-[#34393D] rounded-lg text-xs font-semibold transition-colors">
          Explore Crypto Map <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const { state, summary, scanStatus, startDemoScan, error } = useScanContext();
  const hasResults = state === 'completed' && summary;
  const isScanning = state === 'scanning';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* SECTION B: Redesigned Front Page Hero */}
      <section className="hero-shell relative isolate overflow-hidden rounded-[1.35rem] border border-[#34393D] px-6 py-9 md:px-9 md:py-11">
        <Image
          src="/brand/ecdat-server-room.jpg"
          alt="ECDAT Secure Datacenter"
          fill
          priority
          sizes="(max-width: 767px) 100vw, (max-width: 1280px) 85vw, 1152px"
          className="hero-backdrop object-cover"
        />
        <div className="hero-backdrop-scrim" aria-hidden="true" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 text-left">
            {/* Subtle Premium Trust Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border border-[#C8A96B]/35 bg-[#171A1D]/85 text-[#C8A96B] mb-5 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-[#C8A96B]" /> Enterprise Cryptographic Discovery &amp; Analysis
            </div>

            {/* Main Heading with Selective Gold Emphasis */}
            <h1 className="text-3xl md:text-[2.75rem] font-bold text-[#F4F1E8] mb-4 tracking-tight leading-[1.14]">
              Discover the <span className="text-[#C8A96B]">cryptography</span> hidden inside your software.
            </h1>

            <p className="text-sm text-[#B8BDBD] max-w-xl mb-7 leading-relaxed">
              ECDAT discovers cryptographic assets, assesses current and quantum risk, helps mitigate immediate exposure, and guides migration to stronger future-safe cryptography.
            </p>

            {/* Actions / Premium CTAs */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <button
                onClick={startDemoScan}
                disabled={isScanning}
                className="px-7 py-3 bg-gradient-to-b from-[#C8A96B] to-[#B89658] hover:from-[#D4B679] hover:to-[#C8A96B] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1113] rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-md shadow-[#C8A96B]/15 border border-[#C8A96B]/50 shrink-0 flex items-center gap-2"
              >
                {isScanning ? 'Scanning Repository...' : 'Scan Demo Repository'}
              </button>
              <Link
                href="/scan"
                className="px-7 py-3 bg-[#1F2327] hover:bg-[#23282D] text-[#F4F1E8] rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 border border-[#34393D]"
              >
                Upload Repository
              </Link>
              {hasResults && (
                <Link
                  href="/crypto-map"
                  className="px-4 py-3 text-[#8A9094] hover:text-[#F4F1E8] text-sm font-medium transition-colors"
                >
                  View Crypto Map →
                </Link>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 text-[#C76B6B] text-xs bg-[#C76B6B]/10 border border-[#C76B6B]/25 rounded-lg px-4 py-2 inline-block">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex w-full flex-1 justify-center lg:justify-end min-w-0 max-w-full lg:max-w-[38rem]">
            <CryptographicCore />
          </div>
        </div>
      </section>

      {/* Scan Progress */}
      {isScanning && scanStatus && (
        <section className="mb-8">
          <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C8A96B] animate-pulse" />
                <span className="text-sm font-semibold text-[#E2DFD8]">
                  {scanStatus.stage === 'SCANNING' ? 'Parsing repository AST & files...' :
                   scanStatus.stage === 'ASSESSING_RISK' ? 'Assessing classical & quantum risk...' :
                   scanStatus.stage === 'GENERATING_CBOM' ? 'Generating CBOM inventory...' :
                   scanStatus.stage}
                </span>
              </div>
              <span className="text-xs text-[#8A9094] font-mono">
                {scanStatus.files_scanned} / {scanStatus.total_files || '?'} files
              </span>
            </div>
            {typeof scanStatus.progress === 'number' && (
              <div className="w-full bg-[#0F1113] rounded-full h-2 border border-[#34393D]">
                <div className="bg-[#C8A96B] h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(scanStatus.progress * 100, 100)}%` }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hero Metrics */}
      {hasResults && summary && (
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <MetricCard value={summary.total_findings} label="Crypto Findings" accent="text-[#C8A96B]" />
            <MetricCard value={summary.current_critical_findings} label="Critical Now" accent="text-[#C76B6B]" />
            <MetricCard value={summary.quantum_migration_concerns} label="Quantum Concerns" accent="text-[#C7A15D]" />
            <MetricCard value={summary.files_scanned} label="Files Scanned" />
            <MetricCard value={summary.languages_detected.length} label="Languages" />
            <MetricCard value={`${summary.scan_duration_seconds.toFixed(2)}s`} label="Scan Duration" />
          </div>
        </section>
      )}

      {/* 6-Stage Discovery Lifecycle Cards */}
      <section className="mb-10">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#F4F1E8] mb-1">End-to-End Cryptographic Lifecycle</h2>
          <p className="text-xs text-[#8A9094]">Deterministic discovery, inventorying, risk assessment, and migration roadmap execution.</p>
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
            href="/mitigation"
            accent="border-[#C7A15D]/40 bg-[#C7A15D]/10"
          />
          <FeatureCard
            icon={ArrowRightLeft}
            title="Migrate"
            description="Move to the target cryptographic state."
            href="/migration"
            accent="border-[#6E84A3]/40 bg-[#6E84A3]/10"
          />
        </div>
      </section>

      {/* Risk Comparison */}
      {hasResults && <RiskComparisonSection />}

      {/* Migration Readiness */}
      {hasResults && <MigrationReadinessSection />}

      {/* CBOM Preview */}
      {hasResults && <LiveCryptoFootprint />}

      {/* Crypto Map Preview */}
      {hasResults && <CryptoMapPreview />}

      {/* Trust Section */}
      <section className="mb-6">
        <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 text-center">
          <h3 className="text-xs font-semibold text-[#E2DFD8] uppercase tracking-wider mb-1">Explainable by Design</h3>
          <p className="text-xs text-[#8A9094] max-w-2xl mx-auto leading-relaxed">
            ECDAT relies strictly on deterministic static-analysis rules and traceable security policies based on NIST SP 800-131A and CNSA 2.0 standards. Every finding links to exact line numbers and policy IDs.
          </p>
        </div>
      </section>
    </div>
  );
}
