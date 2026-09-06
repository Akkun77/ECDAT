'use client';
import React, { createContext, useContext } from 'react';
import { useScan } from '@/hooks/use-scan';

type ScanContextType = ReturnType<typeof useScan>;

const ScanContext = createContext<ScanContextType | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const scan = useScan();
  return <ScanContext.Provider value={scan}>{children}</ScanContext.Provider>;
}

export function useScanContext() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScanContext must be used within ScanProvider');
  return ctx;
}
