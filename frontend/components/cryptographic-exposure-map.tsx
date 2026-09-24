'use client';

import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  ExposureColumn,
  ExposureLink,
  ExposureMap,
  ExposureMode,
  ExposureNode,
  ExposureSelection,
} from '@/lib/cbom';

type TooltipTarget =
  | { kind: 'node'; item: ExposureNode }
  | { kind: 'link'; item: ExposureLink }
  | null;

type LayoutNode = ExposureNode & { x: number; y: number; height: number; width: number };
type LayoutLink = ExposureLink & { source: LayoutNode; target: LayoutNode; sourceY: number; targetY: number; width: number };

const COLUMNS: ExposureColumn[] = ['language', 'family', 'classification'];
const COLUMN_LABELS: Record<ExposureColumn, string> = {
  language: 'Source language',
  family: 'Cryptographic asset family',
  classification: 'Security classification',
};

const classificationColor = (value: string, mode: ExposureMode) => {
  const normalized = value.toLowerCase();
  if (mode === 'current') {
    if (normalized === 'broken') return '#D86E70';
    if (normalized === 'deprecated') return '#D8A34C';
    if (normalized === 'review required') return '#D8A34C';
    if (normalized === 'acceptable' || normalized === 'strong') return '#61A3A3';
    return '#7F8896';
  }
  if (normalized === 'vulnerable') return '#668FD5';
  if (normalized === 'migration concern') return '#8AA7DE';
  if (normalized === 'review required') return '#8AA7DE';
  if (normalized === 'low concern') return '#61A3A3';
  return '#7F8896';
};

const nodeColor = (node: ExposureNode, mode: ExposureMode) => {
  if (node.column === 'classification') return classificationColor(node.value, mode);
  if (node.column === 'family') return '#BDA16F';
  return '#61A3A3';
};

const selectionEquals = (a: ExposureSelection | null, b: ExposureSelection) =>
  JSON.stringify(a) === JSON.stringify(b);

function componentIndexesForSelection(map: ExposureMap, selection: ExposureSelection | null) {
  if (!selection) return null;
  if (selection.type === 'node') {
    return new Set(map.nodes.find((node) => node.column === selection.column && node.value === selection.value)?.componentIndexes || []);
  }
  return new Set(map.links.find((link) =>
    link.sourceColumn === selection.sourceColumn
      && link.sourceValue === selection.sourceValue
      && link.targetColumn === selection.targetColumn
      && link.targetValue === selection.targetValue,
  )?.componentIndexes || []);
}

function selectionLabel(selection: ExposureSelection | null) {
  if (!selection) return null;
  if (selection.type === 'node') return selection.value;
  return `${selection.sourceValue} → ${selection.targetValue}`;
}

function getLayout(map: ExposureMap) {
  const width = 1200;
  const height = 510;
  const top = 52;
  const bottom = 26;
  const nodeWidth = 16;
  const gaps = 14;
  const xByColumn: Record<ExposureColumn, number> = { language: 176, family: 590, classification: 1008 };
  const columns = COLUMNS.map((column) => map.nodes.filter((node) => node.column === column));
  const availableHeight = height - top - bottom;
  const scale = Math.max(2.75, Math.min(...columns.map((nodes) => {
    const gapsHeight = Math.max(nodes.length - 1, 0) * gaps;
    return (availableHeight - gapsHeight) / Math.max(map.records.length, 1);
  })));
  const layouts = new Map<string, LayoutNode>();

  for (let index = 0; index < COLUMNS.length; index += 1) {
    const column = COLUMNS[index];
    const nodes = columns[index];
    const totalHeight = nodes.reduce((sum, node) => sum + Math.max(20, node.count * scale), 0) + Math.max(nodes.length - 1, 0) * gaps;
    let cursor = top + Math.max(0, (availableHeight - totalHeight) / 2);
    for (const node of nodes) {
      const itemHeight = Math.max(20, node.count * scale);
      layouts.set(node.id, { ...node, x: xByColumn[column], y: cursor, height: itemHeight, width: nodeWidth });
      cursor += itemHeight + gaps;
    }
  }

  const outgoing = new Map<string, number>();
  const incoming = new Map<string, number>();
  const links = map.links
    .map((link) => {
      const source = layouts.get(`${link.sourceColumn}:${link.sourceValue}`);
      const target = layouts.get(`${link.targetColumn}:${link.targetValue}`);
      if (!source || !target) return null;
      const linkWidth = Math.max(2.75, link.count * scale);
      const sourceOffset = outgoing.get(source.id) || 0;
      const targetOffset = incoming.get(target.id) || 0;
      outgoing.set(source.id, sourceOffset + linkWidth);
      incoming.set(target.id, targetOffset + linkWidth);
      return {
        ...link,
        source,
        target,
        width: linkWidth,
        sourceY: source.y + sourceOffset + linkWidth / 2,
        targetY: target.y + targetOffset + linkWidth / 2,
      };
    })
    .filter((link): link is LayoutLink => Boolean(link));

  return { width, height, nodeWidth, nodes: [...layouts.values()], links };
}

