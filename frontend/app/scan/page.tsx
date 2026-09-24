'use client';

import React, { useState, useCallback } from 'react';
import { useScanContext } from '@/components/scan-provider';
import { Play, Zap, FolderOpen, Upload, Loader2, CheckCircle, AlertCircle, ArrowRight, Shield, FileText, Network } from 'lucide-react';
import Link from 'next/link';

const scanStages = ['Discover', 'Inventory', 'Assess', 'Prioritize', 'Mitigate', 'Migrate'];

function ScanPipeline() {
  return (
    <div className="scan-pipeline" role="status" aria-label="Scanning repository and analyzing cryptography. Workflow stages are illustrative until the scan completes.">
      <div className="scan-pipeline-trace" aria-hidden="true" />
      <div className="relative z-10 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
        {scanStages.map((stage) => <div key={stage} className="scan-pipeline-stage">{stage}</div>)}
      </div>
      <p className="mt-3 text-[11px] text-[#8A9094]">Scanning repository and analyzing cryptography… Workflow stages are illustrative until the scan completes, not simulated backend completion.</p>
    </div>
  );
}

export default function ScanPage() {
  const { state, scanStatus, startDemoScan, startLocalScan, startUploadScan, error, summary } = useScanContext();
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
        <h1 className="text-3xl font-bold text-[#F4F1E8] flex items-center gap-3">
          <Zap className="w-7 h-7 text-[#C8A96B]" />
          Scan Repository
        </h1>
        <p className="text-sm text-[#8A9094] mt-1">
          Choose a scanning target to discover cryptographic algorithms, build a CBOM, and generate post-quantum migration plans.
        </p>
      </div>

      {/* Active Scan Progress */}
      {isScanning && (
        <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#C8A96B] animate-spin" />
              <div>
                <span className="text-sm font-semibold text-[#E2DFD8]">
                  {scanStatus?.stage === 'SCANNING' ? 'Parsing repository files...' :
                   scanStatus?.stage === 'ASSESSING_RISK' ? 'Assessing classical & quantum risk...' :
                   scanStatus?.stage === 'GENERATING_CBOM' ? 'Generating Cryptographic Bill of Materials...' :
                   scanStatus?.stage || 'Scanning in progress...'}
                </span>
                <p className="text-xs text-[#8A9094]">Deterministic AST and static analysis execution</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#E2DFD8]">
                {scanStatus?.files_scanned || 0} {scanStatus?.total_files ? `/ ${scanStatus.total_files}` : ''} files
              </span>
            </div>
          </div>
          <ScanPipeline />
        </div>
      )}

      {/* Scan Completed Banner */}
      {isCompleted && summary && (
        <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7EA992]/15 text-[#7EA992] rounded-lg border border-[#7EA992]/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F4F1E8]">Scan Execution Completed</h3>
              <p className="text-xs text-[#8A9094]">
                Analyzed {summary.files_scanned} files in {summary.scan_duration_seconds.toFixed(2)}s • Discovered {summary.total_findings} cryptographic call sites
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <Link href="/findings" className="p-3 bg-[#0F1113] hover:bg-[#1F2327] rounded-lg border border-[#34393D] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-[#8A9094] font-medium">View Findings</div>
                <div className="text-base font-bold text-[#F4F1E8]">{summary.total_findings} items</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8A9094] group-hover:text-[#C8A96B] transition-colors" />
            </Link>

            <Link href="/cbom" className="p-3 bg-[#0F1113] hover:bg-[#1F2327] rounded-lg border border-[#34393D] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-[#8A9094] font-medium">CBOM Inventory</div>
                <div className="text-base font-bold text-[#78AAA4]">Explore</div>
              </div>
              <FileText className="w-4 h-4 text-[#8A9094] group-hover:text-[#78AAA4] transition-colors" />
            </Link>

            <Link href="/crypto-map" className="p-3 bg-[#0F1113] hover:bg-[#1F2327] rounded-lg border border-[#34393D] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-[#8A9094] font-medium">Crypto Map</div>
                <div className="text-base font-bold text-[#F4F1E8]">Architecture</div>
              </div>
              <Network className="w-4 h-4 text-[#8A9094] group-hover:text-[#C8A96B] transition-colors" />
            </Link>

            <Link href="/migration" className="p-3 bg-[#0F1113] hover:bg-[#1F2327] rounded-lg border border-[#34393D] flex items-center justify-between group transition-colors">
              <div>
                <div className="text-[11px] text-[#8A9094] font-medium">Migration Plan</div>
                <div className="text-base font-bold text-[#C7A15D]">{summary.quantum_migration_concerns} concerns</div>
              </div>
              <Shield className="w-4 h-4 text-[#8A9094] group-hover:text-[#C7A15D] transition-colors" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {isFailed && error && (
        <div className="bg-[#C76B6B]/15 border border-[#C76B6B]/35 rounded-xl p-4 flex items-center gap-3 text-[#C76B6B] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-bold">Scan Error: </span>
            {error}
          </div>
        </div>
      )}

      <div className="grid gap-5">
        {/* Card 1: Bundled Demo Repository */}
        <div className="bg-[#171A1D] border border-[#C8A96B]/35 rounded-xl p-5 shadow-sm transition-all hover:border-[#C8A96B]/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#C8A96B]/15 text-[#C8A96B] rounded-xl shrink-0 border border-[#C8A96B]/30">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8A96B]/10 text-[#C8A96B] text-[10px] font-semibold uppercase tracking-wider border border-[#C8A96B]/25">
                  Live Evaluation Preset
                </div>
                <h2 className="text-lg font-bold text-[#F4F1E8]">Scan Bundled Demo Repository</h2>
                <p className="text-[#8A9094] text-xs max-w-xl leading-relaxed">
                  Executes a static scan across realistic multi-language source files (Python, JavaScript, Java) containing MD5, RSA-1024, RSA-2048, AES-GCM, and DES primitives.
                </p>
              </div>
            </div>
            <button
              onClick={startDemoScan}
              disabled={isScanning}
              className="px-6 py-3 bg-gradient-to-b from-[#C8A96B] to-[#B89658] hover:from-[#D4B679] hover:to-[#C8A96B] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1113] rounded-xl text-sm font-semibold transition-colors border border-[#C8A96B]/50 shrink-0 flex items-center justify-center gap-2 shadow-sm"
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
        <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#1F2327] text-[#B8BDBD] rounded-xl shrink-0 border border-[#34393D]">
              <FolderOpen className="w-5 h-5 text-[#B8BDBD]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-[#F4F1E8]">Local Repository Path</h2>
                <p className="text-[#8A9094] text-xs mt-0.5">
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
                  className="flex-1 bg-[#0F1113] border border-[#34393D] rounded-lg px-3.5 py-2 text-xs text-[#E2DFD8] placeholder:text-[#8A9094] focus:outline-none focus:border-[#C8A96B] transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={isScanning || !localPath.trim()}
                  className="bg-[#1F2327] hover:bg-[#23282D] disabled:opacity-40 disabled:cursor-not-allowed text-[#F4F1E8] border border-[#34393D] px-5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Scan Directory
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Card 3: Upload ZIP */}
        <div className="bg-[#171A1D] border border-[#34393D] rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#1F2327] text-[#B8BDBD] rounded-xl shrink-0 border border-[#34393D]">
              <Upload className="w-5 h-5 text-[#B8BDBD]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-base font-bold text-[#F4F1E8]">Upload ZIP Archive</h2>
                <p className="text-[#8A9094] text-xs mt-0.5">
                  Upload a compressed source archive (.zip, up to 10 MiB) for sandboxed extraction and scan.
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border border-dashed border-[#34393D] hover:border-[#C8A96B]/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#0F1113] relative"
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  disabled={isScanning}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-[#8A9094] mx-auto" />
                  <p className="text-xs font-semibold text-[#E2DFD8]">
                    {selectedFileName ? selectedFileName : 'Drag & drop a .zip file here, or click to browse'}
                  </p>
                  <p className="text-[11px] text-[#8A9094]">ZIP archives up to 10 MiB supported</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
