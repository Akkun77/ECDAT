'use client';

import React, { useState, useCallback } from 'react';
import { useScanContext } from '@/components/scan-provider';
import { Play, Zap, FolderOpen, Upload, Loader2, CheckCircle, AlertCircle, ArrowRight, Shield, FileText, Network } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const { state, scanStatus, progress, startDemoScan, startLocalScan, startUploadScan, error, summary, findings } = useScanContext();
  const [localPath, setLocalPath] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const isScanning = state === 'scanning';
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';

  const handleLocalScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (localPath.trim()) {
      startLocalScan(localPath.trim());
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFileName(file.name);
        startUploadScan(file);
      }
    }
  }, [startUploadScan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      startUploadScan(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Zap className="w-7 h-7 text-blue-400" />
          Scan Repository
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Choose a scanning target to discover cryptographic algorithms, build a CBOM, and generate post-quantum migration plans.
        </p>
      </div>

      {/* Active Scan Progress */}
      {isScanning && (
        <div className="bg-[#0e1726] border border-blue-500/40 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <div>
                <span className="text-sm font-semibold text-slate-200">
                  {scanStatus?.stage === 'SCANNING' ? 'Parsing repository files...' :
                   scanStatus?.stage === 'ASSESSING_RISK' ? 'Assessing classical & quantum risk...' :
                   scanStatus?.stage === 'GENERATING_CBOM' ? 'Generating Cryptographic Bill of Materials...' :
                   scanStatus?.stage || 'Scanning in progress...'}
                </span>
                <p className="text-xs text-slate-400">Deterministic AST and static analysis execution</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-300">
                {scanStatus?.files_scanned || 0} {scanStatus?.total_files ? `/ ${scanStatus.total_files}` : ''} files
              </span>
            </div>
          </div>
          <div className="w-full bg-[#070b14] rounded-full h-2 overflow-hidden border border-[#1e2d42]">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress ? Math.min(progress * 100, 100) : 45}%` }}
            />
          </div>
        </div>
      )}

      {/* Scan Completed Banner */}
      {isCompleted && summary && (
        <div className="bg-[#0e1726] border border-blue-500/30 rounded-xl p-5 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Scan Execution Completed</h3>
              <p className="text-xs text-slate-400">
                Analyzed {summary.files_scanned} files in {summary.scan_duration_seconds.toFixed(2)}s • Discovered {summary.total_findings} cryptographic call sites
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <Link href="/findings" className="p-3 bg-[#070b14] hover:bg-[#152033] rounded-lg border border-[#1e2d42] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">View Findings</div>
                <div className="text-base font-bold text-slate-100">{summary.total_findings} items</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/cbom" className="p-3 bg-[#070b14] hover:bg-[#152033] rounded-lg border border-[#1e2d42] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">CBOM Inventory</div>
                <div className="text-base font-bold text-teal-400">Explore</div>
              </div>
              <FileText className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </Link>

            <Link href="/crypto-map" className="p-3 bg-[#070b14] hover:bg-[#152033] rounded-lg border border-[#1e2d42] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Crypto Map</div>
                <div className="text-base font-bold text-slate-100">Architecture</div>
              </div>
              <Network className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/migration" className="p-3 bg-[#070b14] hover:bg-[#152033] rounded-lg border border-[#1e2d42] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Migration Plan</div>
                <div className="text-base font-bold text-amber-400">{summary.quantum_migration_concerns} concerns</div>
              </div>
              <Shield className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {isFailed && error && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-bold">Scan Error: </span>
            {error}
          </div>
        </div>
      )}

      <div className="grid gap-5">
        {/* Card 1: Bundled Demo Repository */}
        <div className="bg-[#0e1726] border border-blue-500/40 rounded-xl p-5 shadow-sm transition-all hover:border-blue-400/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl shrink-0 border border-blue-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wider border border-blue-500/20">
                  Live Evaluation Preset
                </div>
                <h2 className="text-lg font-bold text-slate-100">Scan Bundled Demo Repository</h2>
                <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
                  Executes a static scan across realistic multi-language source files (Python, JavaScript, Java) containing MD5, RSA-1024, RSA-2048, AES-GCM, and DES primitives.
                </p>
              </div>
            </div>
            <button
              onClick={startDemoScan}
              disabled={isScanning}
              className="px-6 py-3 bg-[#2563eb] hover:bg-blue-600 disabled:bg-blue-900 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors border border-blue-400/30 shrink-0 flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Scan Demo Repository</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Local Directory Path */}
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#152033] text-slate-300 rounded-xl shrink-0 border border-[#1e2d42]">
              <FolderOpen className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">Local Repository Path</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Specify an absolute directory path on the local file system.
                </p>
              </div>
              <form onSubmit={handleLocalScan} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="e.g. C:\Projects\MyApplication or /home/user/project"
                  disabled={isScanning}
                  className="flex-1 bg-[#070b14] border border-[#1e2d42] rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={isScanning || !localPath.trim()}
                  className="bg-[#152033] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 border border-[#1e2d42] px-5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Scan Directory
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Card 3: Upload ZIP */}
        <div className="bg-[#0e1726] border border-[#1e2d42] rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#152033] text-slate-300 rounded-xl shrink-0 border border-[#1e2d42]">
              <Upload className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">Upload ZIP Archive</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Upload a compressed source archive (.zip, up to 10 MiB) for sandboxed extraction and scan.
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border border-dashed border-[#1e2d42] hover:border-blue-500/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#070b14] relative"
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  disabled={isScanning}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    {selectedFileName ? selectedFileName : 'Drag & drop a .zip file here, or click to browse'}
                  </p>
                  <p className="text-[11px] text-slate-500">ZIP archives up to 10 MiB supported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
