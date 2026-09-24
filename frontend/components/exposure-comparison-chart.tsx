'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartColumnIncreasing, GitCompareArrows, RotateCcw } from 'lucide-react';
import type { ExposureComparisonRow } from '@/lib/cbom';

type ChartMode = 'bars' | 'dumbbell';
type ChartPoint = ExposureComparisonRow & {
  value: number;
  row: number;
  series: 'Current security concern' | 'Quantum exposure concern';
};
type TooltipPayload = { payload?: ExposureComparisonRow | ChartPoint };

const CURRENT = '#D86E70';
const QUANTUM = '#C8A96B';
const GRID = '#35373B';
const TEXT = '#B1B3B6';

function splitLabel(label: string) {
  if (label.length <= 16) return [label];
  const words = label.split(' ');
  const first: string[] = [];
  const second: string[] = [];
  let length = 0;
  for (const word of words) {
    if (length + word.length + (first.length ? 1 : 0) <= 16) {
      first.push(word);
      length += word.length + (first.length > 1 ? 1 : 0);
    } else second.push(word);
  }
  return [first.join(' '), second.join(' ')].filter(Boolean);
}

function CategoryTick({ x = 0, y = 0, payload }: { x?: number | string; y?: number | string; payload?: { value?: string | number } }) {
  const lines = splitLabel(String(payload?.value ?? ''));
  return (
    <text x={x} y={y} fill={TEXT} textAnchor="end" fontSize={11}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? `${-(lines.length - 1) * 0.55}em` : '1.1em'}>{line}</tspan>
      ))}
    </text>
  );
}

function DumbbellCategoryTick({ x, y, payload, rows }: { x?: number | string; y?: number | string; payload?: { value?: string | number }; rows: ExposureComparisonRow[] }) {
  return <CategoryTick x={x} y={y} payload={{ value: rows[Number(payload?.value)]?.label ?? '' }} />;
}

function ComparisonTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-[#3b3c3e] bg-[#111418]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-[#F2F0EB]">{data.label}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[#A5A8AE]">
        {data.kind === 'algorithm' ? 'Cryptographic algorithm' : 'Security-hygiene finding'}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="flex items-center justify-between gap-5 text-[#E79A97]"><span>Current concern</span><strong>{data.currentConcernCount}</strong></p>
        <p className="flex items-center justify-between gap-5 text-[#E7D6A3]"><span>Quantum exposure</span><strong>{data.quantumConcernCount}</strong></p>
        <p className="flex items-center justify-between gap-5 text-[#B1B3B6]"><span>CBOM records</span><strong>{data.total}</strong></p>
      </div>
    </div>
  );
}

function DumbbellPoint({ cx, cy, payload, selected }: { cx?: number; cy?: number; payload?: ChartPoint; selected: boolean }) {
  if (cx === undefined || cy === undefined || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={selected ? 5.5 : 4.5}
      fill={payload.series === 'Current security concern' ? CURRENT : QUANTUM}
      fillOpacity={selected ? 1 : 0.86}
      stroke="#111418"
      strokeWidth={1.5}
    />
  );
}

