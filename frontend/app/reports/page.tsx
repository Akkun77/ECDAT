'use client';

import React from 'react';
import Link from 'next/link';
import { FileJson, FileText, Table as TableIcon, Download, Clock, Folder, CheckCircle, Calendar, Shield } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const { scanStatus, scanId, state, summary } = useScanContext();

  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';

  if (!isCompleted || !scanId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Download className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 mb-2">No Reports Available</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md">
          Complete a repository scan first to access cryptographic reports, CBOM exports, and migration roadmaps.
        </p>
        <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-blue-400/30">
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
      <div className="pb-2 border-b border-[#1e2d42]">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Download className="w-6 h-6 text-blue-400 shrink-0" />
          Reports &amp; Export
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Download findings, Cryptographic Bill of Materials (CBOM), and audit records for compliance and tooling integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Scan Report JSON */}
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit mb-4 border border-blue-500/20">
              <FileJson className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-2">Full Scan Report (JSON)</h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Complete raw discovery output including all cryptographic findings, risk classifications, Mosca prioritization, and source line snippets.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors border border-blue-400/30"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (JSON)</span>
          </a>
        </div>

        {/* CBOM CSV */}
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit mb-4 border border-emerald-500/20">
              <TableIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-2">CBOM Inventory (CSV)</h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Tabular Cryptographic Bill of Materials formatted for spreadsheet analysis, compliance audits, and procurement security reviews.
            </p>
          </div>
          <a
            href={api.exportCsv(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#152033] hover:bg-[#1e2d42] text-slate-100 rounded-lg font-semibold text-xs transition-colors border border-[#1e2d42]"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (CSV)</span>
          </a>
        </div>

        {/* CBOM JSON */}
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg w-fit mb-4 border border-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-2">CBOM Inventory (JSON)</h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Machine-readable CryptoBOM schema ready for CI/CD gating, SIEM ingestion, or automated inventory tracking.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#152033] hover:bg-[#1e2d42] text-slate-100 rounded-lg font-semibold text-xs transition-colors border border-[#1e2d42]"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (JSON)</span>
          </a>
        </div>
      </div>

      {/* Scan Details */}
      <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 border-b border-[#1e2d42] pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Audit &amp; Scan Metadata
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Folder className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Project Name</p>
              <p className="text-slate-200 mt-0.5 text-xs font-semibold">{scanStatus?.project_name || 'ECDAT Demo'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Scan ID</p>
              <p className="text-slate-200 mt-0.5 text-xs font-mono break-all">{scanId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Status</p>
              <p className="text-slate-200 mt-0.5 text-xs font-medium capitalize">{scanStatus?.status || 'Completed'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Scan Duration</p>
              <p className="text-slate-200 mt-0.5 text-xs font-semibold">
                {scanStatus?.duration_seconds ? `${scanStatus.duration_seconds.toFixed(2)}s` : summary?.scan_duration_seconds ? `${summary.scan_duration_seconds.toFixed(2)}s` : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Files Analyzed</p>
              <p className="text-slate-200 mt-0.5 text-xs">{scanStatus?.files_scanned ?? summary?.files_scanned ?? 0} files</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Languages Detected</p>
              <p className="text-slate-200 mt-0.5 text-xs capitalize">
                {summary?.languages_detected?.join(', ') || 'Python, JavaScript, Java'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Created At</p>
              <p className="text-slate-200 mt-0.5 text-xs">{formatDate(scanStatus?.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Completed At</p>
              <p className="text-slate-200 mt-0.5 text-xs">{formatDate(scanStatus?.completed_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
