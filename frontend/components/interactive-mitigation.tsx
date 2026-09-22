'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ListChecks, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Shield, 
  CheckSquare, 
  Square,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import type { MitigationGuidance } from '@/types/api';
import { getStatusLabel, getMitigationSummaryLine } from '@/lib/display';

export interface InteractiveMitigationProps {
  findingId: string;
  algorithm?: string | null;
  currentSecurity?: string | null;
  quantumStatus?: string | null;
  category?: string | null;
  keySize?: number | null;
  operation?: string | null;
  mitigation?: MitigationGuidance | null;
  recommendation?: string | null;
  notes?: string | null;
  reason?: string | null;
}



export default function InteractiveMitigation({
  findingId,
  algorithm,
  currentSecurity,
  quantumStatus,
  category,
  keySize,
  operation,
  mitigation,
  recommendation,
  notes,
  reason
}: InteractiveMitigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const statusInfo = getStatusLabel(algorithm, currentSecurity, quantumStatus, category);
  const summaryLine = getMitigationSummaryLine(
    algorithm, 
    currentSecurity, 
    quantumStatus, 
    keySize, 
    mitigation?.immediate_action
  );

  // Fallback controls if mitigation is missing or empty
  const defaultControls = React.useMemo(() => {
    if (mitigation?.interim_controls && mitigation.interim_controls.length > 0) {
      return mitigation.interim_controls;
    }
    const algo = (algorithm || '').toLowerCase();
    if (algo === 'md5') {
      return [
        'Identify where MD5 digest is generated and verified',
        'Prevent new security-sensitive MD5 usage across codebases',
        'Replace affected integrity checks with SHA-256 / SHA-3 or password hashing'
      ];
    }
    if (algo.includes('rsa')) {
      return [
        'Inventory affected RSA dependencies and key usage',
        'Prioritize long-lived sensitive systems and workloads',
        'Begin post-quantum compatibility testing (ML-KEM / ML-DSA)'
      ];
    }
    if (algo.includes('aes')) {
      return [
        'Verify unique IV / nonce generation handling',
        'Verify key lifecycle and secure key storage',
        'Ensure authentication tags are validated correctly'
      ];
    }
    return [
      'Inventory affected cryptographic call sites',
      'Isolate legacy dependencies in configuration',
      'Verify access controls and key lifetime parameters'
    ];
  }, [mitigation, algorithm]);

  const immediateAction = mitigation?.immediate_action || summaryLine;
  const implementationCaution = mitigation?.implementation_caution || 
    (algorithm?.toLowerCase().includes('rsa')
      ? 'ML-KEM is not a drop-in RSA encryption replacement; migration requires protocol and API architecture updates.'
      : algorithm?.toLowerCase() === 'md5'
      ? 'Do not blindly replace password hashing with SHA-256; use Argon2id or bcrypt for credentials.'
      : 'Verify mode, key management, IV handling, and interoperability before applying replacement code.');
  const validationStep = mitigation?.validation_step || 
    'Apply the reviewed configuration, execute integration tests, and re-scan repository.';

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const targetMigrationState = React.useMemo(() => {
    if (recommendation) return recommendation;
    const algo = (algorithm || '').toLowerCase();
    if (algo === 'md5') return 'SHA-256 / SHA-3 (or Argon2id / bcrypt for credentials)';
    if (algo.includes('rsa')) {
      const op = (operation || '').toLowerCase();
      if (op.includes('signature')) return 'ML-DSA (Dilithium) / stateful hash-based signatures';
      return 'ML-KEM (Kyber) / hybrid key-establishment';
    }
    if (algo.includes('aes')) return 'Retain current algorithm (AES-256-GCM) if correctly implemented';
    return 'Evaluate modern NIST/CNSA 2.0 approved algorithm alternatives';
  }, [recommendation, algorithm, operation]);

  return (
    <div className="space-y-3 min-w-0">
      {/* ──────────────── MITIGATE CARD ──────────────── */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl overflow-hidden transition-all duration-200">
        {/* Card Header & Compact Summary */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                <ListChecks className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Mitigate</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/60 mt-0.5">Reduce risk now while migration is prepared</p>
              </div>
            </div>

            {/* Expand / Collapse Control Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-[#070b14] hover:bg-[#152033] text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>{isExpanded ? 'Hide Interim Controls' : 'Expand Controls & Caution'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mitigation Summary Line */}
          <div className="bg-[#070b14]/90 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200 font-medium leading-relaxed">
            <span className="text-amber-400 font-bold mr-1.5">Action Summary:</span>
            {summaryLine}
          </div>

          {/* Collapsed view: Immediate Action summary line */}
          {!isExpanded && (
            <div className="text-xs text-slate-300 pl-1 pt-1 flex items-start gap-2">
              <span className="text-amber-400 font-bold shrink-0">•</span>
              <span className="text-slate-300 leading-relaxed"><strong className="text-slate-200 font-semibold">Immediate Action:</strong> {immediateAction}</span>
            </div>
          )}
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-amber-500/20 space-y-3.5 bg-[#070b14]/50 text-xs">
            {/* Immediate Action */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                Immediate Action
              </div>
              <p className="text-slate-200 leading-relaxed bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                {immediateAction}
              </p>
            </div>

            {/* Interim Controls (Interactive Checklist Feel) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  Interim Controls Checklist
                </div>
                <span className="text-[10px] text-slate-400 italic">
                  {Object.values(checkedItems).filter(Boolean).length} of {defaultControls.length} completed
                </span>
              </div>
              <div className="space-y-1.5 bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                {defaultControls.map((control, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <div 
                      key={`${findingId}-control-${idx}`}
                      onClick={() => toggleCheck(idx)}
                      className={`flex items-start gap-2.5 p-1.5 rounded-md cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-950/20 text-emerald-300' : 'hover:bg-[#152033]/60 text-slate-300'
                      }`}
                    >
                      <button type="button" className="mt-0.5 shrink-0 focus:outline-none">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 hover:text-amber-400 transition-colors" />
                        )}
                      </button>
                      <span className={`leading-relaxed text-xs ${isChecked ? 'line-through opacity-75' : ''}`}>
                        {control}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Implementation Caution */}
            {implementationCaution && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Implementation Caution
                </div>
                <p className="text-amber-200/90 leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/30">
                  {implementationCaution}
                </p>
              </div>
            )}

            {/* Validation Step */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Validation Step
              </div>
              <p className="text-slate-300 leading-relaxed bg-[#070b14] p-2.5 rounded-lg border border-[#1e2d42]">
                {validationStep}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <ArrowDown className="w-4 h-4 text-slate-600" />
      </div>

      {/* ──────────────── MIGRATE CARD (Visually Stronger Target State) ──────────────── */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#0e1726] to-blue-950/30 border-2 border-blue-500/60 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-400 shrink-0 shadow-sm">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest">Migrate</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                  Target Cryptographic State
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Post-quantum target algorithm &amp; direction</p>
            </div>
          </div>
        </div>

        <div className="bg-[#070b14] border border-blue-500/30 rounded-lg p-3.5 pl-4">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Target Direction</div>
          <div className="text-base font-extrabold text-slate-100 tracking-tight leading-snug">
            {targetMigrationState}
          </div>
        </div>

        {(notes || reason) && (
          <p className="text-xs text-slate-400 leading-relaxed pl-1">
            {notes || reason}
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <ArrowDown className="w-4 h-4 text-slate-600" />
      </div>

      {/* ──────────────── VERIFY STRIP ──────────────── */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Verify</div>
            <p className="text-xs text-slate-300 mt-0.5">Re-scan repository after remediation</p>
          </div>
        </div>

        <Link
          href="/scan"
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-scan Repository →</span>
        </Link>
      </div>
    </div>
  );
}
