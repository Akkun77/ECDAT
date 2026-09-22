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
  ListChecks,
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
  { name: 'Mitigation Hub', href: '/mitigation', icon: ListChecks },
  { name: 'Migration Plan', href: '/migration', icon: ArrowRightLeft },
  { name: 'Reports', href: '/reports', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isScanning, hasScanResult } = useScanContext();

  return (
    <div className="w-64 bg-[#0e1726] border-r border-[#1e2d42] flex flex-col h-full shrink-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-500 group-hover:border-blue-400 transition-colors">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-lg tracking-tight">ECDAT</div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide">Enterprise Crypto Radar</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-sm ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                  : 'text-slate-400 hover:bg-[#152033] hover:text-slate-200 font-medium border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e2d42]">
        <div className="bg-[#070b14] p-3.5 rounded-xl border border-[#1e2d42] flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engine Status</div>
          {isScanning ? (
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning</span>
            </div>
          ) : hasScanResult ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-slate-600"></div>
              <span>Idle</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
