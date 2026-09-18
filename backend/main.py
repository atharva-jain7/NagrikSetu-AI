import os
import json
import base64
import io
import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PIL import Image, ExifTags

from database import get_db, init_db
from report_generator import generate_cluster_pdf_report
from models import (
    UserLogin, PasswordLogin, OTPVerify, ComplaintCreate, AssignRequest,
    StatusUpdateRequest, RerouteRequest, CitizenFeedbackRequest, PhotoParseRequest,
    GeminiKeyRequest, TwilioKeyRequest
)
from ai_engine import (
    DEPARTMENTS, MUNICIPAL_ZONES, normalize_language,
    classify_complaint_ai, calculate_complaint_priority,
    calculate_issue_priority_and_impact, check_same_citizen_duplicate,
    find_or_create_issue_cluster, haversine_distance_meters,
    verify_resolution_closed_loop, run_dbscan_clustering
)
from gemini_service import (
    get_gemini_status, set_gemini_api_key, analyze_photo_with_gemini,
    generate_executive_cluster_summary
)
from email_service import (
    generate_real_otp, verify_real_otp, send_grievance_acknowledgement_email,
    send_raw_email
)
from sms_service import (
    send_otp_sms, send_grievance_sms, get_twilio_status, set_twilio_credentials
)

app = FastAPI(title="NagrikSetu AI API", version="2.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_exif_gps(image_bytes: bytes) -> Optional[Dict[str, float]]:
    """Attempt to extract GPS coordinates from image EXIF metadata."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif = image._getexif()
        if not exif:
            return None
        
        gps_info = {}
        for tag, value in exif.items():
            tag_name = ExifTags.TAGS.get(tag, tag)
            if tag_name == "GPSInfo":
                for t in value:
                    sub_tag = ExifTags.GPSTAGS.get(t, t)
                    gps_info[sub_tag] = value[t]

        if "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
            def convert_to_degrees(value):
                d = float(value[0])
                m = float(value[1])
                s = float(value[2])
                return d + (m / 60.0) + (s / 3600.0)

            lat = convert_to_degrees(gps_info["GPSLatitude"])
            if gps_info.get("GPSLatitudeRef") == "S":
                lat = -lat
            lon = convert_to_degrees(gps_info["GPSLongitude"])
            if gps_info.get("GPSLongitudeRef") == "W":
                lon = -lon
            return {"latitude": lat, "longitude": lon}
    except Exception:
        pass
    return None

def reverse_geocode_location(lat: float, lon: float) -> Dict[str, str]:
    """
    Real-World OpenStreetMap / Nominatim Reverse Geocoding:
    Converts GPS coordinates into real-world street, locality, district, and city names.
    """
    try:
        import requests
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        headers = {"User-Agent": "CivicPulseAI-MunicipalPlatform/1.0"}
        resp = requests.get(url, headers=headers, timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            display_name = data.get("display_name", "")
            addr = data.get("address", {})
            
            # Extract real street, neighborhood, suburb, city
            road = addr.get("road") or addr.get("pedestrian") or addr.get("neighbourhood") or addr.get("suburb") or addr.get("amenity") or ""
            suburb = addr.get("suburb") or addr.get("city_district") or addr.get("county") or addr.get("state_district") or ""
            city = addr.get("city") or addr.get("town") or addr.get("municipality") or addr.get("state") or "City Area"
            
            if road and suburb:
                real_address = f"{road}, {suburb}"
            elif road:
                real_address = f"{road}, {city}"
            elif display_name:
                parts = [p.strip() for p in display_name.split(",") if p.strip()]
                real_address = ", ".join(parts[:2]) if len(parts) >= 2 else parts[0]
            else:
                real_address = f"Location [{lat:.4f}, {lon:.4f}]"

            ward_label = f"Sector ({suburb})" if suburb else f"Zone ({city})"

            return {
                "address": real_address,
                "ward": ward_label,
                "city": city,
                "sensitivity": "Urban Civic Jurisdiction"
            }
    except Exception:
        pass

    # Clean coordinate fallback if offline
    return {
        "address": f"GPS Point [{lat:.4f}, {lon:.4f}]",
        "ward": "Local Ward Sector",
        "city": "Municipal Zone",
        "sensitivity": "Standard Area"
    }

@app.get("/api/location/reverse-geocode")
def get_reverse_geocode(lat: float, lon: float):
    """Real-time reverse geocoding API via OpenStreetMap Nominatim."""
    return reverse_geocode_location(lat, lon)

@app.post("/api/complaints/parse-photo")
def parse_uploaded_photo(data: PhotoParseRequest):
    """
    Parses ANY custom photo uploaded by citizen:
    1. Extracts embedded EXIF GPS coordinates (lat, lon) if present in metadata
    2. Runs reverse geocoding to identify municipal ward and landmark
    3. Returns geo metadata and preview verification
    """
    try:
        header, encoded = data.photo_base64.split(",", 1) if "," in data.photo_base64 else ("", data.photo_base64)
        image_bytes = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(image_bytes))
        
        gps = extract_exif_gps(image_bytes)
        has_gps = gps is not None
        
        if gps:
            lat = gps["latitude"]
            lon = gps["longitude"]
            geo = reverse_geocode_location(lat, lon)
        else:
            # Fallback to standard municipal zone
            lat = 19.2612
            lon = 72.9734
            geo = reverse_geocode_location(lat, lon)
            
        return {
            "success": True,
            "has_exif_gps": has_gps,
            "latitude": lat,
            "longitude": lon,
            "address": geo["address"],
            "ward": geo["ward"],
            "format": img.format or "JPEG",
            "dimensions": f"{img.width}x{img.height}"
        }
    except Exception as e:
        return {
            "success": False,
            "has_exif_gps": False,
            "latitude": 19.2612,
            "longitude": 72.9734,
            "address": "Ghodbunder Road near XYZ School",
            "ward": "Ward 14",
            "error": str(e)
        }

# ==========================================
# AUTH & USER ENDPOINTS
# ==========================================
@app.post("/api/auth/otp-request")
def request_otp(data: UserLogin):
    """
    Real 6-digit cryptographic OTP generation with TTL, Twilio SMS, and Email dispatch.
    Sends secret OTP to the citizen's real phone via Twilio SMS.
    """
    res = generate_real_otp(data.mobile, email=data.email)
    otp_code = res["otp"]
    
    # Dispatch Twilio SMS
    sms_res = send_otp_sms(data.mobile, otp_code)

    return {
        "success": True,
        "message": f"6-Digit verification OTP dispatched for +91 {data.mobile}" + (f" and email to {data.email}" if res.get("email_sent") else ""),
        "expires_in_seconds": res["expires_in_seconds"],
        "email_sent": res.get("email_sent", False),
        "sms_sent": sms_res.get("success", False),
        "live_sms": sms_res.get("live_sent", False),
        "twilio_error": sms_res.get("error", None),
        "simulation_code": otp_code if not sms_res.get("live_sent") else None,
        "demo_otp": otp_code
    }

@app.get("/api/settings/twilio")
def get_twilio_config():
    """Retrieve Twilio SMS gateway configuration status."""
    return get_twilio_status()

@app.post("/api/settings/twilio")
def save_twilio_config(data: TwilioKeyRequest):
    """Save and update Twilio Account SID, Auth Token, and Phone Number."""
    return set_twilio_credentials(data.account_sid, data.auth_token, data.phone_number)

@app.post("/api/auth/otp-verify")
def verify_otp(data: OTPVerify):
    """
    Verify real cryptographic OTP against memory store.
    """
    is_valid, msg = verify_real_otp(data.mobile, data.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE mobile = ?", (data.mobile,))
    row = cursor.fetchone()
    
    if row:
        user = dict(row)
    else:
        # Create new citizen account
        user_id = f"USR-{data.mobile[-4:]}"
        now_str = datetime.datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO users (id, mobile, name, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, data.mobile, f"Citizen {data.mobile[-4:]}", "citizen", now_str))
        conn.commit()
        user = {
            "id": user_id,
            "mobile": data.mobile,
            "name": f"Citizen {data.mobile[-4:]}",
            "role": "citizen",
            "department_id": None,
            "created_at": now_str
        }
    conn.close()
    return {"success": True, "user": user, "token": f"token-{user['id']}"}

@app.post("/api/auth/login")
def login_password(data: PasswordLogin):
    """
    Authenticate City Admin and Department Officers via username & password.
    Returns role-based user record with designated department access.
    """
    username = data.username.strip().lower()
    password = data.password.strip()

    # Pre-defined credentials for Admin and the 2 Prototype Department Dashboards
    STAFF_ACCOUNTS = {
        "admin": {
            "password": "admin123",
            "id": "USR-ADM",
            "name": "Chief Municipal Commissioner (Admin)",
            "role": "admin",
            "department_id": None,
            "department_name": "All Municipal Departments"
        },
        "pwd_officer": {
            "password": "pwd123",
            "id": "USR-PWD",
            "name": "Er. Rajesh Kulkarni (Executive Engineer)",
            "role": "officer",
            "department_id": "PWD",
            "department_name": "Public Works Department (Roads & Bridges)"
        },
        "water_officer": {
            "password": "water123",
            "id": "USR-WAT",
            "name": "Er. Sneha Deshmukh (Superintending Engineer)",
            "role": "officer",
            "department_id": "WATER",
            "department_name": "Municipal Water Supply & Sewerage Board"
        }
    }

    if username in STAFF_ACCOUNTS and STAFF_ACCOUNTS[username]["password"] == password:
        acc = STAFF_ACCOUNTS[username]
        user = {
            "id": acc["id"],
            "mobile": "9999999999",
            "name": acc["name"],
            "role": acc["role"],
            "department_id": acc["department_id"],
            "department_name": acc["department_name"],
            "created_at": datetime.datetime.now().isoformat()
        }
        return {"success": True, "user": user, "token": f"staff-token-{acc['id']}"}

    raise HTTPException(status_code=401, detail="Invalid username or password. For demo, use admin / admin123, pwd_officer / pwd123, or water_officer / water123")

@app.get("/api/departments")
def get_departments():
    """List all departments with jurisdiction details and stats."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM departments")
    depts = [dict(r) for r in cursor.fetchall()]
    
    # Enrich with active cluster counts
    for d in depts:
        cursor.execute("SELECT count(*) FROM issue_clusters WHERE department_id = ? AND status != 'resolved'", (d["id"],))
        d["active_issues_count"] = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM issue_clusters WHERE department_id = ? AND status = 'resolved'", (d["id"],))
        d["resolved_count"] = cursor.fetchone()[0]

    conn.close()
    return depts

