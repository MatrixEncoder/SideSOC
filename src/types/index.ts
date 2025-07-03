export interface LogEntry {
  timestamp: string;
  source_ip?: string;
  dest_ip?: string;
  username?: string;
  hostname?: string;
  event_type: string;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  raw_log: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeline: TimelineEvent[];
  affected_assets: AffectedAsset[];
  mitre_mapping: MitreMapping;
  recommendations: string[];
  evidence: LogEntry[];
  created_at: string;
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
  source: string;
}

export interface AffectedAsset {
  type: 'ip' | 'hostname' | 'username';
  value: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface MitreMapping {
  tactic: string;
  technique_id: string;
  technique_name: string;
  description: string;
}

export interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
}