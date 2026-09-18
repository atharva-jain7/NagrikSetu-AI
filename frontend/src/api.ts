import { Complaint, IssueCluster, Department, AnalyticsData, User } from './types';

const API_BASE = '/api';

export async function requestOtp(mobile: string, email?: string) {
  const res = await fetch(`${API_BASE}/auth/otp-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, email }),
  });
  return res.json();
}

export async function verifyOtp(mobile: string, otp: string, email?: string): Promise<{ success: boolean; user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/otp-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid OTP' }));
    throw new Error(err.detail || 'OTP verification failed');
  }
  return res.json();
}

export async function loginPassword(username: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_BASE}/departments`);
  return res.json();
}

export async function parseUploadedPhoto(photoBase64: string): Promise<{
  success: boolean;
  has_exif_gps: boolean;
  latitude: number;
  longitude: number;
  address: string;
  ward: string;
  format?: string;
  dimensions?: string;
}> {
  const res = await fetch(`${API_BASE}/complaints/parse-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo_base64: photoBase64 }),
  });
  return res.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<{
  address: string;
  ward: string;
  city: string;
}> {
  const res = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lon=${lon}`);
  return res.json();
}

export async function submitComplaint(data: {
  citizen_mobile: string;
  citizen_name: string;
  citizen_email?: string;
  raw_text: string;
  category?: string;
  photo_base64?: string;
  photo_name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  ward?: string;
}) {
  const res = await fetch(`${API_BASE}/complaints/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchComplaints(params?: {
  citizen_id?: string;
  department_id?: string;
  cluster_id?: string;
  priority?: string;
  status?: string;
  search?: string;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.citizen_id) query.append('citizen_id', params.citizen_id);
  if (params?.department_id) query.append('department_id', params.department_id);
  if (params?.cluster_id) query.append('cluster_id', params.cluster_id);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/complaints?${query.toString()}`);
  return res.json();
}

export async function fetchComplaintDetail(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}`);
  return res.json();
}

export async function fetchClusters(params?: {
  department_id?: string;
  priority?: string;
  status?: string;
  search?: string;
}): Promise<IssueCluster[]> {
  const query = new URLSearchParams();
  if (params?.department_id) query.append('department_id', params.department_id);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/clusters?${query.toString()}`);
  return res.json();
}

export async function fetchClusterDetail(id: string): Promise<IssueCluster> {
  const res = await fetch(`${API_BASE}/clusters/${id}`);
  return res.json();
}

export async function assignCluster(id: string, data: { team: string; officer: string; notes?: string; changed_by: string }) {
  const res = await fetch(`${API_BASE}/clusters/${id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateClusterStatus(id: string, data: { status: string; notes?: string; evidence_photo_base64?: string; changed_by: string }) {
  const res = await fetch(`${API_BASE}/clusters/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function rerouteCluster(id: string, data: { new_department_id: string; reason: string; changed_by: string }) {
  const res = await fetch(`${API_BASE}/clusters/${id}/reroute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitCitizenFeedback(complaintId: string, feedback: 'solved' | 'still_exists') {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  });
  return res.json();
}

export async function fetchTopProblems(): Promise<IssueCluster[]> {
  const res = await fetch(`${API_BASE}/top-problems`);
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

export async function resetDemoData() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  return res.json();
}

export async function clearDemoData() {
  const res = await fetch(`${API_BASE}/demo/clear`, { method: 'POST' });
  return res.json();
}

export async function getGeminiStatus(): Promise<{ is_configured: boolean; model: string; features: string[] }> {
  const res = await fetch(`${API_BASE}/ai/gemini-status`);
  return res.json();
}

export async function setGeminiKey(apiKey: string) {
  const res = await fetch(`${API_BASE}/ai/set-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  return res.json();
}

export async function getGeminiClusterBriefing(clusterId: string): Promise<{
  root_cause_analysis: string;
  community_impact_summary: string;
  recommended_dispatch_plan: string[];
  estimated_sla_hours: number;
  confidence_score: number;
  engine?: string;
}> {
  const res = await fetch(`${API_BASE}/clusters/${clusterId}/gemini-briefing`, {
    method: 'POST',
  });
  return res.json();
}

export async function getTwilioStatus(): Promise<{
  configured: boolean;
  account_sid: string;
  phone_number: string;
  mode: string;
}> {
  const res = await fetch(`${API_BASE}/settings/twilio`);
  return res.json();
}

export async function setTwilioCredentials(accountSid: string, authToken: string, phoneNumber: string) {
  const res = await fetch(`${API_BASE}/settings/twilio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_sid: accountSid,
      auth_token: authToken,
      phone_number: phoneNumber,
    }),
  });
  return res.json();
}
