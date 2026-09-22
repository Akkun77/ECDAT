'use client';

import { useCallback, useMemo } from 'react';
import { useScanContext } from '@/components/scan-provider';
import { formatAlgorithm, formatCurrentSecurity, formatQuantumRisk } from '@/lib/display';
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
    <div className="px-4 py-3 bg-[#0e1726] border-2 border-blue-500/60 rounded-xl shadow-lg min-w-[160px]">
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Box className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold text-slate-100">{data.label}</span>
      </div>
    </div>
  );
}

function DirNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-3 py-2 bg-[#0e1726] border border-[#1e2d42] rounded-lg min-w-[120px]">
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
    <div className="px-3 py-2 bg-[#0e1726] border border-[#1e2d42] rounded-lg min-w-[120px]">
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
    critical: 'border-red-500/50', high: 'border-amber-500/50',
    medium: 'border-amber-500/40', low: 'border-blue-500/40',
    informational: 'border-[#1e2d42]',
  }[data.severity || 'informational'] || 'border-[#1e2d42]';

  const bgColor = {
    critical: 'bg-red-500/10', high: 'bg-amber-500/10',
    medium: 'bg-amber-500/10', low: 'bg-blue-500/10',
    informational: 'bg-[#0e1726]',
  }[data.severity || 'informational'] || 'bg-[#0e1726]';

  const textColor = {
    critical: 'text-red-400', high: 'text-amber-400',
    medium: 'text-amber-400', low: 'text-blue-400',
    informational: 'text-slate-400',
  }[data.severity || 'informational'] || 'text-slate-400';

  const csColor = {
    broken: 'text-red-400', deprecated: 'text-amber-400',
    acceptable: 'text-emerald-400', strong: 'text-emerald-400',
  }[data.current_security || ''] || 'text-slate-400';

  const qColor = {
    vulnerable: 'text-red-400', migration_concern: 'text-amber-400',
    low_concern: 'text-emerald-400', not_applicable: 'text-slate-500',
  }[data.quantum_status || ''] || 'text-slate-400';

  return (
    <div className={`px-3 py-2.5 ${bgColor} border ${borderColor} rounded-lg min-w-[140px] cursor-pointer hover:border-slate-500 transition-colors`}>
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
      style: { stroke: '#1e2d42', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1e2d42', width: 12, height: 12 },
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
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="text-center flex flex-col items-center">
          <div className="relative w-48 h-32 mb-8 flex justify-center items-center">
            {/* Wireframe Node Network */}
            <div className="absolute top-2 left-6 w-10 h-6 bg-[#0e1726] border border-[#1e2d42] rounded flex items-center justify-center opacity-70">
              <div className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/40" />
            </div>
            <div className="absolute top-12 left-20 w-12 h-8 bg-[#0e1726] border border-[#1e2d42] rounded flex items-center justify-center opacity-90 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
              <div className="w-4 h-4 rounded-sm bg-teal-500/20 border border-teal-500/40" />
            </div>
            <div className="absolute bottom-2 right-6 w-10 h-6 bg-[#0e1726] border border-[#1e2d42] rounded flex items-center justify-center opacity-70">
              <div className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
            </div>
            
            {/* Connector Lines */}
            <div className="absolute top-6 left-[60px] w-8 h-[1px] bg-[#1e2d42] origin-top-left rotate-45" />
            <div className="absolute top-16 left-[125px] w-12 h-[1px] bg-[#1e2d42] origin-top-left rotate-30" />
            
            {/* Central Icon */}
            <div className="absolute -bottom-2 -right-2 p-2 bg-[#070b14] border border-[#1e2d42] rounded-lg z-10">
              <Network className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Crypto Architecture Map</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">Run a scan to visualize the cryptographic architecture.</p>
          <Link href="/scan" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors border border-blue-400/30">
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
      <div className="px-6 py-4 border-b border-[#1e2d42] bg-[#070b14] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <Network className="w-6 h-6 text-blue-400 shrink-0" /> Crypto Architecture Map
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Interactive visualization of cryptographic assets across the application.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs bg-[#0e1726] border border-[#1e2d42] px-3.5 py-2 rounded-lg">
            <span className="text-slate-400">{graph.nodes.length} nodes</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{graph.edges.length} edges</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-medium">{cryptoNodes.filter(n => n.data.severity === 'critical').length} critical</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">{cryptoNodes.filter(n => n.data.severity === 'high').length} high</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
            <span className="text-slate-400">Critical / Broken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
            <span className="text-slate-400">High / Deprecated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/10 border border-amber-500/30" />
            <span className="text-slate-400">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-slate-400">Acceptable / Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#0e1726] border border-[#1e2d42]" />
            <span className="text-slate-400">Informational</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-[500px]">
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
          <Background color="#152033" gap={24} size={1} />
          <Controls
            className="!bg-[#0e1726] !border-[#1e2d42] !rounded-lg !shadow-lg"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'crypto') {
                const severity = (node.data as Record<string, string>).severity;
                const colors: Record<string, string> = {
                  critical: '#ef4444', high: '#f59e0b', medium: '#f59e0b',
                  low: '#2563eb', informational: '#64748b',
                };
                return colors[severity] || '#64748b';
              }
              if (node.type === 'application') return '#2563eb';
              return '#1e2d42';
            }}
            maskColor="rgba(7, 11, 20, 0.85)"
            className="!bg-[#0e1726] !border-[#1e2d42] !rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