function isRelated(componentIndexes: number[] | undefined, activeIndexes: Set<number> | null) {
  if (!activeIndexes) return true;
  return componentIndexes?.some((index) => activeIndexes.has(index)) || false;
}

export function CryptographicExposureMap({
  map,
  mode,
  selection,
  onModeChange,
  onSelectionChange,
}: {
  map: ExposureMap;
  mode: ExposureMode;
  selection: ExposureSelection | null;
  onModeChange: (mode: ExposureMode) => void;
  onSelectionChange: (selection: ExposureSelection | null) => void;
}) {
  const [hoverTarget, setHoverTarget] = useState<TooltipTarget>(null);
  const layout = useMemo(() => getLayout(map), [map]);
  const interactionTarget = hoverTarget
    ? hoverTarget.kind === 'node'
      ? { type: 'node' as const, column: hoverTarget.item.column, value: hoverTarget.item.value }
      : {
          type: 'link' as const,
          sourceColumn: hoverTarget.item.sourceColumn,
          sourceValue: hoverTarget.item.sourceValue,
          targetColumn: hoverTarget.item.targetColumn,
          targetValue: hoverTarget.item.targetValue,
        }
    : selection;
  const activeIndexes = componentIndexesForSelection(map, interactionTarget);
  const tooltip = hoverTarget
    ? hoverTarget.kind === 'node'
      ? `${hoverTarget.item.value}: ${hoverTarget.item.count} asset${hoverTarget.item.count === 1 ? '' : 's'}`
      : `${hoverTarget.item.sourceValue} → ${hoverTarget.item.targetValue}: ${hoverTarget.item.count} asset${hoverTarget.item.count === 1 ? '' : 's'}`
    : null;

  const activate = (next: ExposureSelection) => {
    onSelectionChange(selectionEquals(selection, next) ? null : next);
  };
  const onKeyActivate = (event: React.KeyboardEvent<SVGGElement | SVGPathElement>, next: ExposureSelection) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(next);
    }
  };

  const classificationText = mode === 'current' ? 'Current Security' : 'Quantum Exposure';

  return (
    <section className="rounded-xl border border-[#35373B] bg-[#171A1E] p-4 sm:p-5" aria-labelledby="exposure-map-title">
      <div className="flex flex-col gap-4 border-b border-[#35373B] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BDA16F]">Cryptographic exposure map</p>
          <h2 id="exposure-map-title" className="mt-1 text-lg font-semibold text-[#F2F0EB]">Source-to-risk flow for this scan</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#B1B3B6]">
            Each flow is counted from detected CBOM records. Credentials and insecure randomness remain distinct from cryptographic algorithm families.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#35373B] bg-[#111418] p-1" role="group" aria-label="Exposure classification view">
          {(['current', 'quantum'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => onModeChange(view)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${mode === view ? 'bg-[#20242A] text-[#F2F0EB] shadow-sm' : 'text-[#A5A8AE] hover:text-[#F2F0EB]'}`}
              aria-pressed={mode === view}
              data-exposure-mode={view}
            >
              {view === 'current' ? 'Current Security' : 'Quantum Exposure'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#B1B3B6]" aria-label={`${classificationText} color legend`}>
        <span className="font-semibold text-[#F2F0EB]">{classificationText}</span>
        {mode === 'current' ? (
          <>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#D86E70]" />Broken</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#D8A34C]" />Deprecated / review</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#61A3A3]" />Acceptable / strong</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#668FD5]" />Vulnerable</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#8AA7DE]" />Migration / review</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#61A3A3]" />Low concern</span>
          </>
        )}
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#7F8896]" />Not assessed / not applicable</span>
      </div>

      {selection && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#BDA16F]/35 bg-[#BDA16F]/8 px-3 py-2 text-xs text-[#E7D6A3]" role="status">
          <span>Inventory filtered to <strong>{selectionLabel(selection)}</strong>.</span>
          <button type="button" onClick={() => onSelectionChange(null)} className="inline-flex items-center gap-1 font-semibold hover:text-[#F2F0EB]">
            <RotateCcw className="h-3.5 w-3.5" /> Reset selection
          </button>
        </div>
      )}

      <div className="mt-4 hidden overflow-x-auto lg:block">
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="min-w-[900px] w-full" role="img" aria-label={`Sankey diagram showing source languages through cryptographic asset families to ${classificationText.toLowerCase()}`}>
          <title>Cryptographic Exposure Map</title>
          {COLUMNS.map((column) => (
            <text
              key={column}
              x={column === 'language' ? 176 : column === 'family' ? 590 : 1008}
              y="22"
              textAnchor="middle"
              fill="#B1B3B6"
              fontSize="12"
              fontWeight="700"
              letterSpacing="1.4"
            >
              {COLUMN_LABELS[column].toUpperCase()}
            </text>
          ))}
          {layout.links.map((link) => {
            const selected = isRelated(link.componentIndexes, activeIndexes);
            const linkSelection: ExposureSelection = {
              type: 'link',
              sourceColumn: link.sourceColumn,
              sourceValue: link.sourceValue,
              targetColumn: link.targetColumn,
              targetValue: link.targetValue,
            };
            const color = selection && selected ? '#DDBB79' : link.targetColumn === 'classification'
              ? classificationColor(link.targetValue, mode)
              : '#61A3A3';
            const path = `M ${link.source.x + link.source.width} ${link.sourceY} C ${link.source.x + 132} ${link.sourceY}, ${link.target.x - 132} ${link.targetY}, ${link.target.x} ${link.targetY}`;
            return (
              <path
                key={link.id}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={selected ? link.width : Math.max(1.5, link.width * 0.72)}
                strokeOpacity={selected ? 0.66 : 0.1}
                className="cursor-pointer transition-all duration-200 motion-reduce:transition-none"
                tabIndex={0}
                role="button"
                aria-label={`${link.sourceValue} to ${link.targetValue}: ${link.count} assets. Press Enter to filter inventory.`}
                onMouseEnter={() => setHoverTarget({ kind: 'link', item: link })}
                onMouseLeave={() => setHoverTarget(null)}
                onFocus={() => setHoverTarget({ kind: 'link', item: link })}
                onBlur={() => setHoverTarget(null)}
                onClick={() => activate(linkSelection)}
                onKeyDown={(event) => onKeyActivate(event, linkSelection)}
              />
            );
          })}
          {layout.nodes.map((node) => {
            const selected = isRelated(node.componentIndexes, activeIndexes);
            const nodeSelection: ExposureSelection = { type: 'node', column: node.column, value: node.value };
            const color = selection && selected ? '#DDBB79' : nodeColor(node, mode);
            const labelX = node.column === 'language' ? node.x - 12 : node.x + node.width + 12;
            const labelAnchor = node.column === 'language' ? 'end' : 'start';
            return (
              <g
                key={node.id}
                tabIndex={0}
                role="button"
                aria-label={`${node.value}: ${node.count} assets. Press Enter to filter inventory.`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHoverTarget({ kind: 'node', item: node })}
                onMouseLeave={() => setHoverTarget(null)}
                onFocus={() => setHoverTarget({ kind: 'node', item: node })}
                onBlur={() => setHoverTarget(null)}
                onClick={() => activate(nodeSelection)}
                onKeyDown={(event) => onKeyActivate(event, nodeSelection)}
              >
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="5" fill={color} opacity={selected ? 0.92 : 0.55} />
                <rect x={node.x - 2} y={node.y - 2} width={node.width + 4} height={node.height + 4} rx="6" fill="none" stroke={color} strokeWidth={selected ? 1.6 : 0} opacity="0.9" />
                <text x={labelX} y={node.y + node.height / 2 - 3} textAnchor={labelAnchor} fill="#F2F0EB" fontSize="13" fontWeight="700">
                  {node.value}
                </text>
                <text x={labelX} y={node.y + node.height / 2 + 13} textAnchor={labelAnchor} fill="#A5A8AE" fontSize="11">
                  {node.count} asset{node.count === 1 ? '' : 's'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 space-y-2 lg:hidden" aria-label="Simplified cryptographic exposure flow">
        {map.links.filter((link) => link.sourceColumn === 'family').map((link) => {
          const active = isRelated(link.componentIndexes, activeIndexes);
          const next: ExposureSelection = {
            type: 'link', sourceColumn: link.sourceColumn, sourceValue: link.sourceValue, targetColumn: link.targetColumn, targetValue: link.targetValue,
          };
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => activate(next)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? 'border-[#BDA16F]/50 bg-[#20242A]' : 'border-[#35373B] bg-[#111418]'}`}
            >
              <span className="min-w-0 text-xs"><strong className="text-[#F2F0EB]">{link.sourceValue}</strong><span className="px-1.5 text-[#A5A8AE]">→</span><span style={{ color: classificationColor(link.targetValue, mode) }}>{link.targetValue}</span></span>
              <span className="shrink-0 text-xs font-semibold text-[#F2F0EB]">{link.count}</span>
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">{tooltip || (selection ? `Selected ${selectionLabel(selection)}` : 'No exposure-map selection')}</p>
    </section>
  );
}
