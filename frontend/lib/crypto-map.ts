import type { GraphEdge, GraphNode, GraphResponse } from '@/types/api';

export type CryptoMapMode = 'architecture' | 'full';

export type ArchitectureLanguage = {
  id: string;
  label: string;
  accent: string;
  fileIds: string[];
  findingIds: string[];
  currentConcernCount: number;
  quantumConcernCount: number;
};

export type ArchitectureModel = {
  root: GraphNode | null;
  languages: ArchitectureLanguage[];
  filesByLanguage: Map<string, GraphNode[]>;
  findingsByFile: Map<string, GraphNode[]>;
  parentById: Map<string, string>;
  nodeById: Map<string, GraphNode>;
};

export type PresentationNode = Omit<GraphNode, 'type' | 'data'> & {
  type: GraphNode['type'] | 'language';
  data: GraphNode['data'] & {
    interaction?: 'root' | 'language' | 'file' | 'finding';
    languageId?: string;
    summary?: string;
    accent?: string;
    expanded?: boolean;
    currentConcernCount?: number;
    quantumConcernCount?: number;
  };
};

export type PresentationGraph = { nodes: PresentationNode[]; edges: GraphEdge[] };

const languageDefinitions = [
  { label: 'Python', accent: '#70C6BD', extensions: ['.py'] },
  { label: 'JavaScript', accent: '#668FD5', extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx'] },
  { label: 'Java', accent: '#C8A96B', extensions: ['.java'] },
  { label: 'Other source', accent: '#8B9095', extensions: [] },
];

export function languageForPath(path: string) {
  const normalized = path.toLowerCase();
  return languageDefinitions.find((definition) => definition.extensions.some((extension) => normalized.endsWith(extension))) ?? languageDefinitions[3];
}

function isCurrentConcern(node: GraphNode) {
  return ['broken', 'deprecated', 'review_required'].includes(node.data.current_security?.toLowerCase() ?? '');
}

function isQuantumConcern(node: GraphNode) {
  return ['vulnerable', 'migration_concern', 'review_required'].includes(node.data.quantum_status?.toLowerCase() ?? '');
}

export function buildArchitectureModel(graph: GraphResponse): ArchitectureModel {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const parentById = new Map(graph.edges.map((edge) => [edge.target, edge.source]));
  const root = graph.nodes.find((node) => node.type === 'application') ?? null;
  const files = graph.nodes.filter((node) => node.type === 'file');
  const findingsByFile = new Map<string, GraphNode[]>();

  for (const edge of graph.edges) {
    const target = nodeById.get(edge.target);
    if (target?.type !== 'crypto') continue;
    const list = findingsByFile.get(edge.source) ?? [];
    list.push(target);
    findingsByFile.set(edge.source, list);
  }

  const languageRecords = new Map<string, ArchitectureLanguage>();
  const filesByLanguage = new Map<string, GraphNode[]>();
  for (const file of files) {
    const definition = languageForPath(file.data.path ?? file.data.label);
    const id = `language:${definition.label.toLowerCase().replaceAll(' ', '-')}`;
    const findings = findingsByFile.get(file.id) ?? [];
    const record = languageRecords.get(id) ?? {
      id,
      label: definition.label,
      accent: definition.accent,
      fileIds: [],
      findingIds: [],
      currentConcernCount: 0,
      quantumConcernCount: 0,
    };
    record.fileIds.push(file.id);
    record.findingIds.push(...findings.map((finding) => finding.id));
    record.currentConcernCount += findings.filter(isCurrentConcern).length;
    record.quantumConcernCount += findings.filter(isQuantumConcern).length;
    languageRecords.set(id, record);
    filesByLanguage.set(id, [...(filesByLanguage.get(id) ?? []), file]);
  }

  const languages = [...languageRecords.values()].sort((a, b) => a.label.localeCompare(b.label));
  return { root, languages, filesByLanguage, findingsByFile, parentById, nodeById };
}

export function buildArchitecturePresentation(
  model: ArchitectureModel,
  expandedLanguages: ReadonlySet<string>,
  expandedFiles: ReadonlySet<string>,
): PresentationGraph {
  const nodes: PresentationNode[] = [];
  const edges: GraphEdge[] = [];
  if (model.root) {
    nodes.push({ ...model.root, data: { ...model.root.data, interaction: 'root' } });
  }

  for (const language of model.languages) {
    nodes.push({
      id: language.id,
      type: 'language',
      data: {
        label: language.label,
        interaction: 'language',
        languageId: language.id,
        accent: language.accent,
        expanded: expandedLanguages.has(language.id),
        summary: `${language.fileIds.length} files · ${language.findingIds.length} findings · ${language.currentConcernCount} current · ${language.quantumConcernCount} quantum`,
        currentConcernCount: language.currentConcernCount,
        quantumConcernCount: language.quantumConcernCount,
      },
    });
    if (model.root) edges.push({ id: `${model.root.id}->${language.id}`, source: model.root.id, target: language.id });
    if (!expandedLanguages.has(language.id)) continue;

    for (const file of model.filesByLanguage.get(language.id) ?? []) {
      nodes.push({
        ...file,
        data: { ...file.data, interaction: 'file', languageId: language.id, expanded: expandedFiles.has(file.id), summary: `${(model.findingsByFile.get(file.id) ?? []).length} findings` },
      });
      edges.push({ id: `${language.id}->${file.id}`, source: language.id, target: file.id });
      if (!expandedFiles.has(file.id)) continue;
      for (const finding of model.findingsByFile.get(file.id) ?? []) {
        nodes.push({ ...finding, data: { ...finding.data, interaction: 'finding', languageId: language.id } });
        const edge = { id: `${file.id}->${finding.id}`, source: file.id, target: finding.id };
        edges.push(edge);
      }
    }
  }
  return { nodes, edges };
}

export function buildFullPresentation(graph: GraphResponse): PresentationGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      data: { ...node.data, interaction: node.type === 'crypto' ? 'finding' : node.type === 'file' ? 'file' : node.type === 'directory' ? 'language' : 'root' },
    })),
    edges: graph.edges,
  };
}

