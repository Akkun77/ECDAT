'use client';

import { useCallback, useMemo } from 'react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk, severityBg } from '@/lib/display';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Shield, Zap, FileCode, FolderOpen, Box } from 'lucide-react';
import Link from 'next/link';

// Custom node components
function AppNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-3 bg-slate-800 border-2 border-blue-500/50 rounded-xl shadow-lg shadow-blue-500/10 min-w-[160px]">
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Box className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-slate-100">{data.label}</span>
      </div>
    </div>
  );
}

function DirNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg min-w-[120px]">
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-1.5 !h-1.5" />
      <div className="flex items-center gap-2">
        <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-300">{data.label}</span>
      </div>
    </div>
  );
}

function FileNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-3 py-2 bg-slate-800/60 border border-slate-600/40 rounded-lg min-w-[120px]">
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-1.5 !h-1.5" />
      <div className="flex items-center gap-2">
        <FileCode className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-300">{data.label}</span>
      </div>
    </div>
  );
}

function CryptoNode({ data }: { data: { label: string; severity?: string; current_security?: string; quantum_status?: string } }) {
  const borderColor = {
    critical: 'border-red-500/60', high: 'border-orange-500/60',
    medium: 'border-yellow-500/60', low: 'border-blue-500/40',
    informational: 'border-slate-500/40',
  }[data.severity || 'informational'] || 'border-slate-500/40';

  const bgColor = {
    critical: 'bg-red-500/5', high: 'bg-orange-500/5',
    medium: 'bg-yellow-500/5', low: 'bg-blue-500/5',
    informational: 'bg-slate-500/5',
  }[data.severity || 'informational'] || 'bg-slate-500/5';

  const textColor = {
    critical: 'text-red-400', high: 'text-orange-400',
    medium: 'text-yellow-400', low: 'text-blue-400',
    informational: 'text-slate-400',
  }[data.severity || 'informational'] || 'text-slate-400';

  const csColor = {
    broken: 'text-red-400', deprecated: 'text-orange-400',
    acceptable: 'text-green-400', strong: 'text-emerald-400',
  }[data.current_security || ''] || 'text-slate-400';

  const qColor = {
    vulnerable: 'text-red-400', migration_concern: 'text-amber-400',
    low_concern: 'text-green-400', not_applicable: 'text-slate-500',
  }[data.quantum_status || ''] || 'text-slate-400';

  return (
    <div className={`px-3 py-2.5 ${bgColor} border ${borderColor} rounded-lg min-w-[140px] cursor-pointer hover:scale-105 transition-transform`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-1.5 !h-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <Shield className={`w-3.5 h-3.5 ${textColor}`} />
        <span className={`text-xs font-bold ${textColor}`}>{formatAlgorithm(data.label)}</span>
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className={csColor}>{formatCurrentSecurity(data.current_security || '')}</span>
        <span className={qColor}>{formatQuantumRisk(data.quantum_status || '')}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  application: AppNode,
  directory: DirNode,
  file: FileNode,
  crypto: CryptoNode,
};

function layoutNodes(graphNodes: { id: string; type: string; data: Record<string, unknown> }[], graphEdges: { source: string; target: string }[]) {
  // Simple hierarchical layout
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  graphEdges.forEach(e => {
    if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
    childrenMap.get(e.source)!.push(e.target);
    parentMap.set(e.target, e.source);
  });

  // Find root
  const root = graphNodes.find(n => !parentMap.has(n.id));
  if (!root) return graphNodes.map((n, i) => ({ ...n, position: { x: i * 200, y: 0 } }));

  // BFS layout
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const queue: { id: string; depth: number; index: number; parentX: number }[] = [{ id: root.id, depth: 0, index: 0, parentX: 0 }];
  const depthCounts = new Map<number, number>();

  // First pass: count nodes per depth
  const bfsOrder: { id: string; depth: number }[] = [];
  const tempQueue = [{ id: root.id, depth: 0 }];
  const tempVisited = new Set<string>();
  tempVisited.add(root.id);
  while (tempQueue.length > 0) {
    const { id, depth } = tempQueue.shift()!;
    bfsOrder.push({ id, depth });
    depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
    const children = childrenMap.get(id) || [];
    children.forEach(c => {
      if (!tempVisited.has(c)) {
        tempVisited.add(c);
        tempQueue.push({ id: c, depth: depth + 1 });
      }
    });
  }

  // Second pass: position nodes
  const depthIndexes = new Map<number, number>();
  const xSpacing = 200;
  const ySpacing = 120;

  bfsOrder.forEach(({ id, depth }) => {
    const count = depthCounts.get(depth) || 1;
    const idx = depthIndexes.get(depth) || 0;
    depthIndexes.set(depth, idx + 1);
    const totalWidth = (count - 1) * xSpacing;
    const x = -totalWidth / 2 + idx * xSpacing;
    const y = depth * ySpacing;
    positions.set(id, { x, y });
  });

  return graphNodes.map(n => ({
    ...n,
    position: positions.get(n.id) || { x: 0, y: 0 },
  }));
}

export default function CryptoMapPage() {
  const { graph, state } = useScanContext();

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!graph) return { initialNodes: [], initialEdges: [] };

    const mapped = layoutNodes(
      graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        data: n.data as Record<string, unknown>,
      })),
      graph.edges
    );

    const nodes: Node[] = mapped.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    }));

    const edges: Edge[] = graph.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#475569', strokeWidth: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 12, height: 12 },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when graph data changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (state !== 'completed' || !graph) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Crypto Architecture Map</h2>
          <p className="text-slate-500 mb-6">Run a scan to visualize the cryptographic architecture.</p>
          <Link href="/scan" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            Start Scanning
          </Link>
        </div>
      </div>
    );
  }

  const cryptoNodes = graph.nodes.filter(n => n.type === 'crypto');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" /> Crypto Architecture Map
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Interactive visualization of cryptographic assets across the application.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-slate-400">{graph.nodes.length} nodes</span>
            <span className="text-slate-400">{graph.edges.length} edges</span>
            <span className="text-red-400">{cryptoNodes.filter(n => n.data.severity === 'critical').length} critical</span>
            <span className="text-orange-400">{cryptoNodes.filter(n => n.data.severity === 'high').length} high</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
            <span className="text-slate-400">Critical / Broken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/50" />
            <span className="text-slate-400">High / Deprecated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50" />
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
            <span className="text-slate-400">Acceptable / Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-500/20 border border-slate-500/50" />
            <span className="text-slate-400">Informational</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls
            className="!bg-slate-800 !border-slate-700 !rounded-lg !shadow-xl"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'crypto') {
                const severity = (node.data as Record<string, string>).severity;
                const colors: Record<string, string> = {
                  critical: '#ef4444', high: '#f97316', medium: '#eab308',
                  low: '#3b82f6', informational: '#64748b',
                };
                return colors[severity] || '#64748b';
              }
              if (node.type === 'application') return '#3b82f6';
              return '#334155';
            }}
            maskColor="rgba(15, 23, 42, 0.8)"
            className="!bg-slate-900 !border-slate-700 !rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
