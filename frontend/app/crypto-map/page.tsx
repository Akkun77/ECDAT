'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, ChevronDown, ChevronRight, FileCode, FolderOpen, Maximize2, Minimize2, Network, RotateCcw, Search, Shield, X } from 'lucide-react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatOperation, formatQuantumRisk } from '@/lib/display';
import {
  ancestorsForNode,
  buildArchitectureModel,
  buildArchitecturePresentation,
  buildFullPresentation,
  findArchitectureSearchResults,
  type CryptoMapMode,
  type PresentationGraph,
} from '@/lib/crypto-map';
import type { FindingResponse, GraphNode } from '@/types/api';

type MapNodeData = GraphNode['data'] & {
  interaction?: 'root' | 'language' | 'file' | 'finding';
  languageId?: string;
  summary?: string;
  accent?: string;
  expanded?: boolean;
  currentConcernCount?: number;
  quantumConcernCount?: number;
  highlighted?: boolean;
};

const riskDot = (value?: string) => {
  const normalized = value?.toLowerCase();
  if (normalized === 'broken' || normalized === 'vulnerable') return '#D86E70';
  if (normalized === 'deprecated' || normalized === 'migration_concern' || normalized === 'review_required') return '#C8A96B';
  if (normalized === 'acceptable' || normalized === 'strong' || normalized === 'low_concern') return '#70C6BD';
  return '#7F858D';
};

