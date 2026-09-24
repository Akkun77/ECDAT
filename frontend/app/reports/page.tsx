'use client';

import React from 'react';
import Link from 'next/link';
import { FileJson, FileText, Table as TableIcon, Download, Folder, CheckCircle, Calendar, Shield } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const { scanStatus, scanId, state, summary } = useScanContext();

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  if (!isCompleted || !scanId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="relative w-48 h-32 mb-8 flex justify-center items-center">
          {/* Document 1 */}
          <div className="absolute top-2 left-6 w-16 h-20 bg-[#171A1D] border border-[#34393D] rounded shadow-lg flex flex-col p-2 gap-1.5 opacity-60 -rotate-6">
            <div className="w-1/2 h-1.5 bg-[#34393D] rounded-full" />
            <div className="w-full h-1 bg-[#34393D] rounded-full" />
            <div className="w-3/4 h-1 bg-[#34393D] rounded-full" />
            <div className="w-full h-1 bg-[#34393D] rounded-full mt-2" />
          </div>
          {/* Document 2 */}
          <div className="absolute top-6 right-8 w-16 h-20 bg-[#171A1D] border border-[#34393D] rounded shadow-lg flex flex-col p-2 gap-1.5 opacity-80 rotate-6">
            <div className="w-1/2 h-1.5 bg-[#34393D] rounded-full" />
            <div className="w-full h-1 bg-[#34393D] rounded-full" />
            <div className="w-3/4 h-1 bg-[#34393D] rounded-full" />
            <div className="w-4/5 h-1 bg-[#34393D] rounded-full mt-2" />
          </div>
          {/* Main Download Icon Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-[#0F1113] border border-[#34393D] rounded-xl shadow-2xl z-10">
            <Download className="w-6 h-6 text-[#C8A96B]" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-[#F4F1E8] mb-2">No Reports Available</h2>
        <p className="text-[#8A9094] text-xs sm:text-sm mb-6 max-w-md">
          Complete a repository scan first to access cryptographic reports, CBOM exports, and migration roadmaps.
        </p>
        <Link
          href="/scan"
          className="bg-gradient-to-b from-[#C8A96B] to-[#B89658] hover:from-[#D4B679] hover:to-[#C8A96B] text-[#0F1113] px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-[#C8A96B]/50"
        >
          Go to Scan Page
        </Link>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="pb-3 border-b border-[#3A3D3E]">
        <h1 className="text-2xl font-bold text-[#F3F0E9] flex items-center gap-2.5">
          <Download className="w-6 h-6 text-[#77AFA9] shrink-0" />
          Reports &amp; Export Center
        </h1>
        <p className="text-[#8B9095] text-xs sm:text-sm mt-1">
          Download findings, Cryptographic Bill of Materials (CBOM), and audit records for compliance and tooling integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Scan Report JSON */}
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-6 flex flex-col justify-between hover:border-[#4F5457] transition-colors shadow-sm">
          <div>
            <div className="p-3 bg-[#C5A871]/15 text-[#C5A871] rounded-lg w-fit mb-4 border border-[#C5A871]/30">
              <FileJson className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F0E9] mb-2">Full Scan Report (JSON)</h2>
            <p className="text-[#8B9095] text-xs mb-6 leading-relaxed">
              Complete raw discovery output including all cryptographic findings, risk classifications, Mosca prioritization, and source line snippets.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-b from-[#C5A871] to-[#B59861] hover:from-[#D4B679] hover:to-[#C5A871] text-[#101214] rounded-lg font-semibold text-xs transition-colors border border-[#C5A871]/50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (JSON)</span>
          </a>
        </div>

        {/* CBOM CSV */}
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-6 flex flex-col justify-between hover:border-[#4F5457] transition-colors shadow-sm">
          <div>
            <div className="p-3 bg-[#64C59B]/15 text-[#64C59B] rounded-lg w-fit mb-4 border border-[#64C59B]/30">
              <TableIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F0E9] mb-2">CBOM Inventory (CSV)</h2>
            <p className="text-[#8B9095] text-xs mb-6 leading-relaxed">
              Tabular Cryptographic Bill of Materials formatted for spreadsheet analysis, compliance audits, and procurement security reviews.
            </p>
          </div>
          <a
            href={api.exportCsv(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#272B2E] hover:bg-[#2B3035] text-[#F3F0E9] rounded-lg font-semibold text-xs transition-colors border border-[#3A3D3E]"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (CSV)</span>
          </a>
        </div>

        {/* CBOM JSON */}
        <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-6 flex flex-col justify-between hover:border-[#4F5457] transition-colors shadow-sm">
          <div>
            <div className="p-3 bg-[#77AFA9]/15 text-[#77AFA9] rounded-lg w-fit mb-4 border border-[#77AFA9]/30">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#F3F0E9] mb-2">CBOM Inventory (JSON)</h2>
            <p className="text-[#8B9095] text-xs mb-6 leading-relaxed">
              Machine-readable CycloneDX v1.6 schema ready for CI/CD gating, SIEM ingestion, or automated inventory tracking.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#272B2E] hover:bg-[#2B3035] text-[#F3F0E9] rounded-lg font-semibold text-xs transition-colors border border-[#3A3D3E]"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (JSON)</span>
          </a>
        </div>
      </div>

      {/* Scan Details */}
      <div className="bg-[#1D2023] border border-[#3A3D3E] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#F3F0E9] border-b border-[#3A3D3E] pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C5A871]" />
          Audit &amp; Scan Metadata
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Folder className="w-4 h-4 text-[#8B9095] mt-0.5" />
            <div>
              <p className="text-[11px] text-[#8B9095] uppercase font-semibold">Project Name</p>
              <p className="text-[#E2DFD8] mt-0.5 text-xs font-semibold">{scanStatus?.project_name || 'ECDAT Demo'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#8B9095] mt-0.5" />
            <div>
              <p className="text-[11px] text-[#8B9095] uppercase font-semibold">Scan ID</p>
              <p className="text-[#E2DFD8] mt-0.5 text-xs font-mono break-all">{scanId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-[#64C59B] mt-0.5" />
            <div>
              <p className="text-[11px] text-[#8B9095] uppercase font-semibold">Status</p>
              <p className="text-[#64C59B] mt-0.5 text-xs font-semibold">COMPLETED</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#8B9095] mt-0.5" />
            <div>
              <p className="text-[11px] text-[#8B9095] uppercase font-semibold">Completed At</p>
              <p className="text-[#E2DFD8] mt-0.5 text-xs">{formatDate(scanStatus?.completed_at)}</p>
            </div>
          </div>
        </div>

        {summary && (
          <div className="mt-4 pt-4 border-t border-[#3A3D3E] flex flex-wrap gap-6 text-xs text-[#8B9095]">
            <div>
              Files Scanned: <span className="font-semibold text-[#F3F0E9]">{summary.files_scanned}</span>
            </div>
            <div>
              Scan Duration: <span className="font-semibold text-[#F3F0E9]">{summary.scan_duration_seconds.toFixed(2)}s</span>
            </div>
            <div>
              Languages: <span className="font-semibold text-[#F3F0E9]">{summary.languages_detected.join(', ') || 'None'}</span>
            </div>
            <div>
              Total Findings: <span className="font-semibold text-[#F3F0E9]">{summary.total_findings}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
