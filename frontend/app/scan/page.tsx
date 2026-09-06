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
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-400" />
          Scan Repository
        </h1>
        <p className="text-slate-400 mt-2">
          Choose a scanning method to discover cryptographic usage, assess quantum readiness, and generate a CBOM.
        </p>
      </div>

      {/* Active Scan Progress */}
      {isScanning && (
        <div className="bg-slate-800/60 border border-blue-500/40 rounded-xl p-6 shadow-xl space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <div>
                <span className="text-sm font-semibold text-slate-200">
                  {scanStatus?.stage === 'SCANNING' ? 'Parsing repository files...' :
                   scanStatus?.stage === 'ASSESSING_RISK' ? 'Assessing classical & quantum risk...' :
                   scanStatus?.stage === 'GENERATING_CBOM' ? 'Generating Cryptographic Bill of Materials...' :
                   scanStatus?.stage || 'Scanning in progress...'}
                </span>
                <p className="text-xs text-slate-400">Deterministic AST and regex static analysis in progress</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono text-slate-300">
                {scanStatus?.files_scanned || 0} {scanStatus?.total_files ? `/ ${scanStatus.total_files}` : ''} files
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
              style={{ width: `${progress ? Math.min(progress * 100, 100) : 45}%` }}
            />
          </div>
        </div>
      )}

      {/* Scan Completed Banner */}
      {isCompleted && summary && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-500/30 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Scan Complete</h3>
                <p className="text-xs text-slate-400">
                  Analyzed {summary.files_scanned} files in {summary.scan_duration_seconds.toFixed(2)}s • Discovered {summary.total_findings} cryptographic call sites
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <Link href="/findings" className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 flex items-center justify-between group transition-colors">
              <div>
                <div className="text-xs text-slate-400">View Findings</div>
                <div className="text-lg font-bold text-slate-100">{summary.total_findings} items</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/cbom" className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 flex items-center justify-between group transition-colors">
              <div>
                <div className="text-xs text-slate-400">CBOM Inventory</div>
                <div className="text-lg font-bold text-blue-400">Explore</div>
              </div>
              <FileText className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/crypto-map" className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 flex items-center justify-between group transition-colors">
              <div>
                <div className="text-xs text-slate-400">Crypto Map</div>
                <div className="text-lg font-bold text-slate-100">Architecture</div>
              </div>
              <Network className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/migration" className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 flex items-center justify-between group transition-colors">
              <div>
                <div className="text-xs text-slate-400">Migration Plan</div>
                <div className="text-lg font-bold text-amber-400">{summary.quantum_migration_concerns} concerns</div>
              </div>
              <Shield className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {isFailed && error && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold">Scan Error: </span>
            {error}
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Card 1: Demo Repository (Prominently Featured) */}
        <div className="bg-gradient-to-br from-blue-950/30 via-slate-800/50 to-slate-900/50 border border-blue-500/40 rounded-xl p-6 shadow-xl transition-all duration-200 hover:border-blue-400/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 border border-blue-500/20">
                <Zap className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-semibold uppercase tracking-wider">
                  Recommended for Live Hackathon Demo
                </div>
                <h2 className="text-xl font-bold text-slate-100">Scan Bundled Demo Repository</h2>
                <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                  Triggers an actual static scan of the multi-language test repository containing realistic, harmless cryptographic implementations in Python, JavaScript, and Java (MD5, RSA-1024, RSA-2048, AES-GCM, DES, etc.).
                </p>
              </div>
            </div>
            <button
              onClick={startDemoScan}
              disabled={isScanning}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl text-base font-bold transition-all duration-200 shadow-lg shadow-blue-500/25 shrink-0 flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Scan Demo Repository</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Local Path */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 transition-all duration-200 hover:border-slate-600 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-700/40 text-slate-300 rounded-xl shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Local Repository Path</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Specify the absolute path of a local project directory on this system to inspect.
                </p>
              </div>
              <form onSubmit={handleLocalScan} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="e.g. C:\Projects\MyApplication or /home/user/project"
                  disabled={isScanning}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isScanning || !localPath.trim()}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
                >
                  Scan Directory
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Card 3: Upload ZIP */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 transition-all duration-200 hover:border-slate-600 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-700/40 text-slate-300 rounded-xl shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Upload ZIP Archive</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Upload a zipped source code repository (maximum 10 MiB) for sandboxed extraction and analysis.
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 relative"
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  disabled={isScanning}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">
                    {selectedFileName ? selectedFileName : 'Drag & drop a .zip file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500">ZIP archives up to 10 MiB supported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