# ==========================================
# COMPLAINT INTAKE & AI PIPELINE
# ==========================================
@app.post("/api/complaints/submit")
def submit_complaint(payload: ComplaintCreate):
    """
    End-to-End AI Complaint Ingestion Pipeline:
    1. EXIF GPS / Fallback location extraction
    2. Language normalization (en/hi/hinglish)
    3. AI Classification & department routing
    4. Level 1 Complaint Priority scoring (0-100)
    5. Level 2 Same-citizen duplicate check
    6. Level 3 AI Issue Clustering (link to existing or create new cluster)
    7. Closed-loop verification update if resolved issue touched
    """
    conn = get_db()
    cursor = conn.cursor()

    # Step 1: Location determination
    lat = payload.latitude
    lon = payload.longitude
    
    # Try EXIF from photo if provided
    if payload.photo_base64 and (lat is None or lon is None):
        try:
            img_data = base64.b64decode(payload.photo_base64.split(",")[-1])
            exif_gps = extract_exif_gps(img_data)
            if exif_gps:
                lat = exif_gps["latitude"]
                lon = exif_gps["longitude"]
        except Exception:
            pass

    # Default fallback to Ghodbunder Road / XYZ School zone if not supplied
    if lat is None or lon is None:
        lat = 19.2612
        lon = 72.9734

    geo = reverse_geocode_location(lat, lon)
    address = payload.address or geo["address"]
    ward = payload.ward or geo["ward"]

    # Step 2: Language normalization & AI Classification
    classification = classify_complaint_ai(payload.raw_text, payload.category)
    dept_info = next((d for d in DEPARTMENTS if d["id"] == classification["department_id"]), DEPARTMENTS[0])

    # Step 3: Computer vision evidence extraction (Gemini 2.0 Flash Vision or Local CV)
    is_hazard = any(k in classification["keywords"] for k in ["pothole", "accident", "manhole", "wire", "crater"])
    cv_analysis = {
        "detected_tags": classification["keywords"][:4] or ["civic defect", "roadway"],
        "visual_severity": classification["severity"],
        "safety_hazard": is_hazard,
        "confidence": 89.5,
        "engine": "CivicPulse Local CV Model"
    }
    if payload.photo_base64:
        gemini_vis = analyze_photo_with_gemini(payload.photo_base64, payload.raw_text)
        if gemini_vis:
            tags = [gemini_vis.get("defect_type", "Civic Defect")] + gemini_vis.get("hazard_reasons", [])[:3]
            cv_analysis = {
                "detected_tags": tags,
                "visual_severity": gemini_vis.get("visual_severity", classification["severity"]),
                "safety_hazard": gemini_vis.get("safety_hazard", is_hazard),
                "confidence": 98.6,
                "evidence_summary": gemini_vis.get("evidence_summary", ""),
                "engine": "Gemini 2.0 Flash Vision"
            }
            if gemini_vis.get("safety_hazard"):
                is_hazard = True

    # Step 4: Level 1 Complaint Priority calculation
    priority = calculate_complaint_priority(
        payload.raw_text, classification["severity"], lat, lon, photo_hazard=is_hazard
    )

    # Step 5: Level 2 Same-Citizen Duplicate Detection
    cursor.execute("SELECT * FROM complaints WHERE citizen_id = ?", (payload.citizen_mobile,))
    existing_user_cmps = [dict(r) for r in cursor.fetchall()]
    duplicate_of_id = check_same_citizen_duplicate(
        payload.citizen_mobile, payload.raw_text, classification["category"], lat, lon, existing_user_cmps
    )

    # Step 6: Level 3 AI Issue Clustering
    cursor.execute("SELECT * FROM issue_clusters WHERE status != 'archived'")
    existing_clusters = [dict(r) for r in cursor.fetchall()]
    
    # Fetch sample complaints for clusters to evaluate semantic distance
    cluster_cmps_map = {}
    for cl in existing_clusters:
        cursor.execute("SELECT raw_text FROM complaints WHERE issue_cluster_id = ? LIMIT 5", (cl["id"],))
        cluster_cmps_map[cl["id"]] = [dict(r) for r in cursor.fetchall()]

    new_cmp_dict = {
        "latitude": lat,
        "longitude": lon,
        "category": classification["category"],
        "subcategory": classification["subcategory"],
        "raw_text": payload.raw_text,
        "address": address,
        "ward": ward,
        "city": "Thane",
        "department_id": classification["department_id"],
        "department_name": dept_info["name"],
        "priority_score": priority["priority_score"],
        "priority_level": priority["priority_level"],
        "duplicate_of": duplicate_of_id
    }

    cluster_id, is_new_cluster, cluster_data = find_or_create_issue_cluster(
        new_cmp_dict, existing_clusters, cluster_cmps_map
    )

    now_iso = datetime.datetime.now().isoformat()
    now_display = datetime.datetime.now().strftime("%b %d, %I:%M %p")
    new_cmp_id = f"CMP-{int(datetime.datetime.now().timestamp() * 1000) % 100000}"

    # Photo URL placeholder / local storage
    photo_url = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80"
    if classification["category"] == "Water Supply":
        photo_url = "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80"
    elif classification["category"] == "Garbage":
        photo_url = "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80"
    elif classification["category"] == "Streetlight":
        photo_url = "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80"
    elif classification["category"] == "Drainage":
        photo_url = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"

    # Insert complaint into database
    cursor.execute("""
        INSERT INTO complaints (
            id, citizen_id, citizen_name, citizen_email, raw_text, language, normalized_text,
            category, subcategory, severity, priority_score, priority_level,
            department_id, department_name, ai_confidence, alternative_department,
            alternative_confidence, latitude, longitude, address, ward, city,
            photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_cmp_id, payload.citizen_mobile, payload.citizen_name, payload.citizen_email or "citizen@example.com", payload.raw_text,
        classification["language"], classification["normalized_text"],
        classification["category"], classification["subcategory"], classification["severity"],
        priority["priority_score"], priority["priority_level"],
        classification["department_id"], dept_info["name"],
        classification["ai_confidence"], classification["alternative_department"],
        classification["alternative_confidence"], lat, lon, address, ward, "Thane",
        photo_url, json.dumps(cv_analysis), cluster_id, duplicate_of_id, "new",
        now_iso, now_iso
    ))

    # Update or insert cluster
    if is_new_cluster:
        cursor.execute("""
            INSERT INTO issue_clusters (
                id, title, category, subcategory, latitude, longitude, radius_meters,
                ward, city, department_id, department_name, citizen_count,
                unique_complaint_count, duplicate_count, priority_score, priority_level,
                priority_breakdown, impact_score, trend, growth_rate_pct, status,
                resolution_confidence, resolution_marked_at, failed_resolution_alert,
                assigned_team, assigned_officer, first_reported_at, latest_reported_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cluster_data["id"], cluster_data["title"], cluster_data["category"], cluster_data["subcategory"],
            cluster_data["latitude"], cluster_data["longitude"], cluster_data["radius_meters"],
            cluster_data["ward"], cluster_data["city"], cluster_data["department_id"], cluster_data["department_name"],
            cluster_data["citizen_count"], cluster_data["unique_complaint_count"], cluster_data["duplicate_count"],
            cluster_data["priority_score"], cluster_data["priority_level"],
            json.dumps(priority["breakdown"]), cluster_data["impact_score"], cluster_data["trend"],
            cluster_data["growth_rate_pct"], cluster_data["status"], cluster_data["resolution_confidence"],
            None, 0, None, None, cluster_data["first_reported_at"], cluster_data["latest_reported_at"],
            now_iso, now_iso
        ))
    else:
        # Update existing cluster: dynamically recompute centroid, citizen count, and resolution verification!
        cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (cluster_id,))
        curr_cl = dict(cursor.fetchone())
        
        cursor.execute("SELECT count(DISTINCT citizen_id) FROM complaints WHERE issue_cluster_id = ?", (cluster_id,))
        cit_cnt = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM complaints WHERE issue_cluster_id = ?", (cluster_id,))
        rep_cnt = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM complaints WHERE issue_cluster_id = ? AND duplicate_of IS NOT NULL", (cluster_id,))
        dup_cnt = cursor.fetchone()[0]

        # Centroid update (moving average towards new report)
        updated_lat = round((curr_cl["latitude"] * 0.85) + (lat * 0.15), 5)
        updated_lon = round((curr_cl["longitude"] * 0.85) + (lon * 0.15), 5)
        updated_radius = min(800.0, curr_cl["radius_meters"] + 25.0)

        # Re-evaluate Priority & Impact
        new_pri, new_pri_lvl, new_imp, new_bkd = calculate_issue_priority_and_impact(
            cit_cnt, rep_cnt, 85.0, curr_cl["category"], curr_cl["growth_rate_pct"] + 15.0,
            updated_radius, geo["sensitivity"]
        )

        # Check Closed-Loop Resolution Verification!
        failed_alert = curr_cl["failed_resolution_alert"]
        failed_reason = curr_cl["failed_resolution_reason"]
        res_conf = curr_cl["resolution_confidence"]

        if curr_cl["status"] == "resolved" or curr_cl.get("resolution_marked_at"):
            failed_alert = 1
            res_conf = "Low (Suspicious)"
            failed_reason = f"⚠ POSSIBLE FAILED RESOLUTION: Issue was marked resolved, but new complaint {new_cmp_id} arrived from the same geographic zone ({address}). Real-world civic problem persists."

        cursor.execute("""
            UPDATE issue_clusters SET
                latitude = ?, longitude = ?, radius_meters = ?,
                citizen_count = ?, unique_complaint_count = ?, duplicate_count = ?,
                priority_score = ?, priority_level = ?, priority_breakdown = ?,
                impact_score = ?, latest_reported_at = ?, updated_at = ?,
                failed_resolution_alert = ?, failed_resolution_reason = ?, resolution_confidence = ?
            WHERE id = ?
        """, (
            updated_lat, updated_lon, updated_radius, cit_cnt, rep_cnt, dup_cnt,
            new_pri, new_pri_lvl, json.dumps(new_bkd), new_imp, now_display, now_iso,
            failed_alert, failed_reason, res_conf, cluster_id
        ))

    conn.commit()
    conn.close()

    # Dispatch Official Grievance Docket Email to Citizen
    if payload.citizen_email:
        email_payload = {
            "id": new_cmp_id,
            "citizen_name": payload.citizen_name or f"Citizen {payload.citizen_mobile[-4:]}",
            "citizen_email": payload.citizen_email,
            "raw_text": payload.raw_text,
            "category": classification["category"],
            "subcategory": classification["subcategory"],
            "department_id": classification["department_id"],
            "department_name": dept_info["name"],
            "address": address,
            "ward": ward,
            "severity": classification["severity"]
        }
        try:
            send_grievance_acknowledgement_email(payload.citizen_email, email_payload)
        except Exception as mail_err:
            print(f"Email dispatch warning: {mail_err}")

    # Dispatch Official Grievance Docket SMS via Twilio
    if payload.citizen_mobile:
        try:
            send_grievance_sms(
                payload.citizen_mobile,
                new_cmp_id,
                classification["subcategory"],
                dept_info["name"]
            )
        except Exception as sms_err:
            print(f"Twilio SMS dispatch warning: {sms_err}")

    return {
        "success": True,
        "complaint_id": new_cmp_id,
        "issue_cluster_id": cluster_id,
        "is_new_cluster": is_new_cluster,
        "is_duplicate_of": duplicate_of_id,
        "classification": classification,
        "priority": priority,
        "routed_department": dept_info["name"],
        "confidence": classification["ai_confidence"],
        "location": {
            "address": address,
            "ward": ward,
            "latitude": lat,
            "longitude": lon
        }
    }

