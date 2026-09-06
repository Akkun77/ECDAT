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
        <Download className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">No Reports Available</h2>
        <p className="text-slate-400 mb-6 max-w-md">
          Complete a repository scan first to access cryptographic reports, CBOM exports, and migration roadmaps.
        </p>
        <Link href="/scan" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
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
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Download className="w-8 h-8 text-blue-400" />
          Reports &amp; Export
        </h1>
        <p className="text-slate-400 mt-2">
          Download findings, Cryptographic Bill of Materials (CBOM), and audit records for compliance and tooling integration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Full Scan Report JSON */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg">
          <div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg w-fit mb-4 border border-blue-500/20">
              <FileJson className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Full Scan Report (JSON)</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Complete raw discovery output including all cryptographic findings, risk classifications, Mosca prioritization, and source line snippets.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (JSON)</span>
          </a>
        </div>

        {/* CBOM CSV */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg">
          <div>
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg w-fit mb-4 border border-green-500/20">
              <TableIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">CBOM Inventory (CSV)</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Tabular Cryptographic Bill of Materials formatted for spreadsheet analysis, compliance audits, and procurement security reviews.
            </p>
          </div>
          <a
            href={api.exportCsv(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-semibold text-sm transition-colors border border-slate-600/50"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (CSV)</span>
          </a>
        </div>

        {/* CBOM JSON */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg">
          <div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg w-fit mb-4 border border-purple-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">CBOM Inventory (JSON)</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Machine-readable CryptoBOM schema ready for CI/CD gating, SIEM ingestion, or automated inventory tracking.
            </p>
          </div>
          <a
            href={api.exportJson(scanId)}
            download
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg font-semibold text-sm transition-colors border border-slate-600/50"
          >
            <Download className="w-4 h-4" />
            <span>Download CBOM (JSON)</span>
          </a>
        </div>
      </div>

      {/* Scan Details */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700/60 pb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Audit &amp; Scan Metadata
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Folder className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Project Name</p>
              <p className="text-slate-200 mt-1 text-sm font-semibold">{scanStatus?.project_name || 'ECDAT Demo'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Scan ID</p>
              <p className="text-slate-200 mt-1 text-xs font-mono break-all">{scanId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Status</p>
              <p className="text-slate-200 mt-1 text-sm font-medium capitalize">{scanStatus?.status || 'Completed'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Scan Duration</p>
              <p className="text-slate-200 mt-1 text-sm font-semibold">
                {scanStatus?.duration_seconds ? `${scanStatus.duration_seconds.toFixed(2)}s` : summary?.scan_duration_seconds ? `${summary.scan_duration_seconds.toFixed(2)}s` : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Files Analyzed</p>
              <p className="text-slate-200 mt-1 text-sm">{scanStatus?.files_scanned ?? summary?.files_scanned ?? 0} files</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Languages Detected</p>
              <p className="text-slate-200 mt-1 text-sm capitalize">
                {summary?.languages_detected?.join(', ') || 'Python, JavaScript, Java'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Created At</p>
              <p className="text-slate-200 mt-1 text-xs">{formatDate(scanStatus?.created_at)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Completed At</p>
              <p className="text-slate-200 mt-1 text-xs">{formatDate(scanStatus?.completed_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
