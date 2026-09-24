'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, Activity, CheckCircle2, ChevronDown, ChevronUp, Info, Shield, Zap } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, formatOperation, currentSecurityColor, quantumRiskColor, moscaColor } from '@/lib/display';
import type { FindingResponse } from '@/types/api';
import InteractiveMitigation from '@/components/interactive-mitigation';

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
        <div className="relative w-64 h-32 mb-8 flex items-center justify-between">
          {/* Risk Node */}
          <div className="w-20 h-16 bg-[#171A1D] border border-[#C76B6B]/30 rounded-lg flex flex-col items-center justify-center gap-1 opacity-75">
            <Shield className="w-4 h-4 text-[#C76B6B]" />
            <div className="w-8 h-1 bg-[#C76B6B]/20 rounded-full" />
          </div>
          
          {/* Arrow */}
          <div className="flex-1 flex items-center px-2">
            <div className="w-full h-[1px] bg-gradient-to-r from-[#C76B6B]/30 via-[#34393D] to-[#7EA992]/30 relative">
              <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-[#7EA992]/50 rotate-45" />
            </div>
          </div>
          
          {/* Target Node */}
          <div className="w-20 h-16 bg-[#171A1D] border border-[#7EA992]/30 rounded-lg flex flex-col items-center justify-center gap-1 opacity-75">
            <Shield className="w-4 h-4 text-[#7EA992]" />
            <div className="w-8 h-1 bg-[#7EA992]/20 rounded-full" />
          </div>
          
          {/* Central Overlay */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-[#0F1113] border border-[#34393D] rounded-lg">
            <Clock className="w-5 h-5 text-[#C7A15D]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#F4F1E8] mb-2">No Migration Data Available</h2>
        <p className="text-[#8A9094] text-xs sm:text-sm mb-6 max-w-md">
          Run a scan to generate prioritized post-quantum migration recommendations based on Mosca-style analysis.
        </p>
        <Link
          href="/scan"
          className="bg-gradient-to-b from-[#C8A96B] to-[#B89658] hover:from-[#D4B679] hover:to-[#C8A96B] text-[#0F1113] px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-[#C8A96B]/50"
        >
          Start Scanning
        </Link>
      </div>
    );
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupStyles = (name: string) => {
    if (name.includes('Act Now')) return { border: 'border-[#D66A6A]/35', bg: 'bg-[#D66A6A]/10', text: 'text-[#D66A6A]', badge: 'bg-[#D66A6A]/20 text-[#D66A6A]' };
    if (name.includes('Plan')) return { border: 'border-[#D4A24C]/35', bg: 'bg-[#D4A24C]/10', text: 'text-[#D4A24C]', badge: 'bg-[#D4A24C]/20 text-[#D4A24C]' };
    if (name.includes('Monitor')) return { border: 'border-[#7695BF]/35', bg: 'bg-[#7695BF]/10', text: 'text-[#7695BF]', badge: 'bg-[#7695BF]/20 text-[#7695BF]' };
    return { border: 'border-[#64C59B]/35', bg: 'bg-[#64C59B]/10', text: 'text-[#64C59B]', badge: 'bg-[#64C59B]/20 text-[#64C59B]' };
  };

  const getGroupIcon = (name: string) => {
    if (name.includes('Act Now')) return <AlertTriangle className="w-4 h-4 text-[#D66A6A]" />;
    if (name.includes('Plan')) return <Clock className="w-4 h-4 text-[#D4A24C]" />;
    if (name.includes('Monitor')) return <Activity className="w-4 h-4 text-[#7695BF]" />;
    return <CheckCircle2 className="w-4 h-4 text-[#64C59B]" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-[#3A3D3E]">
        <h1 className="text-2xl font-bold text-[#F3F0E9] flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-[#77AFA9] shrink-0" />
          Migration Roadmap
        </h1>
        <p className="text-[#8B9095] text-xs sm:text-sm mt-1">
          Prioritized post-quantum migration planning based on Mosca&apos;s theorem and cryptographic risk.
        </p>
      </div>

      {/* Mosca Explanation Card */}
      <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-5 flex gap-4 items-start shadow-sm">
        <Info className="w-5 h-5 text-[#C5A871] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#F3F0E9]">
            Mosca-Style Migration Prioritization: <span className="font-mono text-[#C5A871] font-normal">Urgency = Data Lifetime (X) + Migration Time (Y) − Threat Horizon (Z)</span>
          </p>
          <p className="text-xs text-[#8A9094] leading-relaxed">
            • If Urgency &gt; 0: <strong className="text-[#C76B6B]">Act Now</strong> — migration timeline exceeds estimated threat horizon.<br />
            • If Urgency ≈ 0: <strong className="text-[#C7A15D]">Plan Migration</strong> — approaching critical threshold.<br />
            • If Urgency &lt; 0: <strong className="text-[#6E84A3]">Monitor</strong> — adequate safety margin remains.
          </p>
          <p className="text-xs text-[#8A9094]/80 pt-1 italic">
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
            <div key={group.name} className={`border ${style.border} rounded-xl overflow-hidden bg-[#171A1D]`}>
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center justify-between p-4 ${style.bg} hover:brightness-105 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#0F1113] border border-[#34393D]">
                    {getGroupIcon(group.name)}
                  </div>
                  <h2 className="text-base font-bold text-[#F4F1E8]">{group.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badge}`}>
                    {group.count} {group.count === 1 ? 'asset' : 'assets'}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#8A9094]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#8A9094]" />
                )}
              </button>

              {isExpanded && group.findings && group.findings.length > 0 && (
                <div className="p-4 divide-y divide-[#34393D]">
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
                              <span className="text-base font-bold text-[#F4F1E8]">
                                {finding.category === 'security_hygiene' ? 'Hardcoded Secret' : formatAlgorithm(algo)}
                              </span>
                              {finding.key_size && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1F2327] text-[#E2DFD8] border border-[#34393D]">
                                  {finding.key_size}-bit
                                </span>
                              )}
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1F2327] text-[#78AAA4] border border-[#34393D] font-medium capitalize">
                                {formatOperation(operation)}
                              </span>
                              <span className="text-xs text-[#8A9094] font-mono" title={filePath}>
                                {fileName}:{lineNum}
                              </span>
                            </div>

                            {/* Security & Quantum Tags */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Shield className="w-3.5 h-3.5 text-[#8A9094]" />
                                <span className="text-[#8A9094]">Current:</span>
                                <span className={`font-semibold ${currentSecurityColor(currentSecurity)}`}>
                                  {formatCurrentSecurity(currentSecurity)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Zap className="w-3.5 h-3.5 text-[#8A9094]" />
                                <span className="text-[#8A9094]">Quantum:</span>
                                <span className={`font-semibold ${quantumRiskColor(quantumStatus)}`}>
                                  {formatQuantumRisk(quantumStatus)}
                                </span>
                              </div>
                              {mosca && (
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                  <span className="text-[#8A9094]">Urgency:</span>
                                  <span className={`font-semibold ${moscaColor(mosca.urgency_label)}`}>
                                    {mosca.urgency_label} ({mosca.migration_urgency > 0 ? `+${mosca.migration_urgency.toFixed(1)}` : mosca.migration_urgency.toFixed(1)}y)
                                  </span>
                                  {mosca.is_demo_assumption && (
                                    <span className="text-[10px] text-[#8A9094] italic">(demo assumption)</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Mitigation Component */}
                          <div className="pt-2">
                            <InteractiveMitigation
                              findingId={finding.id}
                              algorithm={algo}
                              currentSecurity={currentSecurity}
                              quantumStatus={quantumStatus}
                              category={finding.category}
                              keySize={finding.key_size}
                              operation={operation}
                              mitigation={mitigation}
                              recommendation={recommendation}
                              notes={notes}
                              reason={finding.reason}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
