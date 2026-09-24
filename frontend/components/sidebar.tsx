'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  FileText,
  Network,
  ListChecks,
  ArrowRightLeft,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
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

type Indicator = { top: number; height: number; visible: boolean };

export function Sidebar() {
  const pathname = usePathname();
  const { isScanning, hasScanResult } = useScanContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [indicator, setIndicator] = useState<Indicator>({ top: 0, height: 0, visible: false });
  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const active = activeRef.current;
    if (!nav || !active) return;
    setIndicator({ top: active.offsetTop, height: active.offsetHeight, visible: true });
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const syncMobileState = () => setIsCollapsed(media.matches);
    syncMobileState();
    media.addEventListener('change', syncMobileState);
    return () => media.removeEventListener('change', syncMobileState);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateIndicator);
    const observer = new ResizeObserver(updateIndicator);
    if (navRef.current) observer.observe(navRef.current);
    window.addEventListener('resize', updateIndicator);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [pathname, isCollapsed, updateIndicator]);

  const expandedMobile = !isCollapsed;
  const sidebarWidth = isCollapsed ? 70 : 224;

  return (
    <aside
      className="ecdat-sidebar flex h-full shrink-0 flex-col border-r border-[#3A3D3E] transition-[width] duration-[220ms] ease-out bg-[#1D2023]"
      data-expanded-mobile={expandedMobile}
      style={{ width: sidebarWidth }}
    >
      {/* Brand Lockup */}
      <div className={`flex gap-2 border-b border-[#3A3D3E]/60 ${isCollapsed ? 'flex-col items-center px-2 py-3.5' : 'items-center justify-between px-4 py-3.5'}`}>
        <Link
          href="/"
          className={`group flex min-w-0 items-center rounded-lg focus-visible:outline-none ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          aria-label="ECDAT overview"
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <Image
              src="/brand/ecdat-shield.png"
              alt="ECDAT Shield"
              width={isCollapsed ? 30 : 34}
              height={isCollapsed ? 35 : 40}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <span className="truncate text-[16px] font-bold tracking-tight text-[#F3F0E9] leading-none mb-1">
                ECDAT
              </span>
              <span className="truncate text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[#C5A871] leading-none">
                Crypto Radar
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="ecdat-sidebar-toggle flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#3A3D3E] transition-colors"
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Primary Navigation Rail */}
      <nav ref={navRef} className="ecdat-sidebar-nav relative flex-1 space-y-1 overflow-y-auto px-2 py-3" aria-label="Primary navigation">
        <span
          aria-hidden="true"
          className="ecdat-nav-indicator"
          style={{
            height: indicator.height,
            opacity: indicator.visible ? 1 : 0,
            transform: `translateY(${indicator.top}px)`,
          }}
        />
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              ref={isActive ? activeRef : null}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.name}
              title={isCollapsed ? item.name : undefined}
              data-active={isActive}
              className={`ecdat-nav-item flex min-h-[2.6rem] items-center rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline-none ${
                isActive ? 'text-[#F3F0E9]' : 'text-[#8B9095] hover:text-[#F3F0E9] hover:bg-[#272B2E]/60'
              } ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#C5A871]' : 'text-[#8B9095]'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {isCollapsed && <span className="ecdat-nav-tooltip">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Engine Status */}
      <div className={`border-t border-[#3A3D3E] ${isCollapsed ? 'px-2 pb-6 pt-3' : 'px-3 pb-6 pt-3'}`}>
        <div className="flex items-center justify-center gap-2 rounded-lg border border-[#3A3D3E] bg-[#101214] p-2.5 sm:justify-between">
          {!isCollapsed && <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8B9095]">Engine</div>}
          {isScanning ? (
            <div className="flex items-center gap-2 text-xs font-medium text-[#77AFA9]" title="Scanning">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {!isCollapsed && <span>Scanning</span>}
            </div>
          ) : hasScanResult ? (
            <div className="flex items-center gap-2 text-xs font-medium text-[#64C59B]" title="Completed">
              <span className="h-2 w-2 rounded-full bg-[#64C59B]" />
              {!isCollapsed && <span>Completed</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-[#8B9095]" title="Idle">
              <span className="h-2 w-2 rounded-full bg-[#4F5457]" />
              {!isCollapsed && <span>Idle</span>}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
