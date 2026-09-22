// Scan types
export interface ScanAccepted {
  scan_id: string;
  status_url: string;
}

export interface ScanResponse {
  scan_id: string;
  project_name: string;
  source_kind: string;
  status: 'QUEUED' | 'SCANNING' | 'ASSESSING_RISK' | 'GENERATING_CBOM' | 'COMPLETED' | 'FAILED';
  stage: string;
  progress: number | null;
  progress_scope: 'current_stage';
  files_scanned: number;
  total_files: number | null;
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  error: string | null;
}

// Mosca types
export interface MoscaScore {
  data_lifetime_years: number;
  migration_time_years: number;
  threat_horizon_years: number;
  migration_urgency: number;
  urgency_label: 'ACT_NOW' | 'PLAN_NOW' | 'MONITOR';
  is_demo_assumption: boolean;
  business_criticality: string;
  explanation: string;
}

// Risk assessment
export interface RiskAssessment {
  finding_id: string | null;
  current_security_status: 'broken' | 'deprecated' | 'acceptable' | 'strong' | 'review_required';
  quantum_risk_status: 'vulnerable' | 'migration_concern' | 'low_concern' | 'not_applicable' | 'review_required';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  reason: string;
  rule_id: string;
  policy_source: string;
  recommendation: string;
  migration_priority: string;
  migration_notes: string;
  explanation: string;
}

// Migration recommendation
export interface MigrationRecommendation {
  finding_id: string | null;
  detected_algorithm: string;
  operation_type: string;
  why_action_needed: string;
  suggested_direction: string;
  urgency: string;
  migration_notes: string;
  mosca: MoscaScore | null;
  mitigation?: MitigationGuidance | null;
}

export interface MitigationGuidance {
  immediate_action: string;
  interim_controls: string[];
  migration_dependency: string;
  implementation_caution: string;
  validation_step: string;
}

// Finding response (the main data type)
export interface FindingResponse {
  id: string;
  scan_id: string;
  file_path: string;
  file: string;
  line_number: number;
  line: number;
  code_snippet: string;
  language: string;
  library: string;
  algorithm: string;
  operation_type: string;
  operation: string;
  key_size: number | null;
  detected_pattern: string;
  scanner_rule_id: string;
  confidence: string;
  category: 'cryptographic' | 'security_hygiene';
  notes: string;
  mode: string | null;
  padding: string | null;
  curve: string | null;
  current_security: string;
  quantum_status: string;
  severity: string;
  reason: string;
  policy_source: string;
  policy_rule_id: string;
  risk_assessment: RiskAssessment;
  mosca: MoscaScore | null;
  mosca_priority: string | null;
  migration_priority: string;
  migration_recommendation: MigrationRecommendation;
}

export interface FindingPage {
  scan_id: string;
  total: number;
  offset: number;
  limit: number;
  findings: FindingResponse[];
}

// Summary response
export interface SummaryResponse {
  scan_id: string;
  total_findings: number;
  current_critical_findings: number;
  high_findings: number;
  quantum_migration_concerns: number;
  acceptable_strong_findings: number;
  files_scanned: number;
  languages_detected: string[];
  scan_duration_seconds: number;
  algorithm_distribution: Record<string, number>;
}

// Migration response
export interface MigrationGroup {
  name: string;
  count: number;
  findings: FindingResponse[];
}

export interface MigrationResponse {
  scan_id: string;
  groups: MigrationGroup[];
}

// Graph response
export interface GraphNode {
  id: string;
  type: 'application' | 'directory' | 'file' | 'crypto';
  data: {
    label: string;
    path?: string;
    algorithm?: string;
    severity?: string;
    current_security?: string;
    quantum_status?: string;
    finding_id?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphResponse {
  scan_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// CBOM response
export interface CBOMResponse {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tool: { name: string; version: string };
    component: { name: string; type: string };
  };
  components: CBOMComponent[];
}

export interface CBOMComponent {
  bom_ref: string;
  asset_type: string;
  name: string;
  algorithm: string;
  library: string;
  operation: string;
  key_size: number | null;
  source_file: string;
  source_line: number;
  code_snippet: string;
  current_risk: string;
  quantum_risk: string;
  severity: string;
  recommended_action: string;
  scanner_rule_id: string;
  policy_rule_id: string;
  migration_priority: string;
  migration_explanation: string;
  mosca: MoscaScore | null;
  category: string;
}