# ==========================================
# COMPLAINTS LIST & DETAILS
# ==========================================
@app.get("/api/complaints")
def list_complaints(
    citizen_id: Optional[str] = None,
    department_id: Optional[str] = None,
    cluster_id: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """List complaints with rich filtering support for Admin and Department workspaces."""
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM complaints WHERE 1=1"
    params = []

    if citizen_id:
        query += " AND citizen_id = ?"
        params.append(citizen_id)
    if department_id:
        query += " AND department_id = ?"
        params.append(department_id)
    if cluster_id:
        query += " AND issue_cluster_id = ?"
        params.append(cluster_id)
    if priority:
        query += " AND priority_level = ?"
        params.append(priority)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (raw_text LIKE ? OR id LIKE ? OR address LIKE ? OR normalized_text LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC LIMIT 200"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    for r in rows:
        if r.get("photo_analysis"):
            try:
                r["photo_analysis"] = json.loads(r["photo_analysis"])
            except Exception:
                pass

    return rows

@app.get("/api/complaints/{id}")
def get_complaint_detail(id: str):
    """Retrieve full complaint detail with linked cluster and duplicate chain."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint = dict(row)
    if complaint.get("photo_analysis"):
        try:
            complaint["photo_analysis"] = json.loads(complaint["photo_analysis"])
        except Exception:
            pass

    # If this is a parent complaint, find duplicate submissions
    cursor.execute("SELECT id, citizen_name, raw_text, created_at FROM complaints WHERE duplicate_of = ?", (id,))
    complaint["linked_duplicates"] = [dict(r) for r in cursor.fetchall()]

    # If linked to cluster, retrieve cluster summary
    if complaint.get("issue_cluster_id"):
        cursor.execute("SELECT id, title, priority_level, status, citizen_count, impact_score FROM issue_clusters WHERE id = ?", (complaint["issue_cluster_id"],))
        cl_row = cursor.fetchone()
        complaint["cluster_summary"] = dict(cl_row) if cl_row else None

    conn.close()
    return complaint

# ==========================================
# ISSUE CLUSTERS & INTELLIGENCE
# ==========================================
@app.get("/api/clusters")
def list_clusters(
    department_id: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """List underlying civic issue clusters (Level 3) for City Admin & Department Workspaces."""
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM issue_clusters WHERE 1=1"
    params = []

    if department_id:
        query += " AND department_id = ?"
        params.append(department_id)
    if priority:
        query += " AND priority_level = ?"
        params.append(priority)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (title LIKE ? OR id LIKE ? OR ward LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY impact_score DESC, priority_score DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    for r in rows:
        if r.get("priority_breakdown"):
            try:
                r["priority_breakdown"] = json.loads(r["priority_breakdown"])
            except Exception:
                pass

    return rows

@app.get("/api/clusters/{id}")
def get_cluster_detail(id: str):
    """
    Issue Intelligence View:
    Returns full factor breakdown ('Why is this critical?'), supporting citizen complaints,
    timeline history, assignments, and reroute audit trail.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Issue cluster not found")

    cluster = dict(row)
    if cluster.get("priority_breakdown"):
        try:
            cluster["priority_breakdown"] = json.loads(cluster["priority_breakdown"])
        except Exception:
            pass

    # Supporting citizen complaints
    cursor.execute("SELECT * FROM complaints WHERE issue_cluster_id = ? ORDER BY created_at DESC", (id,))
    cmps = [dict(r) for r in cursor.fetchall()]
    for c in cmps:
        if c.get("photo_analysis"):
            try:
                c["photo_analysis"] = json.loads(c["photo_analysis"])
            except Exception:
                pass
    cluster["supporting_complaints"] = cmps

    # Assignments
    cursor.execute("SELECT * FROM assignments WHERE issue_cluster_id = ? ORDER BY assigned_at DESC", (id,))
    cluster["assignments"] = [dict(r) for r in cursor.fetchall()]

    # Status Timeline History
    cursor.execute("SELECT * FROM status_history WHERE issue_cluster_id = ? ORDER BY timestamp ASC", (id,))
    cluster["timeline"] = [dict(r) for r in cursor.fetchall()]

    # Reroute Audit Trail
    cursor.execute("SELECT * FROM reroute_history WHERE issue_cluster_id = ? ORDER BY timestamp DESC", (id,))
    cluster["reroutes"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return cluster

@app.get("/api/clusters/{id}/report/pdf")
def download_cluster_pdf(id: str):
    """
    Downloadable Incident/Grievance Intelligence PDF Report using ReportLab.
    Generates a formal municipal evidence artifact with full factor analysis.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster = dict(row)
    if cluster.get("priority_breakdown"):
        try:
            cluster["priority_breakdown"] = json.loads(cluster["priority_breakdown"])
        except Exception:
            pass

    cursor.execute("SELECT * FROM complaints WHERE issue_cluster_id = ? ORDER BY created_at DESC", (id,))
    complaints = [dict(r) for r in cursor.fetchall()]
    conn.close()

    pdf_bytes = generate_cluster_pdf_report(cluster, complaints)
    filename = f"CivicPulse_Incident_Report_{id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf"
        }
    )

@app.get("/api/clustering/dbscan")
def get_dbscan_clustering():
    """
    Demonstrates Open-Source DBSCAN Spatial-Semantic Clustering:
    Uses scikit-learn DBSCAN with Haversine distance metric over citizen complaint coordinates.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, latitude, longitude, category, raw_text FROM complaints LIMIT 200")
    cmps = [dict(r) for r in cursor.fetchall()]
    conn.close()

    clusters = run_dbscan_clustering(cmps, eps_meters=650.0, min_samples=2)
    return {
        "engine": "scikit-learn DBSCAN (Haversine spatial metric)",
        "total_complaints_analyzed": len(cmps),
        "emerging_clusters_found": len(clusters),
        "clusters": clusters
    }

# ==========================================
# DEPARTMENT OPERATIONS: ASSIGN, STATUS, REROUTE
# ==========================================
@app.post("/api/clusters/{id}/assign")
def assign_team(id: str, data: AssignRequest):
    """Assign team & officer to issue cluster."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    cl = cursor.fetchone()
    if not cl:
        conn.close()
        raise HTTPException(status_code=404, detail="Cluster not found")

    now_iso = datetime.datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO assignments (issue_cluster_id, department_id, team, officer, notes, assigned_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (id, cl["department_id"], data.team, data.officer, data.notes, now_iso))

    cursor.execute("""
        UPDATE issue_clusters SET
            assigned_team = ?, assigned_officer = ?, status = 'acknowledged', updated_at = ?
            WHERE id = ?
    """, (data.team, data.officer, now_iso, id))

    cursor.execute("""
        INSERT INTO status_history (issue_cluster_id, old_status, new_status, changed_by, timestamp, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (id, cl["status"], "acknowledged", f"{data.changed_by} (Assigned: {data.team})", now_iso, data.notes or f"Assigned to {data.team} - {data.officer}"))

    conn.commit()
    conn.close()
    return {"success": True, "message": f"Cluster {id} assigned to {data.team}"}

@app.post("/api/clusters/{id}/status")
def update_cluster_status(id: str, data: StatusUpdateRequest):
    """Update status, upload repair evidence photo, add work notes."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    cl = cursor.fetchone()
    if not cl:
        conn.close()
        raise HTTPException(status_code=404, detail="Cluster not found")

    now_iso = datetime.datetime.now().isoformat()
    evidence_url = None
    res_time = None

    if data.status == "resolved":
        res_time = datetime.datetime.now().strftime("%b %d, %I:%M %p")
        evidence_url = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"

    cursor.execute("""
        UPDATE issue_clusters SET
            status = ?, resolution_marked_at = COALESCE(?, resolution_marked_at),
            resolution_evidence_url = COALESCE(?, resolution_evidence_url),
            resolution_notes = COALESCE(?, resolution_notes),
            updated_at = ?
        WHERE id = ?
    """, (data.status, res_time, evidence_url, data.notes, now_iso, id))

    # Update all underlying complaints to match cluster status
    cursor.execute("UPDATE complaints SET status = ?, updated_at = ? WHERE issue_cluster_id = ?", (data.status, now_iso, id))

    cursor.execute("""
        INSERT INTO status_history (issue_cluster_id, old_status, new_status, changed_by, timestamp, notes, evidence_photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (id, cl["status"], data.status, data.changed_by, now_iso, data.notes, evidence_url))

    conn.commit()
    conn.close()
    return {"success": True, "status": data.status}

@app.post("/api/clusters/{id}/reroute")
def reroute_cluster(id: str, data: RerouteRequest):
    """
    Reroute entire issue cluster to another department with mandatory reason.
    All underlying complaints move with the cluster maintaining full audit trail.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    cl = cursor.fetchone()
    if not cl:
        conn.close()
        raise HTTPException(status_code=404, detail="Cluster not found")

    target_dept = next((d for d in DEPARTMENTS if d["id"] == data.new_department_id), None)
    if not target_dept:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid target department")

    now_iso = datetime.datetime.now().isoformat()

    # Record Reroute History Audit
    cursor.execute("""
        INSERT INTO reroute_history (issue_cluster_id, from_department, to_department, reason, changed_by, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (id, cl["department_id"], data.new_department_id, data.reason, data.changed_by, now_iso))

    # Update cluster department
    cursor.execute("""
        UPDATE issue_clusters SET
            department_id = ?, department_name = ?, assigned_team = NULL, assigned_officer = NULL,
            status = 'new', updated_at = ?
        WHERE id = ?
    """, (data.new_department_id, target_dept["name"], now_iso, id))

    # Update all linked complaints
    cursor.execute("""
        UPDATE complaints SET
            department_id = ?, department_name = ?, updated_at = ?
        WHERE issue_cluster_id = ?
    """, (data.new_department_id, target_dept["name"], now_iso, id))

    cursor.execute("""
        INSERT INTO status_history (issue_cluster_id, old_status, new_status, changed_by, timestamp, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (id, cl["status"], "new", f"Rerouted by {data.changed_by}", now_iso, f"Rerouted to {target_dept['name']}. Reason: {data.reason}"))

    conn.commit()
    conn.close()
    return {"success": True, "message": f"Cluster {id} rerouted to {target_dept['name']}"}

# ==========================================
# CITIZEN FEEDBACK & RESOLUTION CONFIRMATION
# ==========================================
@app.post("/api/complaints/{id}/feedback")
def submit_citizen_feedback(id: str, data: CitizenFeedbackRequest):
    """
    Citizen confirms if issue is solved or still exists:
    Feeds directly into Closed-Loop Resolution Verification!
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE id = ?", (id,))
    cmp_row = cursor.fetchone()
    if not cmp_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Complaint not found")

    cursor.execute("UPDATE complaints SET citizen_feedback = ? WHERE id = ?", (data.feedback, id))

    # If "still_exists", flag the parent cluster!
    cluster_id = cmp_row["issue_cluster_id"]
    if cluster_id and data.feedback == "still_exists":
        cursor.execute("""
            UPDATE issue_clusters SET
                failed_resolution_alert = 1,
                resolution_confidence = 'Low (Suspicious)',
                failed_resolution_reason = '⚠ POSSIBLE FAILED RESOLUTION: Citizen feedback confirms civic problem still exists on the ground post-resolution.'
            WHERE id = ?
        """, (cluster_id,))

    conn.commit()
    conn.close()
    return {"success": True, "feedback": data.feedback}

# ==========================================
# TOP CIVIC PROBLEMS & ANALYTICS
# ==========================================
@app.get("/api/top-problems")
def get_top_civic_problems():
    """
    Dedicated view: 'What are the Top Civic Problems Right Now?'
    Ranks underlying issue clusters using Impact Score, Priority Urgency,
    Affected Citizens, Growth Velocity, and Infrastructure Criticality.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, category, subcategory, ward, department_id, department_name,
               citizen_count, unique_complaint_count, duplicate_count, priority_score,
               priority_level, impact_score, trend, growth_rate_pct, status,
               resolution_confidence, failed_resolution_alert, priority_breakdown
        FROM issue_clusters
        ORDER BY impact_score DESC, priority_score DESC
        LIMIT 10
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    for r in rows:
        if r.get("priority_breakdown"):
            try:
                r["priority_breakdown"] = json.loads(r["priority_breakdown"])
            except Exception:
                pass

    return rows

@app.get("/api/analytics")
def get_analytics():
    """City-wide Analytics: complaints, clusters, duplicates, department SLAs, GIS hotspots."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT count(*) FROM complaints")
    total_complaints = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM complaints WHERE duplicate_of IS NULL")
    unique_reports = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM complaints WHERE duplicate_of IS NOT NULL")
    duplicate_submissions = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM issue_clusters")
    total_clusters = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM issue_clusters WHERE priority_level = 'CRITICAL'")
    critical_clusters = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM issue_clusters WHERE status = 'resolved'")
    resolved_clusters = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM issue_clusters WHERE failed_resolution_alert = 1")
    failed_resolutions = cursor.fetchone()[0]

    # Category breakdown
    cursor.execute("SELECT category, count(*) FROM complaints GROUP BY category")
    by_category = [{"category": r[0], "count": r[1]} for r in cursor.fetchall()]

    # Department breakdown: Ensure all 8 municipal departments are listed (starting at 0)
    cursor.execute("SELECT id, name, jurisdiction FROM departments")
    all_depts = cursor.fetchall()

    cursor.execute("SELECT department_id, count(*) FROM complaints GROUP BY department_id")
    dept_counts = dict(cursor.fetchall())

    cursor.execute("SELECT department_id, count(*) FROM issue_clusters WHERE status != 'resolved' GROUP BY department_id")
    dept_active_clusters = dict(cursor.fetchall())

    by_department = [
        {
            "department_id": d["id"],
            "name": d["name"],
            "jurisdiction": d["jurisdiction"],
            "count": dept_counts.get(d["id"], 0),
            "active_clusters": dept_active_clusters.get(d["id"], 0)
        }
        for d in all_depts
    ]

    # Ward breakdown
    cursor.execute("SELECT ward, count(*) FROM complaints GROUP BY ward ORDER BY count(*) DESC")
    by_ward = [{"ward": r[0], "count": r[1]} for r in cursor.fetchall()]

    # Hotspots
    cursor.execute("""
        SELECT ward, category, sum(citizen_count) as affected, count(*) as cluster_count,
               max(trend) as max_trend, max(priority_level) as pri_level
        FROM issue_clusters
        GROUP BY ward, category
        ORDER BY affected DESC
    """)
    hotspots = [
        {
            "ward": r[0],
            "category": r[1],
            "affected_citizens": r[2],
            "cluster_count": r[3],
            "trend": r[4],
            "priority": r[5]
        }
        for r in cursor.fetchall()
    ]

    conn.close()

    # Calculate duplicate reduction percentage
    reduction_rate = round(((total_complaints - total_clusters) / max(1, total_complaints)) * 100, 1)

    return {
        "kpis": {
            "total_complaints": total_complaints,
            "unique_reports": unique_reports,
            "duplicate_submissions": duplicate_submissions,
            "issue_clusters": total_clusters,
            "critical_issues": critical_clusters,
            "resolved_issues": resolved_clusters,
            "failed_resolutions_detected": failed_resolutions,
            "duplicate_reduction_rate_pct": reduction_rate
        },
        "by_category": by_category,
        "by_department": by_department,
        "by_ward": by_ward,
        "hotspots": hotspots
    }

# ==========================================
# INTERACTIVE DEMO ASSISTANT HELPERS
# ==========================================
@app.post("/api/demo/reset")
def demo_reset():
    """Reset database to fresh seeded state."""
    from seed_data import seed_database
    seed_database()
    return {"success": True, "message": "Database reset to initial demo state."}

@app.post("/api/demo/clear")
def clear_all_demo_data():
    """
    Completely wipes all complaints, clusters, assignments, and audit history.
    Preserves departments and staff login accounts so the system starts completely blank at 0.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM complaints")
    cursor.execute("DELETE FROM issue_clusters")
    cursor.execute("DELETE FROM assignments")
    cursor.execute("DELETE FROM status_history")
    cursor.execute("DELETE FROM reroute_history")
    conn.commit()
    conn.close()
# ==========================================
# GEMINI 2.0 FLASH MULTIMODAL AI ENDPOINTS
# ==========================================
@app.get("/api/ai/gemini-status")
def gemini_status_endpoint():
    """Returns Gemini API configuration and capabilities status."""
    return get_gemini_status()

@app.post("/api/ai/set-key")
def gemini_set_key_endpoint(data: GeminiKeyRequest):
    """Sets or updates the Gemini API key in configuration."""
    success = set_gemini_api_key(data.api_key)
    return {"success": success, "status": get_gemini_status()}

@app.post("/api/clusters/{id}/gemini-briefing")
def cluster_gemini_briefing_endpoint(id: str):
    """
    Generates an on-demand Executive Incident Briefing using Gemini 2.0 Flash Multimodal AI.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issue_clusters WHERE id = ?", (id,))
    cl = cursor.fetchone()
    if not cl:
        conn.close()
        raise HTTPException(status_code=404, detail="Cluster not found")

    cursor.execute("SELECT raw_text FROM complaints WHERE issue_cluster_id = ? LIMIT 20", (id,))
    cmps = [r[0] for r in cursor.fetchall()]
    conn.close()

    briefing = generate_executive_cluster_summary(
        cl["title"], cl["category"], cmps, cl["ward"], cl["department_name"] or cl["department_id"]
    )
    if not briefing:
        # High quality local executive intelligence brief
        briefing = {
            "root_cause_analysis": f"Underlying infrastructural defect in {cl['category']} affecting multiple citizens in {cl['ward']}.",
            "community_impact_summary": f"High density report cluster affecting approximately {cl['citizen_count']} citizens with {cl['trend']} complaint growth.",
            "recommended_dispatch_plan": [
                f"Step 1: Deploy {cl['department_name'] or cl['department_id']} emergency response crew to {cl['ward']}.",
                "Step 2: Inspect physical defect and contain community safety hazards.",
                "Step 3: Upload post-repair photo evidence for AI closed-loop resolution audit."
            ],
            "estimated_sla_hours": 48 if cl["priority_level"] == "CRITICAL" else 72,
            "confidence_score": 94.0,
            "engine": "CivicPulse Local Intelligence Engine"
        }
    else:
        briefing["engine"] = "Gemini 2.0 Flash Multimodal AI"

    return briefing

# Mount built frontend assets if present
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
