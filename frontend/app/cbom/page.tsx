'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileJson, Table as TableIcon, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, formatOperation } from '@/lib/display';
import { api } from '@/lib/api';
import type { CBOMComponent } from '@/types/api';
import {
  buildExposureMap,
  buildExposureComparison,
  getAssetFamily,
  getCanonicalAlgorithmName,
  getComponentAssetLabel,
  matchesExposureSelection,
  type ExposureMode,
  type ExposureSelection,
} from '@/lib/cbom';
import { CryptographicExposureMap } from '@/components/cryptographic-exposure-map';
import { ExposureComparisonChart } from '@/components/exposure-comparison-chart';

function getSecurityBadge(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'broken') return 'bg-[#D66A6A]/15 text-[#D66A6A] border-[#D66A6A]/40';
  if (s === 'deprecated') return 'bg-[#D4A24C]/15 text-[#D4A24C] border-[#D4A24C]/40';
  if (s === 'acceptable' || s === 'strong') return 'bg-[#64C59B]/15 text-[#64C59B] border-[#64C59B]/40';
  return 'bg-[#3A3D3E]/30 text-[#8B9095] border-[#3A3D3E]';
}

function getQuantumBadge(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'vulnerable') return 'bg-[#D66A6A]/15 text-[#D66A6A] border-[#D66A6A]/40';
  if (s === 'migration_concern') return 'bg-[#D4A24C]/15 text-[#D4A24C] border-[#D4A24C]/40';
  if (s === 'low_concern') return 'bg-[#64C59B]/15 text-[#64C59B] border-[#64C59B]/40';
  return 'bg-[#3A3D3E]/30 text-[#8B9095] border-[#3A3D3E]';
}