function AppNode({ data }: { data: MapNodeData }) {
  return (
    <div className={`min-w-[190px] rounded-xl border-2 bg-[#1D2023] px-4 py-3 shadow-lg ${data.highlighted ? 'border-[#E7D6A3] ring-2 ring-[#C8A96B]/20' : 'border-[#C5A871]/70'}`} title={data.label}>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-[#C5A871]" />
      <div className="flex items-center gap-2"><Box className="h-4 w-4 text-[#C5A871]" /><span className="text-xs font-bold text-[#F3F0E9]">{data.label}</span></div>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#A5A8AE]">Repository overview</p>
    </div>
  );
}

function LanguageNode({ data }: { data: MapNodeData }) {
  return (
    <div className={`min-w-[210px] rounded-xl border bg-[#1D2023] px-3.5 py-3 shadow-md transition-colors ${data.highlighted ? 'border-[#E7D6A3] ring-2 ring-[#C8A96B]/20' : 'border-[#3A3D3E] hover:border-[#6A7076]'}`} title={data.summary}>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !bg-[#8B9095]" />
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !bg-[#8B9095]" />
      <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-bold text-[#F2F0EB]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: data.accent }} />{data.label}</span>{data.expanded ? <ChevronDown className="h-4 w-4 text-[#A5A8AE]" /> : <ChevronRight className="h-4 w-4 text-[#A5A8AE]" />}</div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#A5A8AE]"><span>{data.summary?.split(' · ').slice(0, 2).join(' · ')}</span></div>
      <div className="mt-1.5 flex gap-2 text-[10px]"><span className="text-[#DFA09B]">C {data.currentConcernCount ?? 0}</span><span className="text-[#E7D6A3]">Q {data.quantumConcernCount ?? 0}</span></div>
    </div>
  );
}

function FileNode({ data }: { data: MapNodeData }) {
  return (
    <div className={`min-w-[160px] rounded-lg border bg-[#20242A] px-3 py-2.5 shadow-sm transition-colors ${data.highlighted ? 'border-[#E7D6A3] ring-2 ring-[#C8A96B]/20' : 'border-[#3A3D3E] hover:border-[#697078]'}`} title={data.path ?? data.label}>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !bg-[#8B9095]" />
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !bg-[#8B9095]" />
      <div className="flex items-center gap-2"><FileCode className="h-3.5 w-3.5 text-[#70C6BD]" /><span className="max-w-[115px] truncate text-xs font-semibold text-[#E8E6E1]">{data.label}</span>{data.expanded ? <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#A5A8AE]" /> : <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#A5A8AE]" />}</div>
      <p className="mt-1 text-[10px] text-[#8F959B]">{data.summary ?? 'Expand findings'}</p>
    </div>
  );
}

function CryptoNode({ data }: { data: MapNodeData }) {
  return (
    <div className={`min-w-[148px] rounded-lg border bg-[#1B1F24] px-3 py-2 shadow-sm transition-colors ${data.highlighted ? 'border-[#E7D6A3] ring-2 ring-[#C8A96B]/20' : 'border-[#3A3D3E] hover:border-[#737981]'}`} title={`${formatAlgorithm(data.label)} — ${formatCurrentSecurity(data.current_security ?? '')}; ${formatQuantumRisk(data.quantum_status ?? '')}`}>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !bg-[#8B9095]" />
      <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" style={{ color: riskDot(data.current_security) }} /><span className="text-xs font-bold text-[#F2F0EB]">{formatAlgorithm(data.label)}</span></div>
      <div className="mt-1.5 flex gap-2 text-[10px] text-[#A5A8AE]"><span className="inline-flex items-center gap-1" title={`Current security: ${formatCurrentSecurity(data.current_security ?? '')}`}><i className="h-1.5 w-1.5 rounded-full" style={{ background: riskDot(data.current_security) }} />Current</span><span className="inline-flex items-center gap-1" title={`Quantum exposure: ${formatQuantumRisk(data.quantum_status ?? '')}`}><i className="h-1.5 w-1.5 rounded-full" style={{ background: riskDot(data.quantum_status) }} />Quantum</span></div>
    </div>
  );
}

const nodeTypes = { application: AppNode, language: LanguageNode, directory: LanguageNode, file: FileNode, crypto: CryptoNode };

function layoutPresentation(presentation: PresentationGraph, mode: CryptoMapMode): Node<MapNodeData>[] {
  const nodes = presentation.nodes;
  const children = new Map<string, string[]>();
  for (const edge of presentation.edges) children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  const positions = new Map<string, { x: number; y: number }>();

  if (mode === 'architecture') {
    const root = nodes.find((node) => node.type === 'application');
    const languages = nodes.filter((node) => node.type === 'language');
    if (root) positions.set(root.id, { x: 0, y: 24 });
    const widths = languages.map((language) => {
      const files = (children.get(language.id) ?? []).filter((id) => nodes.find((node) => node.id === id)?.type === 'file');
      return files.length ? Math.max(300, files.length * 220) : 260;
    });
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, languages.length - 1) * 70;
    let cursor = -totalWidth / 2;
    languages.forEach((language, index) => {
      const width = widths[index];
      const languageX = cursor + width / 2;
      positions.set(language.id, { x: languageX, y: 180 });
      const fileIds = (children.get(language.id) ?? []).filter((id) => nodes.find((node) => node.id === id)?.type === 'file');
      fileIds.forEach((fileId, fileIndex) => {
        const fileX = languageX + (fileIndex - (fileIds.length - 1) / 2) * 220;
        positions.set(fileId, { x: fileX, y: 350 });
        const findingIds = (children.get(fileId) ?? []).filter((id) => nodes.find((node) => node.id === id)?.type === 'crypto');
        findingIds.forEach((findingId, findingIndex) => positions.set(findingId, { x: fileX + (findingIndex % 2 === 0 ? -80 : 80), y: 510 + Math.floor(findingIndex / 2) * 94 }));
      });
      cursor += width + 70;
    });
  } else {
    const root = nodes.find((node) => node.type === 'application');
    const directories = nodes.filter((node) => node.type === 'directory');
    const files = nodes.filter((node) => node.type === 'file');
    if (root) positions.set(root.id, { x: 0, y: 24 });
    directories.forEach((node, index) => positions.set(node.id, { x: (index - (directories.length - 1) / 2) * 480, y: 170 }));
    files.forEach((node, index) => positions.set(node.id, { x: (index % 5 - 2) * 390, y: 330 + Math.floor(index / 5) * 330 }));
    files.forEach((file) => {
      const parent = positions.get(file.id)!;
      const findingIds = (children.get(file.id) ?? []).filter((id) => nodes.find((node) => node.id === id)?.type === 'crypto');
      findingIds.forEach((findingId, index) => positions.set(findingId, { x: parent.x + (index % 2 === 0 ? -100 : 100), y: parent.y + 120 + Math.floor(index / 2) * 92 }));
    });
  }

  return nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    data: node.data as MapNodeData,
    position: positions.get(node.id) ?? { x: (index - nodes.length / 2) * 200, y: 260 },
  }));
}

function CryptoMapCanvas({ nodes, edges, mode, fitRequest, focusNodeId, onNodeClick }: { nodes: Node<MapNodeData>[]; edges: Edge[]; mode: CryptoMapMode; fitRequest: number; focusNodeId: string | null; onNodeClick: NodeMouseHandler<Node<MapNodeData>> }) {
  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);
  const flowRef = useRef<ReactFlowInstance<Node<MapNodeData>, Edge> | null>(null);
  const fit = useCallback((duration = 0) => {
    const instance = flowRef.current;
    if (!instance) return;
    const compact = window.matchMedia('(max-width: 640px)').matches;
    void instance.fitView({ padding: compact ? 0.22 : 0.18, minZoom: mode === 'architecture' ? 0.58 : 0.16, maxZoom: mode === 'architecture' ? 1.12 : 0.95, duration });
  }, [mode]);
  const handleInit = useCallback((instance: ReactFlowInstance<Node<MapNodeData>, Edge>) => { flowRef.current = instance; fit(); }, [fit]);

  useEffect(() => { fit(220); }, [fit, fitRequest]);
  useEffect(() => {
    if (!focusNodeId || !flowRef.current) return;
    const target = flowNodes.find((node) => node.id === focusNodeId);
    if (target) void flowRef.current.fitView({ nodes: [target], padding: 1.8, minZoom: 0.8, maxZoom: 1.05, duration: 240 });
  }, [focusNodeId, flowNodes]);

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      onInit={handleInit}
      minZoom={0.12}
      maxZoom={2}
      defaultEdgeOptions={{ type: 'smoothstep' }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
    >
      <Background color="#171A1D" gap={24} size={1} />
      <Controls className="!rounded-lg !border-[#34393D] !bg-[#171A1D] !shadow-lg" showInteractive={false} />
      <MiniMap
        nodeColor={(node) => node.type === 'application' ? '#C8A96B' : node.type === 'language' ? ((node.data as MapNodeData).accent ?? '#70C6BD') : node.type === 'crypto' ? riskDot((node.data as MapNodeData).current_security) : '#576069'}
        maskColor="rgba(15, 17, 19, 0.85)"
        className="!rounded-lg !border-[#34393D] !bg-[#171A1D]"
      />
    </ReactFlow>
  );
}

function FindingPanel({ finding, onClose }: { finding: FindingResponse; onClose: () => void }) {
  const guidance = finding.migration_recommendation?.suggested_direction || finding.risk_assessment?.recommendation;
  return (
    <aside className="border-t border-[#34393D] bg-[#15191E] p-4 lg:w-80 lg:border-l lg:border-t-0" aria-label="Finding details">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8A96B]">Selected finding</p><h2 className="mt-1 text-lg font-semibold text-[#F2F0EB]">{formatAlgorithm(finding.algorithm)}</h2></div><button type="button" onClick={onClose} className="rounded-md p-1.5 text-[#A5A8AE] hover:bg-[#24282D] hover:text-[#F2F0EB]" aria-label="Close finding details"><X className="h-4 w-4" /></button></div>
      <dl className="mt-4 space-y-3 text-xs"><div><dt className="text-[#8F959B]">Operation</dt><dd className="mt-0.5 text-[#E8E6E1]">{formatOperation(finding.operation)}</dd></div><div><dt className="text-[#8F959B]">Source evidence</dt><dd className="mt-0.5 break-all text-[#E8E6E1]">{finding.file}:{finding.line}</dd></div><div className="grid grid-cols-2 gap-2"><div><dt className="text-[#8F959B]">Current security</dt><dd className="mt-0.5 text-[#E8E6E1]">{formatCurrentSecurity(finding.current_security)}</dd></div><div><dt className="text-[#8F959B]">Quantum exposure</dt><dd className="mt-0.5 text-[#E8E6E1]">{formatQuantumRisk(finding.quantum_status)}</dd></div></div><div><dt className="text-[#8F959B]">Available guidance</dt><dd className="mt-0.5 leading-5 text-[#D5D0C8]">{guidance || 'Open the finding to review its available mitigation and migration guidance.'}</dd></div></dl>
      <Link href="/findings" className="mt-5 inline-flex items-center rounded-md border border-[#C8A96B]/60 px-3 py-2 text-xs font-semibold text-[#E7D6A3] transition-colors hover:bg-[#C8A96B]/10">Open finding guidance</Link>
    </aside>
  );
}

export default function CryptoMapPage() {
  const { graph, findings, scanStatus, state } = useScanContext();
  const [mode, setMode] = useState<CryptoMapMode>('architecture');
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(() => new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(() => new Set());
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(() => new Set());
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fitRequest, setFitRequest] = useState(0);
  const isCompleted = state === 'completed' || scanStatus?.status === 'COMPLETED';
  const model = useMemo(() => graph ? buildArchitectureModel(graph) : null, [graph]);
  const detailsById = useMemo(() => new Map(findings.map((finding) => [finding.id, { file: finding.file, line: finding.line, operation: finding.operation }])), [findings]);
  const searchResults = useMemo(() => model ? findArchitectureSearchResults(model, query, detailsById) : [], [detailsById, model, query]);

  const presentation = useMemo(() => {
    if (!graph || !model) return { nodes: [], edges: [] };
    return mode === 'architecture' ? buildArchitecturePresentation(model, expandedLanguages, expandedFiles) : buildFullPresentation(graph);
  }, [expandedFiles, expandedLanguages, graph, model, mode]);
  const graphNodes = useMemo(() => layoutPresentation(presentation, mode).map((node) => ({ ...node, data: { ...node.data, highlighted: highlightedIds.has(node.id) } })), [highlightedIds, mode, presentation]);
  const graphEdges = useMemo(() => presentation.edges.map((edge) => ({ ...edge, markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: highlightedIds.has(edge.source) && highlightedIds.has(edge.target) ? '#C8A96B' : '#41464C' }, style: { stroke: highlightedIds.has(edge.source) && highlightedIds.has(edge.target) ? '#C8A96B' : '#41464C', strokeWidth: highlightedIds.has(edge.source) && highlightedIds.has(edge.target) ? 2.3 : 1.35 } })), [highlightedIds, presentation.edges]);
  const selectedFinding = findings.find((finding) => finding.id === selectedFindingId) ?? null;

  const fitVisible = () => setFitRequest((value) => value + 1);
  const collapseAll = () => { setExpandedLanguages(new Set()); setExpandedFiles(new Set()); setSelectedFindingId(null); setHighlightedIds(new Set()); setFocusNodeId(null); setFitRequest((value) => value + 1); };
  const resetView = () => { setMode('architecture'); collapseAll(); };

  const reveal = (id: string, languageId?: string, fileId?: string, findingId?: string) => {
    if (languageId) setExpandedLanguages((current) => new Set([...current, languageId]));
    if (fileId) setExpandedFiles((current) => new Set([...current, fileId]));
    if (findingId) setSelectedFindingId(findingId);
    const path = model ? ancestorsForNode(id, model.parentById) : new Set<string>([id]);
    if (languageId) path.add(languageId);
    if (fileId) path.add(fileId);
    setHighlightedIds(path);
    setFocusNodeId(id);
    setFitRequest((value) => value + 1);
  };

  const handleNodeClick: NodeMouseHandler<Node<MapNodeData>> = (_, node) => {
    const data = node.data;
    if (mode === 'architecture' && data.interaction === 'language') {
      setExpandedLanguages((current) => {
        const next = new Set(current);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setSelectedFindingId(null); setHighlightedIds(new Set([node.id])); setFocusNodeId(node.id); setFitRequest((value) => value + 1); return;
    }
    if (mode === 'architecture' && data.interaction === 'file') {
      setExpandedFiles((current) => {
        const next = new Set(current);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
      setHighlightedIds(new Set([data.languageId ?? '', node.id])); setFocusNodeId(node.id); setFitRequest((value) => value + 1); return;
    }
    if (data.interaction === 'finding') reveal(node.id, data.languageId, undefined, data.finding_id);
  };

  if (!isCompleted || !graph || !model) {
    return <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"><div className="max-w-md rounded-xl border border-[#34393D] bg-[#171A1D] p-8"><FolderOpen className="mx-auto h-8 w-8 text-[#C8A96B]" /><h2 className="mt-4 text-xl font-bold text-[#F4F1E8]">Crypto Architecture Map</h2><p className="mt-2 text-sm text-[#8A9094]">Run a scan to explore the cryptographic architecture.</p><Link href="/scan" className="mt-5 inline-flex rounded-lg border border-[#C8A96B]/50 bg-[#C8A96B] px-5 py-2.5 text-sm font-semibold text-[#0F1113]">Start Scanning</Link></div></div>;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-[#34393D] bg-[#0F1113] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="flex items-center gap-2.5 text-2xl font-bold text-[#F4F1E8]"><Network className="h-6 w-6 text-[#70C6BD]" />Crypto Architecture Map</h1><p className="mt-1 text-xs text-[#8A9094] sm:text-sm">Explore real source relationships progressively, or inspect the complete advanced graph.</p></div><div className="flex flex-wrap items-center gap-2 text-xs"><button type="button" onClick={() => { setMode('architecture'); collapseAll(); }} aria-pressed={mode === 'architecture'} className={`rounded-md border px-3 py-2 font-semibold ${mode === 'architecture' ? 'border-[#C8A96B] bg-[#C8A96B]/10 text-[#E7D6A3]' : 'border-[#34393D] text-[#A5A8AE]'}`}>Architecture</button><button type="button" onClick={() => { setMode('full'); setSelectedFindingId(null); setHighlightedIds(new Set()); setFocusNodeId(null); setFitRequest((value) => value + 1); }} aria-pressed={mode === 'full'} className={`rounded-md border px-3 py-2 font-semibold ${mode === 'full' ? 'border-[#C8A96B] bg-[#C8A96B]/10 text-[#E7D6A3]' : 'border-[#34393D] text-[#A5A8AE]'}`}><Maximize2 className="mr-1 inline h-3.5 w-3.5" />Full Graph</button><span className="hidden text-[#5D636A] sm:inline">{graph.nodes.length} nodes · {graph.edges.length} edges</span></div></div>
        <div className="relative mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1 sm:max-w-md"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8F959B]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find file, algorithm, or source location" className="h-9 w-full rounded-md border border-[#34393D] bg-[#171A1D] pl-9 pr-3 text-xs text-[#F2F0EB] outline-none placeholder:text-[#737980] focus:border-[#C8A96B]" aria-label="Search Crypto Map" />{searchResults.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#3A3D3E] bg-[#171A1D] shadow-xl">{searchResults.map((result) => <button key={result.id} type="button" onClick={() => { reveal(result.id, result.languageId, result.fileId, result.type === 'finding' ? model.nodeById.get(result.id)?.data.finding_id : undefined); setQuery(''); }} className="block w-full border-b border-[#2A2E33] px-3 py-2 text-left last:border-0 hover:bg-[#23282E]"><span className="block text-xs font-semibold text-[#F2F0EB]">{result.label}</span><span className="block truncate text-[10px] text-[#A5A8AE]">{result.detail}</span></button>)}</div>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={fitVisible} className="rounded-md border border-[#34393D] px-2.5 py-2 text-xs text-[#B1B3B6] hover:text-[#F2F0EB]"><Minimize2 className="mr-1 inline h-3.5 w-3.5" />Fit visible</button><button type="button" onClick={collapseAll} className="rounded-md border border-[#34393D] px-2.5 py-2 text-xs text-[#B1B3B6] hover:text-[#F2F0EB]">Collapse all</button><button type="button" onClick={resetView} className="rounded-md border border-[#34393D] px-2.5 py-2 text-xs text-[#B1B3B6] hover:text-[#F2F0EB]"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Reset view</button></div></div>
      </header>
      <div className="flex min-h-[560px] flex-1 flex-col lg:flex-row"><main className="relative min-h-[560px] min-w-0 flex-1"><CryptoMapCanvas key={`${mode}-${[...expandedLanguages].join('|')}-${[...expandedFiles].join('|')}`} nodes={graphNodes} edges={graphEdges} mode={mode} fitRequest={fitRequest} focusNodeId={focusNodeId} onNodeClick={handleNodeClick} /><p className="pointer-events-none absolute bottom-3 left-3 rounded bg-[#111418]/90 px-2 py-1 text-[10px] text-[#A5A8AE]">{mode === 'architecture' ? 'Select a language, then a file, to reveal real findings.' : 'Full Graph exposes all scan nodes. Use search, pan, zoom, or the minimap to inspect it.'}</p></main>{selectedFinding && <FindingPanel finding={selectedFinding} onClose={() => { setSelectedFindingId(null); setHighlightedIds(new Set()); }} />}</div>
    </div>
  );
}
