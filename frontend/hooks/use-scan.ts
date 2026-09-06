'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ScanResponse, SummaryResponse, FindingResponse, MigrationResponse, GraphResponse, CBOMResponse } from '@/types/api';

export type ScanState = 'idle' | 'scanning' | 'completed' | 'failed';

export function useScan() {
  const [state, setState] = useState<ScanState>('idle');
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [findings, setFindings] = useState<FindingResponse[]>([]);
  const [migration, setMigration] = useState<MigrationResponse | null>(null);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [cbom, setCbom] = useState<CBOMResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadResults = useCallback(async (id: string) => {
    try {
      const [sum, fin, mig, gr, cb, status] = await Promise.all([
        api.getSummary(id),
        api.getFindings(id),
        api.getMigration(id),
        api.getGraph(id),
        api.getCbom(id),
        api.getScanStatus(id).catch(() => null),
      ]);
      setSummary(sum);
      setFindings(fin.findings);
      setMigration(mig);
      setGraph(gr);
      setCbom(cb);
      if (status) setScanStatus(status);
      setState('completed');
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('ecdat_last_scan_id', id); } catch {}
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load results');
      setState('failed');
    }
  }, []);

  // Auto-rehydrate last scan on initial mount/refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('ecdat_last_scan_id');
      if (saved && state === 'idle' && !scanId) {
        setScanId(saved);
        loadResults(saved);
      }
    } catch {}
  }, [state, scanId, loadResults]);

  const pollStatus = useCallback((id: string) => {
    const poll = async () => {
      try {
        const status = await api.getScanStatus(id);
        setScanStatus(status);
        if (status.status === 'COMPLETED') {
          if (pollRef.current) clearInterval(pollRef.current);
          await loadResults(id);
        } else if (status.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(status.error || 'Scan failed');
          setState('failed');
        }
      } catch (e) {
        // Ignore transient errors during polling
      }
    };
    poll();
    pollRef.current = setInterval(poll, 500);
  }, [loadResults]);

  const startDemoScan = useCallback(async () => {
    setState('scanning');
    setError(null);
    setSummary(null);
    setFindings([]);
    setMigration(null);
    setGraph(null);
    setCbom(null);
    try {
      const result = await api.scanDemo();
      setScanId(result.scan_id);
      pollStatus(result.scan_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start scan');
      setState('failed');
    }
  }, [pollStatus]);

  const startLocalScan = useCallback(async (path: string, name?: string) => {
    setState('scanning');
    setError(null);
    try {
      const result = await api.scanLocal(path, name);
      setScanId(result.scan_id);
      pollStatus(result.scan_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start scan');
      setState('failed');
    }
  }, [pollStatus]);

  const startUploadScan = useCallback(async (file: File) => {
    setState('scanning');
    setError(null);
    try {
      const result = await api.scanUpload(file);
      setScanId(result.scan_id);
      pollStatus(result.scan_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload');
      setState('failed');
    }
  }, [pollStatus]);

  const isScanning = state === 'scanning';
  const hasScanResult = state === 'completed' && summary !== null;
  const isCompleted = state === 'completed';

  return {
    state,
    status: state,
    isScanning,
    hasScanResult,
    isCompleted,
    progress: scanStatus?.progress ?? null,
    scanId,
    scanStatus,
    summary,
    findings,
    migration,
    graph,
    cbom,
    error,
    startDemoScan,
    startLocalScan,
    startUploadScan,
  };
}
