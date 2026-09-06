'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  AlertTriangle, 
  FileText, 
  Network, 
  ArrowRightLeft, 
  Download,
  Loader2
} from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Scan', href: '/scan', icon: Search },
  { name: 'Findings', href: '/findings', icon: AlertTriangle },
  { name: 'CBOM', href: '/cbom', icon: FileText },
  { name: 'Crypto Map', href: '/crypto-map', icon: Network },
  { name: 'Migration Plan', href: '/migration', icon: ArrowRightLeft },
  { name: 'Reports', href: '/reports', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isScanning, hasScanResult } = useScanContext();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <div className="font-bold text-slate-100 text-lg tracking-tight">ECDAT</div>
            <div className="text-xs text-slate-400">Enterprise Dashboard</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">Status</div>
          {isScanning ? (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning</span>
            </div>
          ) : hasScanResult ? (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span>Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span>Idle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