export function ExposureComparisonChart({
  rows,
  selection,
  onSelectionChange,
}: {
  rows: ExposureComparisonRow[];
  selection: string | null;
  onSelectionChange: (label: string | null) => void;
}) {
  const [mode, setMode] = useState<ChartMode>('bars');
  const maxValue = useMemo(() => Math.max(1, ...rows.flatMap((row) => [row.currentConcernCount, row.quantumConcernCount])), [rows]);
  const chartHeight = Math.max(312, rows.length * 44 + 54);
  const selectRow = (label: string | undefined) => {
    if (label) onSelectionChange(selection === label ? null : label);
  };
  const selectChartDatum = (datum: unknown) => {
    const candidate = datum as { label?: string; payload?: { label?: string } } | undefined;
    selectRow(candidate?.payload?.label ?? candidate?.label);
  };

  if (!rows.length) {
    return (
      <section className="rounded-xl border border-[#35373B] bg-[#171A1E] p-6" aria-labelledby="exposure-comparison-title">
        <h2 id="exposure-comparison-title" className="text-lg font-semibold text-[#F2F0EB]">Current vs Quantum Exposure by Algorithm Family</h2>
        <p className="mt-2 text-sm text-[#B1B3B6]">Run a scan to plot exposure comparisons from CBOM records.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#35373B] bg-[#171A1E] p-4 sm:p-5" aria-labelledby="exposure-comparison-title">
      <div className="flex flex-col gap-3 border-b border-[#35373B] pb-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ChartColumnIncreasing className="h-4 w-4 text-[#C8A96B]" aria-hidden="true" />
            <h2 id="exposure-comparison-title" className="text-lg font-semibold text-[#F2F0EB]">Current vs Quantum Exposure by Algorithm Family</h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#B1B3B6]">Counts are derived from the current CBOM. Security-hygiene findings remain separate from cryptographic algorithms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-[#35373B] bg-[#111418] p-0.5" role="group" aria-label="Exposure comparison chart type">
            <button type="button" onClick={() => setMode('bars')} aria-pressed={mode === 'bars'} className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === 'bars' ? 'bg-[#2a2d31] text-[#F2F0EB]' : 'text-[#B1B3B6] hover:text-[#F2F0EB]'}`}>Grouped bars</button>
            <button type="button" onClick={() => setMode('dumbbell')} aria-pressed={mode === 'dumbbell'} className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${mode === 'dumbbell' ? 'bg-[#2a2d31] text-[#F2F0EB]' : 'text-[#B1B3B6] hover:text-[#F2F0EB]'}`}><GitCompareArrows className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Dumbbell</button>
          </div>
          <label className="sr-only" htmlFor="exposure-category-filter">Filter inventory by family or finding type</label>
          <select id="exposure-category-filter" value={selection ?? ''} onChange={(event) => onSelectionChange(event.target.value || null)} className="h-8 max-w-[190px] rounded-md border border-[#35373B] bg-[#111418] px-2 text-xs text-[#F2F0EB] outline-none focus:border-[#C8A96B]">
            <option value="">All inventory categories</option>
            {rows.map((row) => <option key={row.label} value={row.label}>{row.label}</option>)}
          </select>
          {selection && <button type="button" onClick={() => onSelectionChange(null)} className="inline-flex h-8 items-center gap-1 rounded-md border border-[#35373B] px-2 text-xs text-[#B1B3B6] transition-colors hover:border-[#C8A96B] hover:text-[#F2F0EB]"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset</button>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#B1B3B6]" aria-label="Exposure comparison legend">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: CURRENT }} />Current security concern</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: QUANTUM }} />Quantum exposure concern</span>
        <span className="text-[#7F858D]">Click a plotted category or use the selector to filter the inventory.</span>
      </div>

      <div className="mt-3 min-w-0" role="img" aria-label={`${mode === 'bars' ? 'Grouped bar' : 'Dumbbell'} chart comparing current and quantum exposure by CBOM category`}>
        {mode === 'bars' ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 38, bottom: 20, left: 8 }} onClick={selectChartDatum} barCategoryGap="28%">
              <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
              <XAxis type="number" domain={[0, maxValue]} allowDecimals={false} tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={{ stroke: GRID }} label={{ value: 'Qualifying CBOM records', position: 'insideBottom', offset: -8, fill: TEXT, fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={132} tick={<CategoryTick />} axisLine={false} tickLine={false} />
              <Tooltip content={<ComparisonTooltip />} cursor={{ fill: '#24282D', opacity: 0.45 }} />
              <Legend verticalAlign="top" height={26} wrapperStyle={{ color: TEXT, fontSize: 12 }} />
              <Bar dataKey="currentConcernCount" name="Current security concern" fill={CURRENT} radius={[0, 3, 3, 0]} onClick={selectChartDatum}>
                {rows.map((row) => <Cell key={`current-${row.label}`} fillOpacity={selection && selection !== row.label ? 0.3 : 0.92} />)}
                <LabelList dataKey="currentConcernCount" position="right" fill="#E79A97" fontSize={10} />
              </Bar>
              <Bar dataKey="quantumConcernCount" name="Quantum exposure concern" fill={QUANTUM} radius={[0, 3, 3, 0]} onClick={selectChartDatum}>
                {rows.map((row) => <Cell key={`quantum-${row.label}`} fillOpacity={selection && selection !== row.label ? 0.3 : 0.92} />)}
                <LabelList dataKey="quantumConcernCount" position="right" fill="#E7D6A3" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart margin={{ top: 18, right: 34, bottom: 20, left: 8 }} onClick={selectChartDatum}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
              <XAxis type="number" dataKey="value" domain={[0, maxValue]} allowDecimals={false} tick={{ fill: TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={{ stroke: GRID }} label={{ value: 'Qualifying CBOM records', position: 'insideBottom', offset: -8, fill: TEXT, fontSize: 11 }} />
              <YAxis type="number" dataKey="row" domain={[-0.5, Math.max(0.5, rows.length - 0.5)]} ticks={rows.map((_, index) => index)} reversed width={132} tick={(props) => <DumbbellCategoryTick {...props} rows={rows} />} axisLine={false} tickLine={false} />
              <Tooltip content={<ComparisonTooltip />} cursor={{ stroke: '#50545A', strokeDasharray: '3 4' }} />
              {rows.map((row, index) => {
                const selected = !selection || selection === row.label;
                const points: ChartPoint[] = [
                  { ...row, value: row.currentConcernCount, row: index, series: 'Current security concern' },
                  { ...row, value: row.quantumConcernCount, row: index, series: 'Quantum exposure concern' },
                ];
                return <Scatter key={row.label} data={points} line={{ stroke: '#72767B', strokeWidth: 1.5, strokeOpacity: selected ? 0.72 : 0.2 }} lineType="joint" shape={(props) => <DumbbellPoint {...props} selected={selected} />} fill="#B1B3B6" onClick={selectChartDatum} />;
              })}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-2 text-xs text-[#7F858D]">A zero is an explicit count of no qualifying CBOM records under that concern definition; it is not a missing or not-applicable value.</p>
    </section>
  );
}