function SortIcon({ field, sortField, sortDirection }: { field: string; sortField: string; sortDirection: 'asc' | 'desc' }) {
  if (field !== sortField) return null;
  return sortDirection === 'asc' ? (
    <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-[#C5A871]" />
  ) : (
    <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-[#C5A871]" />
  );
}

export default function CBOMPage() {
  const { cbom, scanStatus, scanId, state } = useScanContext();
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [exposureMode, setExposureMode] = useState<ExposureMode>('current');
  const [exposureSelection, setExposureSelection] = useState<ExposureSelection | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<string | null>(null);

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  if (!isCompleted || !cbom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="relative w-48 h-32 mb-8 flex flex-col gap-2">
          {/* Wireframe Table Schematic */}
          <div className="w-full h-6 bg-[#171A1D] border border-[#34393D] rounded flex gap-2 p-1">
            <div className="h-full w-1/4 bg-[#34393D]/50 rounded-sm" />
            <div className="h-full w-1/4 bg-[#34393D]/50 rounded-sm" />
            <div className="h-full w-1/2 bg-[#34393D]/50 rounded-sm" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-5 border-b border-[#34393D]/40 flex gap-2 p-1 opacity-60">
              <div className="h-full w-1/4 bg-[#34393D]/30 rounded-sm" />
              <div className="h-full w-1/4 bg-[#34393D]/30 rounded-sm" />
              <div className="h-full w-1/2 bg-[#34393D]/20 rounded-sm" />
            </div>
          ))}
          <div className="absolute -bottom-2 -right-2 p-2 bg-[#0F1113] border border-[#34393D] rounded-lg">
            <FileText className="w-5 h-5 text-[#78AAA4]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#F4F1E8] mb-2">No CBOM Data Available</h2>
        <p className="text-[#8A9094] text-xs sm:text-sm mb-6 max-w-md">
          Run a repository scan to generate the Cryptographic Bill of Materials (CBOM) inventory for your software.
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

  const rawComponents = (cbom.components || []) as (CBOMComponent & Record<string, unknown>)[];

  const exposureMap = buildExposureMap(rawComponents, exposureMode);
  const exposureComparison = buildExposureComparison(rawComponents);
  const indexedComponents = rawComponents.map((component, index) => ({ component, index }));
  const selectedComparison = exposureComparison.find((row) => row.label === comparisonSelection);
  const selectedComponents = indexedComponents.filter(({ index }) =>
    matchesExposureSelection(index, exposureMap, exposureSelection)
    && (!selectedComparison || selectedComparison.componentIndexes.includes(index)),
  );

  // Sorting stays on the raw, selected records so a graph click never changes the source evidence.
  const sortedComponents = [...selectedComponents].sort(({ component: a }, { component: b }) => {
    let aVal: unknown = a[sortField as keyof typeof a] ?? '';
    let bVal: unknown = b[sortField as keyof typeof b] ?? '';

    if (sortField === 'source') {
      aVal = `${a.source_file || ''}:${a.source_line || ''}`;
      bVal = `${b.source_file || ''}:${b.source_line || ''}`;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
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


  const criticalCount = rawComponents.filter((c) => c.severity?.toLowerCase() === 'critical').length;
  const quantumCount = rawComponents.filter((c) => {
    const q = (c.quantum_risk || '').toLowerCase();
    return q === 'vulnerable' || q === 'migration_concern';
  }).length;
  const cryptographicAssets = rawComponents.filter((component) => {
    const family = getAssetFamily(component);
    return family !== 'Credentials / secrets' && family !== 'Insecure randomness' && family !== 'Unknown asset category';
  });
  const uniqueAlgos = new Set(cryptographicAssets.map(getCanonicalAlgorithmName).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-[#34393D]">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F1E8] flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#78AAA4] shrink-0" />
            Cryptographic Bill of Materials
          </h1>
          <p className="text-[#8A9094] text-xs sm:text-sm mt-1">
            Standardized CycloneDX cryptographic asset inventory mapped directly to source call sites.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {scanId && (
            <>
              <a
                href={api.exportJson(scanId)}
                download
                className="flex items-center gap-2 px-3.5 py-2 bg-[#171A1D] hover:bg-[#1F2327] text-[#F4F1E8] rounded-lg border border-[#34393D] text-xs font-medium transition-colors"
              >
                <FileJson className="w-4 h-4 text-[#78AAA4]" />
                <span>Export JSON</span>
              </a>
              <a
                href={api.exportCsv(scanId)}
                download
                className="flex items-center gap-2 px-3.5 py-2 bg-[#171A1D] hover:bg-[#1F2327] text-[#F4F1E8] rounded-lg border border-[#34393D] text-xs font-medium transition-colors"
              >
                <TableIcon className="w-4 h-4 text-[#C8A96B]" />
                <span>Export CSV</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#F3F0E9] mb-0.5">{rawComponents.length}</div>
          <div className="text-xs text-[#8B9095] font-medium uppercase tracking-wider">Crypto Assets</div>
        </div>
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#77AFA9] mb-0.5">{uniqueAlgos}</div>
          <div className="text-xs text-[#8B9095] font-medium uppercase tracking-wider">Unique Algorithms</div>
        </div>
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#D66A6A] mb-0.5">{criticalCount}</div>
          <div className="text-xs text-[#8B9095] font-medium uppercase tracking-wider">Critical Assets</div>
        </div>
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#D4A24C] mb-0.5">{quantumCount}</div>
          <div className="text-xs text-[#8B9095] font-medium uppercase tracking-wider">Quantum Concerns</div>
        </div>
      </div>

      <CryptographicExposureMap
        map={exposureMap}
        mode={exposureMode}
        selection={exposureSelection}
        onModeChange={(mode) => {
          setExposureMode(mode);
          setExposureSelection(null);
          setComparisonSelection(null);
        }}
        onSelectionChange={(selection) => {
          setExposureSelection(selection);
          setComparisonSelection(null);
        }}
      />

      <ExposureComparisonChart
        rows={exposureComparison}
        selection={comparisonSelection}
        onSelectionChange={(selection) => {
          setComparisonSelection(selection);
          setExposureSelection(null);
        }}
      />

      {/* Structured CBOM Inventory Table */}
      <div className="bg-[#171A1D] border border-[#34393D] rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#34393D] bg-[#15191E] px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F1E8]">Detailed CBOM inventory</h2>
            <p className="mt-0.5 text-xs text-[#8A9094]">
              {selectedComponents.length} of {rawComponents.length} source-mapped assets shown{exposureSelection ? ' for the selected exposure path' : comparisonSelection ? ` for ${comparisonSelection}` : ''}.
            </p>
          </div>
          {(exposureSelection || comparisonSelection) && (
            <button type="button" onClick={() => { setExposureSelection(null); setComparisonSelection(null); }} className="text-xs font-semibold text-[#C8A96B] hover:text-[#F4F1E8]">
              Reset selection
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#1F2327] text-[#8A9094] border-b border-[#34393D]">
              <tr>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('algorithm')}
                >
                  Algorithm <SortIcon field="algorithm" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('asset_type')}
                >
                  Asset Type <SortIcon field="asset_type" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('library')}
                >
                  Library <SortIcon field="library" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('operation')}
                >
                  Operation <SortIcon field="operation" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('key_size')}
                >
                  Key Size <SortIcon field="key_size" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('source')}
                >
                  Source Location <SortIcon field="source" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('current_risk')}
                >
                  Current Risk <SortIcon field="current_risk" sortField={sortField} sortDirection={sortDirection} />
                </th>
                <th
                  className="px-4 py-3 font-semibold uppercase tracking-wider cursor-pointer hover:text-[#F4F1E8] transition-colors"
                  onClick={() => handleSort('quantum_risk')}
                >
                  Quantum Risk <SortIcon field="quantum_risk" sortField={sortField} sortDirection={sortDirection} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#34393D]">
              {sortedComponents.map(({ component: c, index }) => {
                const family = getAssetFamily(c);
                const isHygiene = family === 'Credentials / secrets' || family === 'Insecure randomness';
                const currentSec = (c.current_risk || c.current_security || (c.severity === 'critical' ? 'broken' : 'acceptable')) as string;
                const quantum = (c.quantum_risk || 'not_applicable') as string;

                return (
                  <tr key={`${c.algorithm || c.name}-${index}`} className="hover:bg-[#1F2327]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#F4F1E8]">
                      {isHygiene ? getComponentAssetLabel(c) : formatAlgorithm(c.algorithm || c.name)}
                    </td>
                    <td className="px-4 py-3 text-[#B8BDBD] capitalize">{isHygiene ? family : (c.asset_type || 'Algorithm')}</td>
                    <td className="px-4 py-3 text-[#8A9094] font-mono">{c.library || '-'}</td>
                    <td className="px-4 py-3 text-[#B8BDBD]">{formatOperation(c.operation || '-')}</td>
                    <td className="px-4 py-3 text-[#8A9094] font-mono">{c.key_size ? `${c.key_size} bits` : '-'}</td>
                    <td className="px-4 py-3 text-[#8A9094] font-mono" title={c.source_file}>
                      {c.source_file ? `${c.source_file.split(/[/\\]/).pop()}:${c.source_line}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getSecurityBadge(currentSec)}`}>
                        {formatCurrentSecurity(currentSec)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${getQuantumBadge(quantum)}`}>
                        {formatQuantumRisk(quantum)}
                      </span>
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
