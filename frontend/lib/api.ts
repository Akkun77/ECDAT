import type { ScanAccepted, ScanResponse, SummaryResponse, FindingPage, FindingResponse, CBOMResponse, MigrationResponse, GraphResponse } from '@/types/api';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export const api = {
  health: () => fetchApi<{ status: string }>('/api/health'),
  
  // Scan endpoints
  scanDemo: () => fetchApi<ScanAccepted>('/api/scan/demo', { method: 'POST', body: '{}' }),
  scanLocal: (path: string, name?: string) => fetchApi<ScanAccepted>('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ repository_path: path, project_name: name }),
  }),
  scanUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/api/scan/upload`, { method: 'POST', body: formData })
      .then(r => { if (!r.ok) throw new ApiError(r.status, 'Upload failed'); return r.json() as Promise<ScanAccepted> });
  },
  getScanStatus: (scanId: string) => fetchApi<ScanResponse>(`/api/scan/${scanId}`),
  
  // Results endpoints
  getSummary: (scanId: string) => fetchApi<SummaryResponse>(`/api/summary/${scanId}`),
  getFindings: (scanId: string) => fetchApi<FindingPage>(`/api/findings/${scanId}`),
  getFinding: (scanId: string, findingId: string) => fetchApi<FindingResponse>(`/api/findings/${scanId}/${findingId}`),
  getCbom: (scanId: string) => fetchApi<CBOMResponse>(`/api/cbom/${scanId}`),
  getMigration: (scanId: string) => fetchApi<MigrationResponse>(`/api/migration/${scanId}`),
  getGraph: (scanId: string) => fetchApi<GraphResponse>(`/api/graph/${scanId}`),
  exportJson: (scanId: string) => `${API_BASE}/api/export/${scanId}?format=json`,
  exportCsv: (scanId: string) => `${API_BASE}/api/export/${scanId}?format=csv`,
};
