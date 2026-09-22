'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ListChecks, 
  Shield, 
  Zap, 
  Search, 
  FileCode, 
  Info, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, formatOperation, currentSecurityColor, quantumRiskColor } from '@/lib/display';
import InteractiveMitigation, { getStatusLabel } from '@/components/interactive-mitigation';

export default function MitigationHubPage() {
  const { findings, summary, state, scanStatus } = useScanContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [securityFilter, setSecurityFilter] = useState('All');
  const [quantumFilter, setQuantumFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  // Calculate summary counts from existing real findings data
  const statusCounts = useMemo(() => {
    const counts = { IMMEDIATE: 0, PLAN: 0, VALIDATE: 0, RETAIN: 0 };
    findings.forEach(f => {
      const currentSec = f.current_security || f.risk_assessment?.current_security_status;
      const quantum = f.quantum_status || f.risk_assessment?.quantum_risk_status;
      const statusInfo = getStatusLabel(f.algorithm, currentSec, quantum, f.category);
      if (statusInfo.label in counts) {
        counts[statusInfo.label]++;
      }
    });
    return counts;
  }, [findings]);

  // Filter findings based on selected criteria
  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      const currentSec = (finding.current_security || finding.risk_assessment?.current_security_status || '').toLowerCase();
      const quantum = (finding.quantum_status || finding.risk_assessment?.quantum_risk_status || '').toLowerCase();
      const statusInfo = getStatusLabel(finding.algorithm, currentSec, quantum, finding.category);

      // Search query (Algorithm, file path, reason)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const algoMatch = (finding.algorithm || '').toLowerCase().includes(query);
        const fileMatch = (finding.file || finding.file_path || '').toLowerCase().includes(query);
        const reasonMatch = (finding.reason || '').toLowerCase().includes(query);
        if (!algoMatch && !fileMatch && !reasonMatch) return false;
      }

      // Current Security filter
      if (securityFilter !== 'All' && currentSec !== securityFilter.toLowerCase()) return false;

      // Quantum Risk filter
      if (quantumFilter !== 'All' && quantum !== quantumFilter.toLowerCase()) return false;

      // Action Filter
      if (actionFilter !== 'All' && statusInfo.label !== actionFilter.toUpperCase()) return false;

      return true;
    });
  }, [findings, searchQuery, securityFilter, quantumFilter, actionFilter]);

  if (!isCompleted || findings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="pb-2 border-b border-[#1e2d42]">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ListChecks className="w-6 h-6 text-amber-400 shrink-0" />
            Mitigation Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Reduce cryptographic exposure while preparing for migration.
          </p>
        </div>

        {/* Empty State Schematic */}
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-[#0e1726] border border-[#1e2d42] rounded-xl">
          <div className="relative w-64 h-32 mb-8 flex items-center justify-between">
            {/* Risk Box */}
            <div className="w-20 h-16 bg-[#070b14] border border-red-500/30 rounded-lg flex flex-col items-center justify-center gap-1 opacity-70">
              <Shield className="w-4 h-4 text-red-400" />
              <div className="w-10 h-1 bg-red-500/20 rounded-full" />
            </div>

            {/* Connecting Arrow */}
            <div className="flex-1 flex items-center px-2">
              <div className="w-full h-[1px] bg-gradient-to-r from-red-500/30 via-amber-500/40 to-blue-500/30 relative">
                <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-blue-500/50 rotate-45" />
              </div>
            </div>

            {/* Target Box */}
            <div className="w-20 h-16 bg-[#070b14] border border-blue-500/30 rounded-lg flex flex-col items-center justify-center gap-1 opacity-70">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <div className="w-10 h-1 bg-blue-500/20 rounded-full" />
            </div>

            {/* Central Overlay Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-[#070b14] border border-amber-500/40 rounded-xl shadow-lg">
              <ListChecks className="w-5 h-5 text-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-100 mb-2">No Mitigation Data Available</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md leading-relaxed">
            Run a repository scan to generate structured risk reduction actions, interim control checklists, and target migration guidance.
          </p>
          <Link
            href="/scan"
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-blue-400/30"
          >
            Start Scanning
          </Link>
        </div>
      </div>
    );
  }

  const FilterPills = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string, onChange: (v: string) => void }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap min-w-[130px]">{label}:</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              selected === opt 
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                : 'bg-[#152033] text-slate-300 border-[#1e2d42] hover:bg-[#1e2d42]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#1e2d42] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <ListChecks className="w-6 h-6 text-amber-400 shrink-0" />
            Mitigation Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Reduce cryptographic exposure while preparing for post-quantum migration.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href="/migration"
            className="px-4 py-2 bg-[#152033] hover:bg-slate-800 text-slate-200 border border-[#1e2d42] rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <span>View Full Migration Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Concisely Explain Distinction Between Mitigation & Migration */}
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 space-y-2.5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-100">
              Understanding Mitigation vs. Migration
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              • <strong className="text-amber-400 font-semibold">Mitigation (Interim Safeguards):</strong> Immediate risk-reduction controls (such as rotational mechanisms, key size enforcement, boundary isolation, or nonce validation) applied to reduce exposure today while migration is planned.<br />
              • <strong className="text-blue-400 font-semibold">Migration (Target Cryptographic State):</strong> Full architectural transition to NIST post-quantum standard algorithms (e.g. ML-KEM for key establishment or ML-DSA for digital signatures).
            </p>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="bg-[#070b14] border border-[#1e2d42] rounded-lg p-3 text-[11px] text-slate-400 leading-relaxed italic">
          * Note: Temporary checklist selections in the Mitigation Hub are local evaluation helpers and do not persist as verified remediation. Re-scanning static source code alone verifies the absence of static findings, but does not establish complete runtime implementation security.
        </div>
      </div>

      {/* Aggregate Metric Cards derived strictly from real scan findings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0e1726] border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-red-400 mb-0.5">{statusCounts.IMMEDIATE}</div>
          <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Immediate Actions</div>
          <div className="text-[11px] text-slate-500 mt-1">Current broken or hygiene issues</div>
        </div>

        <div className="bg-[#0e1726] border border-amber-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-amber-400 mb-0.5">{statusCounts.PLAN}</div>
          <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Migration Prep</div>
          <div className="text-[11px] text-slate-500 mt-1">Quantum-vulnerable assets</div>
        </div>

        <div className="bg-[#0e1726] border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-blue-400 mb-0.5">{statusCounts.VALIDATE}</div>
          <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Validation Needed</div>
          <div className="text-[11px] text-slate-500 mt-1">Implementation control checks</div>
        </div>

        <div className="bg-[#0e1726] border border-emerald-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-400 mb-0.5">{statusCounts.RETAIN}</div>
          <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Retain Algorithm</div>
          <div className="text-[11px] text-slate-500 mt-1">Strong classical &amp; quantum state</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by algorithm, filename, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1e2d42] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <FilterPills 
          label="Category / Action" 
          options={['All', 'Immediate Action', 'Migration Preparation', 'Validation', 'Retain']} 
          selected={actionFilter} 
          onChange={setActionFilter} 
        />
        <FilterPills 
          label="Current Security" 
          options={['All', 'Broken', 'Deprecated', 'Acceptable', 'Strong']} 
          selected={securityFilter} 
          onChange={setSecurityFilter} 
        />
        <FilterPills 
          label="Quantum Risk" 
          options={['All', 'Vulnerable', 'Migration Concern', 'Low Concern', 'Not Applicable']} 
          selected={quantumFilter} 
          onChange={setQuantumFilter} 
        />
      </div>

      {/* Mitigation Items List */}
      <div className="space-y-6">
        {filteredFindings.length === 0 ? (
          <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-12 text-center text-slate-400">
            No mitigation items match the selected filter criteria.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const currentSec = finding.current_security || finding.risk_assessment?.current_security_status;
            const quantum = finding.quantum_status || finding.risk_assessment?.quantum_risk_status;
            const filePath = finding.file || finding.file_path || '';
            const fileName = filePath.split(/[/\\]/).pop() || filePath;
            const lineNum = finding.line || finding.line_number || 1;
            const mitigation = finding.migration_recommendation?.mitigation;

            return (
              <div key={finding.id} className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 space-y-4">
                {/* Header: Item Identity & Evidence */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2d42]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-100">
                      {finding.category === 'security_hygiene' ? 'Hardcoded Secret' : formatAlgorithm(finding.algorithm)}
                    </h3>
                    {finding.key_size && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#152033] text-slate-300 border border-[#1e2d42]">
                        {finding.key_size}-bit
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium capitalize">
                      {formatOperation(finding.operation || finding.operation_type)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-slate-500" />
                      {fileName}:{lineNum}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-semibold ${currentSecurityColor(currentSec)}`}>
                      Current: {formatCurrentSecurity(currentSec)}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className={`font-semibold ${quantumRiskColor(quantum)}`}>
                      Quantum: {formatQuantumRisk(quantum)}
                    </span>
                  </div>
                </div>

                {/* Source Snippet Preview if present */}
                {finding.code_snippet && (
                  <pre className="bg-[#070b14] border border-[#1e2d42] p-3 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
                    <code>{finding.code_snippet.trim()}</code>
                  </pre>
                )}

                {/* Reusable Interactive Mitigation Component */}
                <InteractiveMitigation
                  findingId={finding.id}
                  algorithm={finding.algorithm}
                  currentSecurity={currentSec}
                  quantumStatus={quantum}
                  category={finding.category}
                  keySize={finding.key_size}
                  operation={finding.operation || finding.operation_type}
                  mitigation={mitigation}
                  recommendation={finding.migration_recommendation?.suggested_direction || finding.risk_assessment?.recommendation}
                  notes={finding.migration_recommendation?.migration_notes}
                  reason={finding.reason}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
