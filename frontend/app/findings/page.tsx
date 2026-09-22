'use client';

import React, { useState, useMemo } from 'react';
import { useScanContext } from '@/components/scan-provider';
import { 
  formatAlgorithm, formatSeverity, formatCurrentSecurity, formatQuantumRisk, formatOperation, 
  severityBg, currentSecurityColor, quantumRiskColor, moscaColor, moscaBg 
} from '@/lib/display';
import { AlertTriangle, Shield, Zap, FileCode, ChevronDown, ChevronUp, Info, Search, ArrowRight, ArrowDown, ListChecks, CheckCircle2 } from 'lucide-react';
import type { FindingResponse } from '@/types/api';

export default function FindingsPage() {
  const { findings, summary } = useScanContext();
  
  const [severityFilter, setSeverityFilter] = useState('All');
  const [securityFilter, setSecurityFilter] = useState('All');
  const [quantumFilter, setQuantumFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      const sev = (finding.severity || '').toLowerCase();
      const currentSec = (finding.current_security || finding.risk_assessment?.current_security_status || '').toLowerCase();
      const quantum = (finding.quantum_status || finding.risk_assessment?.quantum_risk_status || '').toLowerCase();
      const cat = (finding.category || 'cryptographic').toLowerCase();

      // Severity filter
      if (severityFilter !== 'All' && sev !== severityFilter.toLowerCase()) return false;
      
      // Current Security filter
      if (securityFilter !== 'All' && currentSec !== securityFilter.toLowerCase()) return false;
      
      // Quantum Risk filter
      if (quantumFilter !== 'All' && quantum !== quantumFilter.toLowerCase()) return false;
      
      // Category filter
      if (categoryFilter !== 'All') {
        const target = categoryFilter.toLowerCase().replace(/\s+/g, '_');
        if (cat !== target && !cat.includes(target)) return false;
      }
      
      // Search (Algorithm, File Name, Reason)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const algoMatch = (finding.algorithm || '').toLowerCase().includes(query);
        const fileMatch = (finding.file || finding.file_path || '').toLowerCase().includes(query);
        const reasonMatch = (finding.reason || '').toLowerCase().includes(query);
        if (!algoMatch && !fileMatch && !reasonMatch) return false;
      }
      
      return true;
    });
  }, [findings, severityFilter, securityFilter, quantumFilter, categoryFilter, searchQuery]);

  const FilterPills = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string, onChange: (v: string) => void }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap min-w-[120px]">{label}:</span>
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pb-2 border-b border-[#1e2d42]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            Cryptographic Findings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Every discovery is traceable to exact source files, call sites, static analysis rules, and security policies.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-[#0e1726] px-3.5 py-2 rounded-lg border border-[#1e2d42] shrink-0">
          Showing <span className="font-bold text-slate-200">{filteredFindings.length}</span> of{' '}
          <span className="font-bold text-slate-200">{summary?.total_findings ?? findings.length}</span> findings
        </div>
      </div>

      {/* Filters Card */}
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
          label="Severity" 
          options={['All', 'Critical', 'High', 'Medium', 'Low', 'Informational']} 
          selected={severityFilter} 
          onChange={setSeverityFilter} 
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
        <FilterPills 
          label="Category" 
          options={['All', 'Cryptographic', 'Security Hygiene']} 
          selected={categoryFilter} 
          onChange={setCategoryFilter} 
        />
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-12 text-center text-slate-400">
            No findings match the selected filters.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;
            const currentSec = finding.current_security || finding.risk_assessment?.current_security_status || 'unknown';
            const quantumRisk = finding.quantum_status || finding.risk_assessment?.quantum_risk_status || 'unknown';
            const filePath = finding.file || finding.file_path || '';
            const fileName = filePath.split(/[/\\]/).pop() || filePath;
            const lineNum = finding.line || finding.line_number || 1;
            const mosca = finding.mosca;
            const mitigation = finding.migration_recommendation?.mitigation;
            const isSecurityHygiene = finding.category === 'security_hygiene';

            return (
              <div key={finding.id} className="bg-[#0e1726] border border-[#1e2d42] rounded-xl overflow-hidden transition-all duration-200">
                {/* Row Header */}
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#152033]/60 transition-colors select-none"
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                >
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${severityBg(finding.severity)}`}>
                    {formatSeverity(finding.severity)}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-12 gap-3 items-center min-w-0">
                    <div className="col-span-3 font-semibold text-slate-100 truncate">
                      {isSecurityHygiene ? (
                        <span className="text-amber-400 font-medium">Security Hygiene Finding</span>
                      ) : (
                        formatAlgorithm(finding.algorithm || '')
                      )}
                      {finding.key_size && (
                        <span className="ml-2 text-xs font-normal text-slate-400 font-mono">
                          ({finding.key_size}-bit)
                        </span>
                      )}
                    </div>
                    
                    <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate" title={filePath}>
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{fileName}:{lineNum}</span>
                    </div>
                    
                    <div className={`col-span-2 text-xs font-semibold ${currentSecurityColor(currentSec)} truncate`}>
                      {formatCurrentSecurity(currentSec)}
                    </div>
                    
                    <div className={`col-span-2 text-xs font-semibold ${quantumRiskColor(quantumRisk)} truncate`}>
                      {formatQuantumRisk(quantumRisk)}
                    </div>
                    
                    <div className="col-span-2 text-xs text-slate-400 capitalize truncate">
                      {formatOperation(finding.operation || finding.operation_type || '')}
                    </div>
                  </div>
                  
                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="p-6 border-t border-[#1e2d42] bg-[#070b14]/80 space-y-6">
                    {/* 1. Algorithm + Severity */}
                    <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#1e2d42]">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-100">
                          {isSecurityHygiene ? 'Hardcoded Secret / Credential' : formatAlgorithm(finding.algorithm || '')}
                        </h2>
                        {finding.key_size && (
                          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#152033] text-slate-300 border border-[#1e2d42]">
                            Key size: {finding.key_size} bits
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${severityBg(finding.severity)}`}>
                          {finding.severity?.toUpperCase()} SEVERITY
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Rule: {finding.scanner_rule_id || '-'}
                      </div>
                    </div>

                    {/* 2. File + Line */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        Source Evidence: <span className="text-slate-200 font-mono lowercase">{filePath}:{lineNum}</span>
                      </div>
                      {/* 3. Detected Code */}
                      {finding.code_snippet && (
                        <pre className="bg-[#070b14] border border-[#1e2d42] p-4 rounded-lg overflow-x-auto text-xs text-slate-200 font-mono leading-relaxed">
                          <code>{finding.code_snippet}</code>
                        </pre>
                      )}
                    </div>

                    {/* 4. Current Security & 5. Quantum Migration Status (Distinct Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Current Security */}
                      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-400" />
                          Current Security Status (Today)
                        </div>
                        <div className={`text-lg font-bold ${currentSecurityColor(currentSec)} flex items-center gap-2`}>
                          {formatCurrentSecurity(currentSec)}
                        </div>
                        <p className="text-xs text-slate-400">
                          Evaluates resilience against modern classical computing attacks and known vulnerabilities.
                        </p>
                      </div>

                      {/* Right: Quantum Migration Status */}
                      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          Quantum Migration Status (Future)
                        </div>
                        <div className={`text-lg font-bold ${quantumRiskColor(quantumRisk)} flex items-center gap-2`}>
                          {formatQuantumRisk(quantumRisk)}
                        </div>
                        <p className="text-xs text-slate-400">
                          Evaluates vulnerability to Shor&apos;s or Grover&apos;s algorithms on future cryptographically relevant quantum computers.
                        </p>
                      </div>
                    </div>

                    {/* 6. Why It Was Detected & 7. Why It Matters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          Why It Was Detected
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {finding.reason || 'Pattern matched cryptographic signature in static analysis.'}
                        </p>
                      </div>

                      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Why It Matters
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {finding.risk_assessment?.explanation || finding.reason || 'Security implications depend on operational context and threat model.'}
                        </p>
                      </div>
                    </div>

                    {/* 8. Policy / Rule ID */}
                    <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-2 text-xs">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Traceable Policy Guidance
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-[#152033] px-3 py-1 rounded text-slate-300 border border-[#1e2d42]">
                          Policy: {finding.policy_source || 'ECDAT policy based on NIST SP 800-131A and CNSA 2.0'}
                        </span>
                        <span className="bg-[#152033] px-3 py-1 rounded text-blue-400 font-mono border border-[#1e2d42]">
                          Rule: {finding.policy_rule_id || finding.scanner_rule_id || 'RULE-001'}
                        </span>
                      </div>
                    </div>

                    {/* 9. Mosca / Migration Priority */}
                    {mosca && (
                      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Mosca Prioritization Analysis
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${moscaBg(mosca.urgency_label)} ${moscaColor(mosca.urgency_label)}`}>
                            Urgency: {mosca.urgency_label} ({mosca.migration_urgency > 0 ? `+${mosca.migration_urgency.toFixed(1)}` : mosca.migration_urgency.toFixed(1)}y)
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                            <span className="text-slate-400 block">Data Lifetime (X)</span>
                            <span className="text-slate-200 font-bold">{mosca.data_lifetime_years} years</span>
                          </div>
                          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                            <span className="text-slate-400 block">Migration Time (Y)</span>
                            <span className="text-slate-200 font-bold">{mosca.migration_time_years} years</span>
                          </div>
                          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                            <span className="text-slate-400 block">Threat Horizon (Z)</span>
                            <span className="text-slate-200 font-bold">{mosca.threat_horizon_years} years</span>
                          </div>
                          <div className="bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                            <span className="text-slate-400 block">Business Criticality</span>
                            <span className="text-slate-200 font-bold capitalize">{mosca.business_criticality || 'Medium'}</span>
                          </div>
                        </div>
                        {mosca.is_demo_assumption && (
                          <p className="text-[11px] text-slate-400 italic">
                            * Note: Lifetime and threat horizon values are configured demo assumptions for planning illustration.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── RISK → MITIGATE → MIGRATE → VERIFY hierarchy ── */}

                    {/* MITIGATE card */}
                    {mitigation && (
                      <>
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 space-y-3 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                              <ListChecks className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest">Mitigate</h3>
                              <p className="text-xs text-amber-200/60 mt-0.5">Reduce risk now while migration is prepared</p>
                            </div>
                          </div>
                          <div className="space-y-2.5 text-xs pl-[44px]">
                            <div>
                              <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">Immediate Action</div>
                              <p className="text-slate-200 leading-relaxed break-words">{mitigation.immediate_action}</p>
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">Interim Controls</div>
                              <ul className="space-y-0.5 text-slate-300 break-words">
                                {mitigation.interim_controls.slice(0, 3).map((control, index) => (
                                  <li key={`${finding.id}-control-${index}`} className="flex gap-2"><span className="text-amber-400/80">•</span><span>{control}</span></li>
                                ))}
                              </ul>
                            </div>
                            {mitigation.implementation_caution && (
                              <div>
                                <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider mb-0.5">Implementation Caution</div>
                                <p className="text-slate-400 leading-relaxed break-words text-xs">{mitigation.implementation_caution}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-600" /></div>
                      </>
                    )}

                    {/* MIGRATE card */}
                    <div className="bg-blue-950/20 border border-blue-500/40 rounded-xl p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                          <ArrowRight className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest">Migrate</h3>
                          <p className="text-xs text-blue-200/60 mt-0.5">Target cryptographic state</p>
                        </div>
                      </div>
                      <p className="text-base font-bold text-slate-100 leading-relaxed pl-[44px]">
                        {finding.migration_recommendation?.suggested_direction || finding.risk_assessment?.recommendation || 'Evaluate modern algorithm alternatives.'}
                      </p>
                      {finding.migration_recommendation?.migration_notes && (
                        <p className="text-xs text-slate-400 leading-relaxed pl-[44px] pt-1 border-t border-blue-900/40">
                          {finding.migration_recommendation.migration_notes}
                        </p>
                      )}
                    </div>

                    {/* VERIFY strip */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Verify</span>
                        <span className="text-xs text-slate-400 ml-2">Re-scan repository after remediation</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
