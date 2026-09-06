'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, FileJson, Table as TableIcon, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, formatOperation, severityBg, currentSecurityColor, quantumRiskColor } from '@/lib/display';
import { api } from '@/lib/api';
import type { CBOMComponent } from '@/types/api';

export default function CBOMPage() {
  const { cbom, scanStatus, scanId, state } = useScanContext();
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  if (!isCompleted || !cbom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <FileText className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">No CBOM Data Available</h2>
        <p className="text-slate-400 mb-6 max-w-md">
          Run a repository scan to generate the Cryptographic Bill of Materials (CBOM) inventory for your software.
        </p>
        <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Start Scanning
        </Link>
      </div>
    );
  }

  const rawComponents = (cbom.components || []) as (CBOMComponent & Record<string, any>)[];

  // Sorting logic
  const sortedComponents = [...rawComponents].sort((a, b) => {
    let aVal: any = a[sortField as keyof typeof a] ?? '';
    let bVal: any = b[sortField as keyof typeof b] ?? '';

    if (sortField === 'source') {
      aVal = `${a.source_file || ''}:${a.source_line || ''}`;
      bVal = `${b.source_file || ''}:${b.source_line || ''}`;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4 ml-1 text-blue-400" /> : <ChevronDown className="inline w-4 h-4 ml-1 text-blue-400" />;
  };

  const criticalCount = rawComponents.filter(c => c.severity?.toLowerCase() === 'critical').length;
  const quantumCount = rawComponents.filter(c => {
    const q = (c.quantum_risk || '').toLowerCase();
    return q === 'vulnerable' || q === 'migration_concern';
  }).length;
  const uniqueAlgos = new Set(rawComponents.map(c => c.algorithm || c.name)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Cryptographic Bill of Materials
          </h1>
          <p className="text-slate-400 mt-2">
            An ingredient list of the cryptography used across your application.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {scanId && (
            <>
              <a
                href={api.exportJson(scanId)}
                download
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/50 text-sm font-medium transition-colors"
              >
                <FileJson className="w-4 h-4 text-blue-400" />
                <span>Export JSON</span>
              </a>
              <a
                href={api.exportCsv(scanId)}
                download
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/50 text-sm font-medium transition-colors"
              >
                <TableIcon className="w-4 h-4 text-green-400" />
                <span>Export CSV</span>
              </a>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-slate-100 mb-1">{rawComponents.length}</div>
          <div className="text-xs text-slate-400">Crypto Assets</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">{uniqueAlgos}</div>
          <div className="text-xs text-slate-400">Unique Algorithms</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-red-400 mb-1">{criticalCount}</div>
          <div className="text-xs text-slate-400">Critical Assets</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-amber-400 mb-1">{quantumCount}</div>
          <div className="text-xs text-slate-400">Quantum Concerns</div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-slate-300 border-b border-slate-700/60">
              <tr>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('algorithm')}>
                  Algorithm <SortIcon field="algorithm" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('asset_type')}>
                  Asset Type <SortIcon field="asset_type" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('library')}>
                  Library <SortIcon field="library" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('operation')}>
                  Operation <SortIcon field="operation" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('key_size')}>
                  Key Size <SortIcon field="key_size" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('source')}>
                  Source Location <SortIcon field="source" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('current_risk')}>
                  Current Risk <SortIcon field="current_risk" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('quantum_risk')}>
                  Quantum Risk <SortIcon field="quantum_risk" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('severity')}>
                  Severity <SortIcon field="severity" />
                </th>
                <th className="px-5 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('migration_priority')}>
                  Priority <SortIcon field="migration_priority" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedComponents.map((component, idx) => {
                const sourceFile = component.source_file || component.locations?.[0]?.file || '';
                const sourceLine = component.source_line || component.locations?.[0]?.line_number || '';
                const fileName = sourceFile.split(/[/\\]/).pop() || sourceFile;
                const algo = component.algorithm || component.name || '';
                const currentRisk = component.current_risk || component.security_level || '';
                const quantumRisk = component.quantum_risk || '';

                return (
                  <tr key={component.bom_ref || idx} className={`hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/30'}`}>
                    <td className="px-5 py-3 font-semibold text-slate-100">
                      {component.category === 'security_hygiene' ? (
                        <span className="text-orange-400">Hardcoded Secret</span>
                      ) : (
                        formatAlgorithm(algo)
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{component.asset_type?.replace(/_/g, ' ') || 'Algorithm'}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">{component.library || '-'}</td>
                    <td className="px-5 py-3 text-slate-300 capitalize">{formatOperation(component.operation || '')}</td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">{component.key_size ? `${component.key_size} bits` : '-'}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs" title={sourceFile}>
                      {fileName}{sourceLine ? `:${sourceLine}` : ''}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${currentSecurityColor(currentRisk)}`}>
                        {formatCurrentSecurity(currentRisk)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${quantumRiskColor(quantumRisk)}`}>
                        {formatQuantumRisk(quantumRisk)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${severityBg(component.severity)}`}>
                        {component.severity?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300 capitalize font-medium text-xs">
                      {component.migration_priority?.replace(/_/g, ' ') || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
