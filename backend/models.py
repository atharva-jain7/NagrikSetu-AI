from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UserLogin(BaseModel):
    mobile: str
    email: Optional[str] = None

class PasswordLogin(BaseModel):
    username: str
    password: str

class OTPVerify(BaseModel):
    mobile: str
    otp: str
    email: Optional[str] = None

class GeminiKeyRequest(BaseModel):
    api_key: str

class TwilioKeyRequest(BaseModel):
    account_sid: str
    auth_token: str
    phone_number: str

class PhotoAnalysis(BaseModel):
    detected_tags: List[str] = []
    visual_severity: str = "Medium"
    safety_hazard: bool = False
    confidence: float = 88.0

class PriorityBreakdown(BaseModel):
    severity_points: int = 20
    safety_risk_points: int = 25
    citizens_points: int = 15
    growth_points: int = 15
    sensitive_location_points: int = 15
    duration_points: int = 10
    total_score: int = 100
    explanation: List[str] = []

class PhotoParseRequest(BaseModel):
    photo_base64: str

class ComplaintCreate(BaseModel):
    citizen_mobile: str = "9820123456"
    citizen_name: str = "Citizen User"
    citizen_email: Optional[str] = "citizen@example.com"
    raw_text: str
    category: Optional[str] = None
    photo_base64: Optional[str] = None
    photo_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None

class Complaint(BaseModel):
    id: str
    citizen_id: str
    citizen_name: str
    citizen_email: Optional[str] = None
    raw_text: str
    language: str
    normalized_text: str
    category: str
    subcategory: str
    severity: str
    priority_score: int
    priority_level: str
    department_id: str
    department_name: str
    ai_confidence: float
    alternative_department: Optional[str] = None
    alternative_confidence: Optional[float] = None
    latitude: float
    longitude: float
    address: str
    ward: str
    city: str
    photo_url: Optional[str] = None
    photo_analysis: Optional[Dict[str, Any]] = None
    issue_cluster_id: Optional[str] = None
    duplicate_of: Optional[str] = None
    status: str = "new"  # new, routed, assigned, in_progress, resolved
    citizen_feedback: Optional[str] = None  # solved, still_exists
    created_at: str
    updated_at: str

class IssueCluster(BaseModel):
    id: str
    title: str
    category: str
    subcategory: str
    latitude: float
    longitude: float
    radius_meters: float
    ward: str
    city: str
    department_id: str
    department_name: str
    citizen_count: int
    unique_complaint_count: int
    duplicate_count: int
    priority_score: int
    priority_level: str
    priority_breakdown: Optional[Dict[str, Any]] = None
    impact_score: int
    trend: str
    growth_rate_pct: float
    status: str = "new"  # new, acknowledged, in_progress, resolved, reopened
    resolution_confidence: str = "High"  # High, Medium, Low (Suspicious)
    resolution_marked_at: Optional[str] = None
    resolution_evidence_url: Optional[str] = None
    resolution_notes: Optional[str] = None
    failed_resolution_alert: bool = False
    failed_resolution_reason: Optional[str] = None
    assigned_team: Optional[str] = None
    assigned_officer: Optional[str] = None
    first_reported_at: str
    latest_reported_at: str
    created_at: str
    updated_at: str

class Department(BaseModel):
    id: str
    name: str
    code: str
    jurisdiction: str
    contact_email: str
    active_issues_count: int = 0
    resolved_count: int = 0
    sla_compliance_pct: float = 94.0

class AssignRequest(BaseModel):
    team: str
    officer: str
    notes: Optional[str] = None
    changed_by: str = "Officer"

class StatusUpdateRequest(BaseModel):
    status: str  # acknowledged, in_progress, resolved, on_hold
    notes: Optional[str] = None
    evidence_photo_base64: Optional[str] = None
    changed_by: str = "Officer"

class RerouteRequest(BaseModel):
    new_department_id: str
    reason: str
    changed_by: str = "Officer"

class CitizenFeedbackRequest(BaseModel):
    feedback: str  # solved | still_exists
    notes: Optional[str] = None
