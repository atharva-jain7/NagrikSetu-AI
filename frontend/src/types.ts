export type Role = 'citizen' | 'admin' | 'officer';

export interface User {
  id: string;
  mobile: string;
  name: string;
  role: Role;
  department_id?: string;
  department_name?: string;
  created_at: string;
}

export interface PhotoAnalysis {
  detected_tags: string[];
  visual_severity: string;
  safety_hazard: boolean;
  confidence: number;
}

export interface PriorityBreakdown {
  severity_points: number;
  safety_risk_points: number;
  citizens_points: number;
  growth_points: number;
  sensitive_location_points: number;
  duration_points: number;
  total_score: number;
  explanation: string[];
}

export interface Complaint {
  id: string;
  citizen_id: string;
  citizen_name: string;
  raw_text: string;
  language: 'en' | 'hi' | 'hinglish';
  normalized_text: string;
  category: string;
  subcategory: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  department_id: string;
  department_name: string;
  ai_confidence: number;
  alternative_department?: string;
  alternative_confidence?: number;
  latitude: number;
  longitude: number;
  address: string;
  ward: string;
  city: string;
  photo_url?: string;
  photo_analysis?: PhotoAnalysis;
  issue_cluster_id?: string;
  duplicate_of?: string;
  status: 'new' | 'routed' | 'assigned' | 'in_progress' | 'resolved';
  citizen_feedback?: 'solved' | 'still_exists' | null;
  linked_duplicates?: Array<{ id: string; citizen_name: string; raw_text: string; created_at: string }>;
  cluster_summary?: {
    id: string;
    title: string;
    priority_level: string;
    status: string;
    citizen_count: number;
    impact_score: number;
  };
  created_at: string;
  updated_at: string;
}

export interface IssueCluster {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  ward: string;
  city: string;
  department_id: string;
  department_name: string;
  citizen_count: number;
  unique_complaint_count: number;
  duplicate_count: number;
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_breakdown?: PriorityBreakdown;
  impact_score: number;
  trend: string;
  growth_rate_pct: number;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'reopened';
  resolution_confidence: 'High' | 'Medium' | 'Low (Suspicious)' | string;
  resolution_marked_at?: string;
  resolution_evidence_url?: string;
  resolution_notes?: string;
  failed_resolution_alert: boolean | number;
  failed_resolution_reason?: string;
  assigned_team?: string;
  assigned_officer?: string;
  first_reported_at: string;
  latest_reported_at: string;
  supporting_complaints?: Complaint[];
  assignments?: Array<{ id: number; team: string; officer: string; notes?: string; assigned_at: string }>;
  timeline?: Array<{ id: number; old_status?: string; new_status: string; changed_by: string; timestamp: string; notes?: string; evidence_photo_url?: string }>;
  reroutes?: Array<{ id: number; from_department: string; to_department: string; reason: string; changed_by: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  jurisdiction: string;
  contact_email: string;
  active_issues_count: number;
  resolved_count: number;
  sla_compliance_pct: number;
}

export interface AnalyticsData {
  kpis: {
    total_complaints: number;
    unique_reports: number;
    duplicate_submissions: number;
    issue_clusters: number;
    critical_issues: number;
    resolved_issues: number;
    failed_resolutions_detected: number;
    duplicate_reduction_rate_pct: number;
  };
  by_category: Array<{ category: string; count: number }>;
  by_department: Array<{ department_id: string; name: string; jurisdiction?: string; count: number; active_clusters?: number }>;
  by_ward: Array<{ ward: string; count: number }>;
  hotspots: Array<{
    ward: string;
    category: string;
    affected_citizens: number;
    cluster_count: number;
    trend: string;
    priority: string;
  }>;
}
