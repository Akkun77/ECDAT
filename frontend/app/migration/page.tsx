'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, Activity, CheckCircle2, ChevronDown, ChevronUp, Info, ArrowDown, ArrowRight, Shield, Zap, ListChecks } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, formatOperation, currentSecurityColor, quantumRiskColor, moscaColor } from '@/lib/display';
import type { FindingResponse } from '@/types/api';

export default function MigrationPage() {
  const { migration, scanStatus, state } = useScanContext();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Act Now': true,
    'Plan Migration': true,
    'Monitor': true,
    'No Urgent Action': false
  });

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  if (!isCompleted || !migration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <ArrowRight className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">No Migration Data Available</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md">
          Run a scan to generate prioritized post-quantum migration recommendations based on Mosca-style analysis.
        </p>
        <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-blue-400/30">
          Start Scanning
        </Link>
      </div>
    );
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupStyles = (name: string) => {
    if (name.includes('Act Now')) return { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' };
    if (name.includes('Plan')) return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
    if (name.includes('Monitor')) return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' };
    return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' };
  };

  const getGroupIcon = (name: string) => {
    if (name.includes('Act Now')) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (name.includes('Plan')) return <Clock className="w-4 h-4 text-amber-400" />;
    if (name.includes('Monitor')) return <Activity className="w-4 h-4 text-blue-400" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#1e2d42]">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-blue-400 shrink-0" />
          Migration Roadmap
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Prioritized post-quantum migration planning based on Mosca&apos;s theorem and cryptographic risk.
        </p>
      </div>

      {/* Mosca Explanation Card */}
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 flex gap-4 items-start">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">
            Mosca-Style Migration Prioritization: <span className="font-mono text-blue-400 font-normal">Urgency = Data Lifetime (X) + Migration Time (Y) − Threat Horizon (Z)</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            • If Urgency &gt; 0: <strong className="text-red-400">Act Now</strong> — migration timeline exceeds estimated threat horizon.<br />
            • If Urgency ≈ 0: <strong className="text-amber-400">Plan Migration</strong> — approaching critical threshold.<br />
            • If Urgency &lt; 0: <strong className="text-blue-400">Monitor</strong> — adequate safety margin remains.
          </p>
          <p className="text-xs text-slate-500 pt-1 italic">
            Demo values are configured as assumptions (threat horizon: 15 years) and do not attempt to predict exact quantum computer arrival dates.
          </p>
        </div>
      </div>

      {/* Migration Groups */}
      <div className="space-y-5">
        {migration.groups?.map((group) => {
          const style = getGroupStyles(group.name);
          const isExpanded = expandedGroups[group.name] ?? false;

          return (
            <div key={group.name} className={`border ${style.border} rounded-xl overflow-hidden bg-[#0e1726]`}>
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-between p-4 ${style.bg} hover:brightness-110 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#070b14] border border-[#1e2d42]">
                    {getGroupIcon(group.name)}
                  </div>
                  <h2 className="text-base font-bold text-slate-100">{group.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
                    {group.count} {group.count === 1 ? 'asset' : 'assets'}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {isExpanded && group.findings && group.findings.length > 0 && (
                <div className="p-4 divide-y divide-[#1e2d42]">
                  {group.findings.map((finding: FindingResponse) => {
                    const filePath = finding.file || finding.file_path || '';
                    const fileName = filePath.split(/[/\\]/).pop() || filePath;
                    const lineNum = finding.line || finding.line_number || '';
                    const algo = finding.algorithm || '';
                    const operation = finding.operation || finding.operation_type || '';
                    const currentSecurity = finding.current_security || finding.risk_assessment?.current_security_status || '';
                    const quantumStatus = finding.quantum_status || finding.risk_assessment?.quantum_risk_status || '';
                    const recommendation = finding.migration_recommendation?.suggested_direction || finding.reason || '';
                    const notes = finding.migration_recommendation?.migration_notes || '';
                    const mitigation = finding.migration_recommendation?.mitigation;
                    const mosca = finding.mosca;

                    return (
                      <div key={finding.id} className="py-4 first:pt-1 last:pb-1">
                        <div className="space-y-4 min-w-0">
                          <div className="space-y-2 min-w-0">
                            {/* Algorithm + Operation */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-base font-bold text-slate-100">
                                {finding.category === 'security_hygiene' ? 'Hardcoded Secret' : formatAlgorithm(algo)}
                              </span>
                              {finding.key_size && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#152033] text-slate-300 border border-[#1e2d42]">
                                  {finding.key_size}-bit
                                </span>
                              )}
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium capitalize">
                                {formatOperation(operation)}
                              </span>
                              <span className="text-xs text-slate-500 font-mono" title={filePath}>
                                {fileName}:{lineNum}
                              </span>
                            </div>

                            {/* Security & Quantum Tags */}
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-400">Current:</span>
                                <span className={`font-semibold ${currentSecurityColor(currentSecurity)}`}>
                                  {formatCurrentSecurity(currentSecurity)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-400">Quantum:</span>
                                <span className={`font-semibold ${quantumRiskColor(quantumStatus)}`}>
                                  {formatQuantumRisk(quantumStatus)}
                                </span>
                              </div>
                              {mosca && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400">Urgency:</span>
                                  <span className={`font-semibold ${moscaColor(mosca.urgency_label)}`}>
                                    {mosca.urgency_label} ({mosca.migration_urgency > 0 ? `+${mosca.migration_urgency.toFixed(1)}` : mosca.migration_urgency.toFixed(1)}y)
                                  </span>
                                  {mosca.is_demo_assumption && (
                                    <span className="text-[10px] text-slate-500 italic">(demo assumption)</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Snippet preview */}
                            {finding.code_snippet && (
                              <pre className="text-xs font-mono text-slate-300 bg-[#070b14] p-2.5 rounded border border-[#1e2d42] overflow-x-auto">
                                <code>{finding.code_snippet.trim()}</code>
                              </pre>
                            )}
                          </div>

                          <div className="space-y-2 min-w-0">
                            {/* RISK card */}
                            <div className="bg-[#152033] border border-[#1e2d42] rounded-xl p-4 min-w-0">
                              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">Risk</div>
                              <div className="flex flex-wrap gap-4 text-xs mb-2">
                                <span className="text-slate-400">Current: <strong className={currentSecurityColor(currentSecurity)}>{formatCurrentSecurity(currentSecurity)}</strong></span>
                                <span className="text-slate-400">Quantum: <strong className={quantumRiskColor(quantumStatus)}>{formatQuantumRisk(quantumStatus)}</strong></span>
                              </div>
                              <p className="text-xs text-slate-200 break-words leading-relaxed">{finding.reason}</p>
                            </div>

                            <ArrowDown className="w-4 h-4 text-slate-600 mx-auto" aria-hidden="true" />

                            {/* MITIGATE card */}
                            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 min-w-0">
                              <div className="flex items-start gap-3 mb-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                                  <ListChecks className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">Mitigate</div>
                                  <p className="text-[11px] text-amber-200/60 mt-0.5">Reduce risk now while migration is prepared</p>
                                </div>
                              </div>
                              {mitigation ? (
                                <div className="pl-[40px] space-y-2">
                                  <p className="text-xs font-semibold text-slate-100 break-words">{mitigation.immediate_action}</p>
                                  <ul className="space-y-0.5 text-xs text-slate-300 break-words">
                                    {mitigation.interim_controls.slice(0, 3).map((control, index) => (
                                      <li key={`${finding.id}-roadmap-control-${index}`} className="flex gap-2"><span className="text-amber-400/80">•</span><span>{control}</span></li>
                                    ))}
                                  </ul>
                                  {mitigation.implementation_caution && (
                                    <p className="text-[11px] text-slate-500 break-words">{mitigation.implementation_caution}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 pl-[40px]">No structured mitigation is available for this saved finding.</p>
                              )}
                            </div>

                            <ArrowDown className="w-4 h-4 text-slate-600 mx-auto" aria-hidden="true" />

                            {/* MIGRATE card */}
                            <div className="bg-blue-950/20 border border-blue-500/40 rounded-xl p-4 min-w-0 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                                  <ArrowRight className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-blue-300 uppercase tracking-widest">Migrate</div>
                                  <p className="text-[11px] text-blue-200/60 mt-0.5">Target cryptographic state</p>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-slate-100 break-words pl-[40px]">{recommendation}</p>
                              {notes && <p className="text-xs text-slate-400 break-words pl-[40px]">{notes}</p>}
                            </div>

                            <ArrowDown className="w-4 h-4 text-slate-600 mx-auto" aria-hidden="true" />

                            {/* VERIFY strip */}
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-4 py-2.5 min-w-0 flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Verify</span>
                                <span className="text-xs text-slate-400 ml-2">Re-scan repository after remediation</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && (!group.findings || group.findings.length === 0) && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No assets in this priority tier.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