export function findArchitectureSearchResults(model: ArchitectureModel, query: string, findingDetails: Map<string, { file: string; line: number; operation: string }>) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const results: { id: string; type: 'language' | 'file' | 'finding'; label: string; detail: string; languageId?: string; fileId?: string }[] = [];
  for (const language of model.languages) {
    if (language.label.toLowerCase().includes(normalized)) results.push({ id: language.id, type: 'language', label: language.label, detail: `${language.fileIds.length} files · ${language.findingIds.length} findings`, languageId: language.id });
    for (const file of model.filesByLanguage.get(language.id) ?? []) {
      const path = file.data.path ?? file.data.label;
      if (path.toLowerCase().includes(normalized)) results.push({ id: file.id, type: 'file', label: file.data.label, detail: path, languageId: language.id, fileId: file.id });
      for (const finding of model.findingsByFile.get(file.id) ?? []) {
        const detail = findingDetails.get(finding.data.finding_id ?? finding.id);
        const sourceLocation = detail ? `${detail.file}:${detail.line}` : '';
        const haystack = `${finding.data.label} ${detail?.file ?? ''} ${detail?.line ?? ''} ${sourceLocation}`.toLowerCase();
        if (haystack.includes(normalized)) results.push({ id: finding.id, type: 'finding', label: finding.data.label, detail: detail ? `${detail.file}:${detail.line} · ${detail.operation}` : path, languageId: language.id, fileId: file.id });
      }
    }
  }
  return results.slice(0, 8);
}

export function ancestorsForNode(nodeId: string, parentById: Map<string, string>) {
  const ids = new Set<string>([nodeId]);
  let current = parentById.get(nodeId);
  while (current) {
    ids.add(current);
    current = parentById.get(current);
  }
  return ids;
}
