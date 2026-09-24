'use client';

import React, { useState, useMemo } from 'react';
import { useScanContext } from '@/components/scan-provider';
import {
  formatAlgorithm, formatSeverity, formatCurrentSecurity, formatQuantumRisk, formatOperation
} from '@/lib/display';
import { AlertTriangle, FileCode, ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';
import InteractiveMitigation from '@/components/interactive-mitigation';

const FilterPills = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string, onChange: (v: string) => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
    <span className="text-[#8A9094] text-xs font-semibold uppercase tracking-wider whitespace-nowrap min-w-[110px]">{label}:</span>
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
              isSelected
                ? 'bg-[#1F2327] text-[#F4F1E8] border-[#C8A96B] font-semibold shadow-sm'
                : 'bg-[#171A1D] text-[#8A9094] border-[#34393D] hover:border-[#4A4F54] hover:text-[#B8BDBD]'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

function getSeverityBadgeStyle(severity?: string) {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return 'bg-[#D66A6A]/15 text-[#D66A6A] border border-[#D66A6A]/35';
  if (s === 'high') return 'bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/35';
  if (s === 'medium') return 'bg-[#D4A24C]/10 text-[#D4A24C] border border-[#D4A24C]/25';
  if (s === 'low') return 'bg-[#77AFA9]/15 text-[#77AFA9] border border-[#77AFA9]/35';
  return 'bg-[#3A3D3E]/40 text-[#8B9095] border border-[#3A3D3E]';
}

function getSecurityBadgeStyle(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'broken') return 'bg-[#D66A6A]/15 text-[#D66A6A] border border-[#D66A6A]/35';
  if (s === 'deprecated') return 'bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/35';
  if (s === 'acceptable' || s === 'strong') return 'bg-[#64C59B]/15 text-[#64C59B] border border-[#64C59B]/35';
  return 'bg-[#3A3D3E]/30 text-[#8B9095] border border-[#3A3D3E]';
}

function getQuantumBadgeStyle(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'vulnerable') return 'bg-[#D66A6A]/15 text-[#D66A6A] border border-[#D66A6A]/35';
  if (s === 'migration_concern') return 'bg-[#D4A24C]/15 text-[#D4A24C] border border-[#D4A24C]/35';
  if (s === 'low_concern') return 'bg-[#64C59B]/15 text-[#64C59B] border border-[#64C59B]/35';
  return 'bg-[#3A3D3E]/30 text-[#8B9095] border border-[#3A3D3E]';
}

export default function FindingsPage() {
  const { findings, summary } = useScanContext();
  
  const [severityFilter, setSeverityFilter] = useState('All');
  const [securityFilter, setSecurityFilter] = useState('All');
  const [quantumFilter, setQuantumFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pb-3 border-b border-[#34393D]">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F1E8] flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#C7A15D] shrink-0" />
            Cryptographic Findings
          </h1>
          <p className="text-[#8A9094] text-xs sm:text-sm mt-1">
            Every discovery is traceable to exact source files, call sites, static analysis rules, and security policies.
          </p>
        </div>
        <div className="text-xs text-[#8A9094] bg-[#171A1D] px-3.5 py-1.5 rounded-lg border border-[#34393D] shrink-0">
          Showing <span className="font-bold text-[#F4F1E8]">{filteredFindings.length}</span> of{' '}
          <span className="font-bold text-[#F4F1E8]">{summary?.total_findings ?? findings.length}</span> findings
        </div>
      </div>

      {/* Analytical Filters Toolbar */}
      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9094]" />
            <input
              type="text"
              placeholder="Search by algorithm, filename, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1113] border border-[#34393D] rounded-lg pl-10 pr-4 py-2 text-xs text-[#F4F1E8] placeholder:text-[#8A9094] focus:outline-none focus:border-[#C8A96B] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="inline-flex items-center gap-1.5 text-xs text-[#C8A96B] hover:text-[#D4B679] font-medium transition-colors self-start md:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showMoreFilters ? 'Fewer Filters' : 'More Filters'}
          </button>
        </div>
        
        {/* Main Filters */}
        <FilterPills 
          label="Severity" 
          options={['All', 'Critical', 'High', 'Medium', 'Low', 'Informational']} 
          selected={severityFilter} 
          onChange={setSeverityFilter} 
        />
        <FilterPills
          label="Quantum Risk"
          options={['All', 'Vulnerable', 'Migration Concern', 'Low Concern', 'Not Applicable']}
          selected={quantumFilter}
          onChange={setQuantumFilter}
        />

        {/* Secondary Expandable Filters */}
        {showMoreFilters && (
          <div className="pt-3 border-t border-[#34393D] space-y-3">
            <FilterPills
              label="Current Security"
              options={['All', 'Broken', 'Deprecated', 'Acceptable', 'Strong']}
              selected={securityFilter}
              onChange={setSecurityFilter}
            />
            <FilterPills
              label="Category"
              options={['All', 'Cryptographic', 'Security Hygiene']}
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>
        )}
      </div>

        {/* Findings List */}
      <div className="space-y-3">
        {/* Desktop Header Row */}
        {filteredFindings.length > 0 && (
          <div className="hidden md:flex items-center gap-4 px-5 pb-2 border-b border-[#34393D] text-[11px] font-semibold text-[#8A9094] uppercase tracking-wider select-none">
            <div className="w-32 shrink-0">Severity</div>
            <div className="flex-1 grid grid-cols-12 gap-3 min-w-0">
              <div className="col-span-3">Algorithm / Asset</div>
              <div className="col-span-3">Source Location</div>
              <div className="col-span-2">Current Security</div>
              <div className="col-span-2">Quantum Risk</div>
              <div className="col-span-2">Operation</div>
            </div>
            <div className="w-6 shrink-0"></div>
          </div>
        )}

        {filteredFindings.length === 0 ? (
          <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-12 text-center text-[#8A9094] text-sm">
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
            const isSecurityHygiene = finding.category === 'security_hygiene';

            return (
              <div key={finding.id} className="bg-[#171A1D] border border-[#34393D] rounded-xl overflow-hidden hover:border-[#4A4F54] transition-colors">
                {/* Desktop and Mobile Row Header */}
                <div 
                  className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 cursor-pointer hover:bg-[#1F2327]/60 transition-colors select-none"
                  onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                >
                  {/* Severity Badge */}
                  <div className="flex justify-between items-center md:block md:w-32 shrink-0">
                    <div className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold uppercase tracking-wider text-center whitespace-nowrap inline-block md:block ${getSeverityBadgeStyle(finding.severity)}`}>
                      {formatSeverity(finding.severity)}
                    </div>
                    <div className="md:hidden text-[#8A9094]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  {/* Columns */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-start md:items-center min-w-0 text-xs">
                    {/* Algorithm / Asset */}
                    <div className="md:col-span-3 font-semibold text-[#F4F1E8] truncate flex items-center gap-2">
                      <span className="md:hidden text-[#8A9094] font-normal w-24 shrink-0">Asset:</span>
                      <span className="truncate">
                        {isSecurityHygiene ? 'Hardcoded Secret' : formatAlgorithm(finding.algorithm || '')}
                        {finding.key_size && ` (${finding.key_size}-bit)`}
                      </span>
                    </div>
                    
                    {/* Source Location */}
                    <div className="md:col-span-3 flex items-center gap-1.5 text-[#8A9094] font-mono truncate" title={filePath}>
                      <span className="md:hidden font-normal font-sans text-[#8A9094] w-24 shrink-0">Location:</span>
                      <FileCode className="w-3.5 h-3.5 shrink-0 hidden md:block text-[#6E84A3]" />
                      <span className="truncate">{fileName}:{lineNum}</span>
                    </div>
                    
                    {/* Current Security */}
                    <div className="md:col-span-2 truncate flex items-center gap-2">
                      <span className="md:hidden text-[#8B9095] font-normal w-24 shrink-0">Current Sec:</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${getSecurityBadgeStyle(currentSec)}`}>
                        {formatCurrentSecurity(currentSec)}
                      </span>
                    </div>
                    
                    {/* Quantum Risk */}
                    <div className="md:col-span-2 truncate flex items-center gap-2">
                      <span className="md:hidden text-[#8B9095] font-normal w-24 shrink-0">Quantum:</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${getQuantumBadgeStyle(quantumRisk)}`}>
                        {formatQuantumRisk(quantumRisk)}
                      </span>
                    </div>
                    
                    {/* Operation */}
                    <div className="md:col-span-2 text-[#8A9094] capitalize truncate flex items-center gap-2">
                      <span className="md:hidden text-[#8A9094] font-normal w-24 shrink-0">Operation:</span>
                      <span className="truncate">{formatOperation(finding.operation || finding.operation_type || '')}</span>
                    </div>
                  </div>
                  
                  {/* Expand Chevron Desktop */}
                  <div className="shrink-0 text-[#8A9094] hidden md:block">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                
                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="p-4 md:p-6 border-t border-[#34393D] bg-[#0F1113]/90 space-y-6">
                    {/* 1. Header Information */}
                    <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#34393D]">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[#F4F1E8]">
                          {isSecurityHygiene ? 'Hardcoded Secret / Credential' : formatAlgorithm(finding.algorithm || '')}
                        </h2>
                        {finding.key_size && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1F2327] text-[#E2DFD8] border border-[#34393D]">
                            Key size: {finding.key_size} bits
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getSeverityBadgeStyle(finding.severity)}`}>
                          {finding.severity?.toUpperCase()} SEVERITY
                        </span>
                      </div>
                      <div className="text-xs text-[#8A9094] font-mono">
                        Rule: {finding.scanner_rule_id || '-'}
                      </div>
                    </div>

                    {/* 2. File Location & Snippet */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-[#8A9094] uppercase tracking-wider flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#78AAA4]" />
                        <span>File Location:</span>
                        <span className="font-mono text-[#F4F1E8] lowercase normal-case">{filePath}:{lineNum}</span>
                      </div>
                      {finding.code_snippet && (
                        <div className="bg-[#171A1D] border border-[#34393D] rounded-lg p-3 font-mono text-xs text-[#E2DFD8] overflow-x-auto whitespace-pre">
                          {finding.code_snippet}
                        </div>
                      )}
                    </div>

                    {/* 3. Interactive Mitigation & Migration Roadmap */}
                    <div className="pt-2">
                      <InteractiveMitigation
                        findingId={finding.id}
                        algorithm={finding.algorithm}
                        currentSecurity={currentSec}
                        quantumStatus={quantumRisk}
                        category={finding.category}
                        keySize={finding.key_size}
                        operation={finding.operation || finding.operation_type}
                        mitigation={finding.migration_recommendation?.mitigation}
                        recommendation={finding.migration_recommendation?.suggested_direction || finding.risk_assessment?.recommendation}
                        notes={finding.migration_recommendation?.migration_notes}
                        reason={finding.reason}
                      />
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
