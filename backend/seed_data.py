import json
import random
import datetime
from database import get_db, init_db
from ai_engine import DEPARTMENTS, calculate_complaint_priority, calculate_issue_priority_and_impact, classify_complaint_ai

def seed_database():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM reroute_history")
    cursor.execute("DELETE FROM status_history")
    cursor.execute("DELETE FROM assignments")
    cursor.execute("DELETE FROM complaints")
    cursor.execute("DELETE FROM issue_clusters")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM departments")

    # 1. Seed Departments
    for dept in DEPARTMENTS:
        cursor.execute("""
            INSERT INTO departments (id, code, name, jurisdiction, contact_email, sla_compliance_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (dept["id"], dept["code"], dept["name"], dept["jurisdiction"], dept["contact_email"], random.uniform(88.0, 96.5)))

    # 2. Seed Users
    users = [
        ("USR-001", "9820123456", "Rahul Verma (Citizen)", "citizen", None),
        ("USR-002", "9820234567", "Priya Sharma (Citizen)", "citizen", None),
        ("USR-003", "9820345678", "Amit Patel (Citizen)", "citizen", None),
        ("USR-004", "9820456789", "Sunita Rao (Citizen)", "citizen", None),
        ("USR-ADM", "9999999999", "Chief Municipal Commissioner (Admin)", "admin", None),
        ("USR-PWD", "9888811111", "Er. Rajesh Kulkarni (Executive Engineer)", "officer", "PWD"),
        ("USR-WAT", "9888822222", "Er. Sneha Deshmukh (Superintending Engineer)", "officer", "WATER"),
        ("USR-SAN", "9888833333", "Vikas More (Chief Sanitation Officer)", "officer", "SANITATION"),
        ("USR-DRA", "9888844444", "Anand Shinde (Drainage Officer)", "officer", "DRAINAGE"),
        ("USR-ELE", "9888855555", "Deepak Nair (Electrical Superintendent)", "officer", "ELECTRICAL"),
    ]
    now_str = datetime.datetime.now().isoformat()
    for uid, mob, name, role, did in users:
        cursor.execute("""
            INSERT INTO users (id, mobile, name, role, department_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (uid, mob, name, role, did, now_str))

    # Helper dates
    base_time = datetime.datetime.now() - datetime.timedelta(days=4)

    # 3. Seed Clusters & Complaints
    # ==========================================
    # CLUSTER 1: ROAD DAMAGE — GHODBUNDER ROAD / XYZ SCHOOL (RC-1042)
    # 47 unique citizen reports, 6 duplicates, CRITICAL, +300% trend, PWD
    # ==========================================
    c1_lat, c1_lon = 19.2612, 72.9734
    c1_id = "RC-1042"
    c1_breakdown = {
        "severity_points": 25,
        "safety_risk_points": 28,
        "citizens_points": 32,
        "growth_points": 20,
        "sensitive_location_points": 20,
        "duration_points": 10,
        "total_score": 94,
        "explanation": [
            "47 citizens affected across Ghodbunder corridor",
            "Located directly adjacent to XYZ Public School & Metro Pillar 42",
            "Multiple accidents and two-wheeler slips reported",
            "Rapid complaint velocity (+300% surge in 72 hours)"
        ]
    }
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
        c1_id, "Road Damage — Ghodbunder Road / XYZ School", "Road Damage", "Pothole Hazard",
        c1_lat, c1_lon, 320.0, "Ward 14", "Thane", "PWD",
        "Public Works Department (Roads & Bridges)", 47, 47, 6, 94, "CRITICAL",
        json.dumps(c1_breakdown), 92, "+300%", 300.0, "in_progress",
        "High", None, 0, "Road Maintenance Team 3", "Er. Rajesh Kulkarni",
        (base_time + datetime.timedelta(hours=2)).strftime("%b %d, %I:%M %p"),
        datetime.datetime.now().strftime("%b %d, %I:%M %p"),
        base_time.isoformat(), datetime.datetime.now().isoformat()
    ))

    # Complaint samples for Cluster 1 (Road Damage)
    road_texts = [
        ("Huge pothole near XYZ School, traffic getting heavily choked during school hours.", "en", "Pothole Hazard", "High", 82),
        ("My bike was damaged because of the deep crater outside XYZ School.", "en", "Pothole Hazard", "Critical", 88),
        ("Road outside XYZ School is badly broken and tar is completely washed away.", "en", "Road Collapse / Structural Damage", "High", 76),
        ("Traffic is increasing drastically every morning because of the pothole.", "en", "Pothole Hazard", "Medium", 64),
        ("Sadak par bahut bada gaddha hai school ke paas, bike slip ho rahi hai.", "hinglish", "Pothole Hazard", "Critical", 91),
        ("स्कूल के सामने बहुत गहरा गड्ढा है, तुरंत रिपेयर कराएं वर्ना एक्सीडेंट होगा।", "hi", "Pothole Hazard", "Critical", 89),
        ("Bikes are falling down in the evening due to zero street visibility over the pothole.", "en", "Pothole Hazard", "Critical", 93),
        ("Pothole depth is almost 1.5 feet, dangerous for auto rickshaws and two wheelers.", "en", "Pothole Hazard", "High", 84),
        ("Ghodbunder service road near XYZ school has turned into a crater zone.", "en", "Road Collapse / Structural Damage", "High", 79),
        ("School bus got stuck in the road depression this morning.", "en", "Pothole Hazard", "Critical", 92),
        ("सड़क की हालत बहुत खराब है, गिट्टी बिखर गई है।", "hi", "Road Collapse / Structural Damage", "Medium", 65),
        ("Kripya road repair karein bahut problem ho rahi hai daily commute me.", "hinglish", "Road Collapse / Structural Damage", "Medium", 60),
    ]

    # Create parent complaint CMP-1042
    cursor.execute("""
        INSERT INTO complaints (
            id, citizen_id, citizen_name, raw_text, language, normalized_text,
            category, subcategory, severity, priority_score, priority_level,
            department_id, department_name, ai_confidence, alternative_department,
            alternative_confidence, latitude, longitude, address, ward, city,
            photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "CMP-1042", "USR-001", "Rahul Verma",
        "Huge pothole near XYZ School, traffic getting heavily choked and bike riders falling.",
        "en", "Severe pothole crater road hazard near XYZ School causing traffic congestion",
        "Road Damage", "Pothole Hazard", "Critical", 94, "CRITICAL",
        "PWD", "Public Works Department (Roads & Bridges)", 96.5, "Municipal Roads", 3.5,
        c1_lat, c1_lon, "Ghodbunder Road near XYZ School", "Ward 14", "Thane",
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
        json.dumps({"detected_tags": ["asphalt crater", "pothole", "traffic safety hazard"], "visual_severity": "High", "safety_hazard": True}),
        c1_id, None, "in_progress",
        base_time.isoformat(), datetime.datetime.now().isoformat()
    ))

    # Add duplicate submissions by the SAME citizen Rahul Verma (Level 2 demonstration)
    duplicates_data = [
        ("CMP-1051", "Same pothole still there near XYZ school, no action yet!", "en", base_time + datetime.timedelta(hours=14)),
        ("CMP-1062", "Pothole near school hasn't been repaired and getting bigger.", "en", base_time + datetime.timedelta(hours=28)),
        ("CMP-1073", "Still waiting for road repair outside XYZ school, another bike slipped.", "en", base_time + datetime.timedelta(hours=44)),
    ]
    for dup_id, dup_text, dup_lang, dup_time in duplicates_data:
        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dup_id, "USR-001", "Rahul Verma", dup_text, dup_lang,
            "Repeat submission for existing pothole crater near XYZ School",
            "Road Damage", "Pothole Hazard", "High", 80, "HIGH",
            "PWD", "Public Works Department (Roads & Bridges)", 94.0, "Municipal Roads", 6.0,
            c1_lat + random.uniform(-0.0003, 0.0003), c1_lon + random.uniform(-0.0003, 0.0003),
            "Ghodbunder Road near XYZ School", "Ward 14", "Thane",
            "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["pothole"], "visual_severity": "High", "safety_hazard": True}),
            c1_id, "CMP-1042", "in_progress",  # Linked as duplicate_of CMP-1042!
            dup_time.isoformat(), dup_time.isoformat()
        ))

    # Add remaining unique reports to reach 47 reports
    for idx in range(2, 48):
        c_id = f"CMP-{1000 + idx}"
        if c_id in ["CMP-1042", "CMP-1051", "CMP-1062", "CMP-1073"]:
            c_id = f"CMP-{2000 + idx}"
        
        sample_text, lang, subcat, sev, score = road_texts[idx % len(road_texts)]
        c_time = base_time + datetime.timedelta(hours=random.randint(4, 90))
        c_lat = c1_lat + random.uniform(-0.0015, 0.0015)
        c_lon = c1_lon + random.uniform(-0.0015, 0.0015)
        citizen_name = f"Citizen {chr(65 + (idx % 26))}{idx}"

        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c_id, f"USR-C{idx:03d}", citizen_name, sample_text, lang,
            "Standardized civic report: Pothole & asphalt damage on Ghodbunder corridor",
            "Road Damage", subcat, sev, score, "CRITICAL" if score >= 76 else "HIGH",
            "PWD", "Public Works Department (Roads & Bridges)", random.uniform(91.0, 97.0),
            "Municipal Roads", random.uniform(3.0, 9.0),
            c_lat, c_lon, "Ghodbunder Road Sector 4", "Ward 14", "Thane",
            "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["road damage", "pothole"], "visual_severity": sev, "safety_hazard": sev == "Critical"}),
            c1_id, None, "in_progress",
            c_time.isoformat(), c_time.isoformat()
        ))

    # Add Assignment & Timeline for Cluster 1
    cursor.execute("""
        INSERT INTO assignments (issue_cluster_id, department_id, team, officer, notes, assigned_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (c1_id, "PWD", "Road Maintenance Team 3", "Er. Rajesh Kulkarni", "Emergency patch team mobilized with cold asphalt mix. Work scheduled post morning peak hours.", (base_time + datetime.timedelta(hours=6)).isoformat()))

    cursor.execute("""
        INSERT INTO status_history (issue_cluster_id, old_status, new_status, changed_by, timestamp, notes, evidence_photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (c1_id, "new", "acknowledged", "Er. Rajesh Kulkarni (PWD)", (base_time + datetime.timedelta(hours=3)).isoformat(), "Issue cluster reviewed. High priority due to XYZ School location.", None))

    cursor.execute("""
        INSERT INTO status_history (issue_cluster_id, old_status, new_status, changed_by, timestamp, notes, evidence_photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (c1_id, "acknowledged", "in_progress", "Er. Rajesh Kulkarni (PWD)", (base_time + datetime.timedelta(hours=7)).isoformat(), "Barricading placed. Asphalt truck dispatched to site.", None))

    # ==========================================
    # CLUSTER 2: WATER CRISIS — WARD 14 (RC-1014)
    # 110+ reports, CRITICAL, +240% trend, Water Dept
    # ==========================================
    c2_lat, c2_lon = 19.2550, 72.9810
    c2_id = "RC-1014"
    c2_breakdown = {
        "severity_points": 25,
        "safety_risk_points": 22,
        "citizens_points": 35,
        "growth_points": 20,
        "sensitive_location_points": 18,
        "duration_points": 10,
        "total_score": 96,
        "explanation": [
            "118 citizens affected across residential high-rises and chawls in Ward 14",
            "Drinking water pipeline mainline pressure drop detected",
            "Severe public outcry and tanker dependency (+240% surge this week)"
        ]
    }
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
        c2_id, "Water Outage & Low Pressure — Ward 14 Hiranandani Corridor", "Water Supply", "No Water Supply",
        c2_lat, c2_lon, 650.0, "Ward 14", "Thane", "WATER",
        "Municipal Water Supply & Sewerage Board", 118, 118, 14, 96, "CRITICAL",
        json.dumps(c2_breakdown), 98, "+240%", 240.0, "acknowledged",
        "High", None, 0, "Pipeline Distribution Cell B", "Er. Sneha Deshmukh",
        (base_time - datetime.timedelta(days=1)).strftime("%b %d, %I:%M %p"),
        datetime.datetime.now().strftime("%b %d, %I:%M %p"),
        (base_time - datetime.timedelta(days=1)).isoformat(), datetime.datetime.now().isoformat()
    ))

    water_samples = [
        ("Paani nahi aa raha pichle 3 dino se, pura block pareshan hai tanker bhi nahi mil raha.", "hinglish", "No Water Supply", "Critical", 95),
        ("पानी नहीं आ रहा है, छोटे बच्चे और बुजुर्ग बहुत परेशान हैं। तुरंत पानी चालू करो।", "hi", "No Water Supply", "Critical", 94),
        ("Zero municipal water pressure in Ward 14 since Tuesday. Tanks are completely dry.", "en", "No Water Supply", "Critical", 92),
        ("Ganda aur badboodar paani aa raha hai nal me se, peene layak nahi hai.", "hinglish", "Contaminated Water", "Critical", 96),
        ("Severe water outage in Sector 5. Societies are forced to order private tankers at exorbitant rates.", "en", "No Water Supply", "High", 85),
    ]

    for idx in range(1, 119):
        sample_text, lang, subcat, sev, score = water_samples[idx % len(water_samples)]
        w_lat = c2_lat + random.uniform(-0.0035, 0.0035)
        w_lon = c2_lon + random.uniform(-0.0035, 0.0035)
        w_time = base_time - datetime.timedelta(days=1) + datetime.timedelta(hours=random.randint(1, 72))

        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"CMP-W{idx:03d}", f"USR-W{idx:03d}", f"Citizen Resident {idx}", sample_text, lang,
            "Normalized: Drinking water supply outage / zero pressure in Ward 14 distribution network",
            "Water Supply", subcat, sev, score, "CRITICAL" if score >= 76 else "HIGH",
            "WATER", "Municipal Water Supply & Sewerage Board", random.uniform(92.0, 98.0),
            "Public Health", random.uniform(2.0, 8.0),
            w_lat, w_lon, "Ward 14 Hiranandani / Majiwada Zone", "Ward 14", "Thane",
            "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["dry tap", "water shortage", "pipeline"], "visual_severity": sev, "safety_hazard": True}),
            c2_id, None, "acknowledged",
            w_time.isoformat(), w_time.isoformat()
        ))

    # ==========================================
    # CLUSTER 3: GARBAGE OVERFLOW — WARD 8 MAJIWADA MARKET (RC-1028)
    # 75 reports, HIGH priority, +85% trend, Sanitation Dept
    # ==========================================
    c3_lat, c3_lon = 19.2185, 72.9860
    c3_id = "RC-1028"
    c3_breakdown = {
        "severity_points": 20,
        "safety_risk_points": 18,
        "citizens_points": 24,
        "growth_points": 12,
        "sensitive_location_points": 15,
        "duration_points": 10,
        "total_score": 79,
        "explanation": [
            "75 citizen reports over accumulating organic and market waste",
            "Located at busy commercial junction near Majiwada Market",
            "Pest and stray dog menace with severe foul odor reported"
        ]
    }
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
        c3_id, "Commercial Waste Dumpster Overflow — Majiwada Market", "Garbage", "Overflowing Waste Dumpster",
        c3_lat, c3_lon, 280.0, "Ward 8", "Thane", "SANITATION",
        "Solid Waste Management & Sanitation", 75, 75, 8, 79, "CRITICAL",
        json.dumps(c3_breakdown), 82, "+85%", 85.0, "new",
        "High", None, 0, None, None,
        (base_time - datetime.timedelta(days=2)).strftime("%b %d, %I:%M %p"),
        datetime.datetime.now().strftime("%b %d, %I:%M %p"),
        (base_time - datetime.timedelta(days=2)).isoformat(), datetime.datetime.now().isoformat()
    ))

    garbage_samples = [
        ("Kachra nahi utha pichle 4 din se, pura dhalav overflow ho raha hai aur badboo aa rahi hai.", "hinglish", "Overflowing Waste Dumpster", "High", 76),
        ("कचरे का ढेर लगा है, बदबू से सांस लेना मुश्किल हो गया है। डस्टबिन साफ करो।", "hi", "Overflowing Waste Dumpster", "High", 78),
        ("Massive garbage overflow spilling onto the road outside market gate. Stray dogs gathering.", "en", "Overflowing Waste Dumpster", "High", 80),
        ("Safai karmachari haven't visited this point since weekend. Bio-hazard risk.", "hinglish", "Irregular Garbage Collection", "Medium", 68),
    ]

    for idx in range(1, 76):
        sample_text, lang, subcat, sev, score = garbage_samples[idx % len(garbage_samples)]
        g_lat = c3_lat + random.uniform(-0.0018, 0.0018)
        g_lon = c3_lon + random.uniform(-0.0018, 0.0018)
        g_time = base_time - datetime.timedelta(days=2) + datetime.timedelta(hours=random.randint(1, 48))

        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"CMP-G{idx:03d}", f"USR-G{idx:03d}", f"Merchant / Citizen {idx}", sample_text, lang,
            "Normalized: Severe solid waste accumulation and overflowing dumpster near market",
            "Garbage", subcat, sev, score, "HIGH" if score >= 51 else "MEDIUM",
            "SANITATION", "Solid Waste Management & Sanitation", random.uniform(90.0, 96.0),
            "Public Health", random.uniform(4.0, 10.0),
            g_lat, g_lon, "Majiwada Central Market Road", "Ward 8", "Thane",
            "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["garbage pile", "overflowing dumpster", "plastic waste"], "visual_severity": sev, "safety_hazard": False}),
            c3_id, None, "new",
            g_time.isoformat(), g_time.isoformat()
        ))

    # ==========================================
    # CLUSTER 4: STREETLIGHT FAILURE — THANE STATION LINK ROAD (RC-1035)
    # 38 reports, Electrical Dept, MEDIUM/HIGH
    # ==========================================
    c4_lat, c4_lon = 19.1860, 72.9750
    c4_id = "RC-1035"
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
        c4_id, "Dark Corridor / Streetlight Blackout — Station West Link Road", "Streetlight", "Streetlight Not Working",
        c4_lat, c4_lon, 220.0, "Ward 2", "Thane", "ELECTRICAL",
        "Street Lighting & Electrical Infrastructure", 38, 38, 4, 71, "HIGH",
        json.dumps({
            "severity_points": 18, "safety_risk_points": 24, "citizens_points": 15, "growth_points": 8,
            "sensitive_location_points": 20, "duration_points": 10, "total_score": 71,
            "explanation": ["38 commuters reported continuous blackout on primary transit approach", "High pedestrian safety risk at night for commuters", "Station hub sensitive transit zone"]
        }), 65, "+40%", 40.0, "in_progress",
        "High", None, 0, "Light Maintenance Unit 1", "Deepak Nair",
        (base_time - datetime.timedelta(days=2)).strftime("%b %d, %I:%M %p"),
        datetime.datetime.now().strftime("%b %d, %I:%M %p"),
        (base_time - datetime.timedelta(days=2)).isoformat(), datetime.datetime.now().isoformat()
    ))

    # Add 38 complaints for cluster 4
    for idx in range(1, 39):
        st_text = "Streetlights completely dark from pillar 12 to 24, pitch dark and unsafe for female commuters." if idx % 2 == 0 else "स्ट्रीट लाइट बंद है, स्टेशन रोड पर अंधेरा रहता है।"
        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"CMP-E{idx:03d}", f"USR-E{idx:03d}", f"Commuter {idx}", st_text, "en" if idx % 2 == 0 else "hi",
            "Normalized: Defunct street lighting along major commuter pedestrian link to railway station",
            "Streetlight", "Streetlight Not Working", "High", 71, "HIGH",
            "ELECTRICAL", "Street Lighting & Electrical Infrastructure", 95.0, "PWD", 5.0,
            c4_lat + random.uniform(-0.0012, 0.0012), c4_lon + random.uniform(-0.0012, 0.0012),
            "Station West Bus Stand Approach", "Ward 2", "Thane",
            "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["dark street", "unlit pole"], "visual_severity": "High", "safety_hazard": True}),
            c4_id, None, "in_progress",
            (base_time - datetime.timedelta(days=1)).isoformat(), datetime.datetime.now().isoformat()
        ))

    # ==========================================
    # CLUSTER 5: CLOSED-LOOP RESOLUTION VERIFICATION SHOWCASE (RC-1019)
    # Marked resolved 2 days ago, but 5 new complaints detected post-resolution!
    # Status: 'resolved', failed_resolution_alert = 1, resolution_confidence = 'Low (Suspicious)'
    # ==========================================
    c5_lat, c5_lon = 19.2110, 72.9650
    c5_id = "RC-1019"
    c5_res_time = base_time - datetime.timedelta(days=1)
    cursor.execute("""
        INSERT INTO issue_clusters (
            id, title, category, subcategory, latitude, longitude, radius_meters,
            ward, city, department_id, department_name, citizen_count,
            unique_complaint_count, duplicate_count, priority_score, priority_level,
            priority_breakdown, impact_score, trend, growth_rate_pct, status,
            resolution_confidence, resolution_marked_at, resolution_evidence_url,
            resolution_notes, failed_resolution_alert, failed_resolution_reason,
            assigned_team, assigned_officer, first_reported_at, latest_reported_at,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        c5_id, "Drainage Overflow & Waterlogging — Vartak Nagar Industrial Gate", "Drainage", "Choked Storm Water Drain",
        c5_lat, c5_lon, 260.0, "Ward 6", "Thane", "DRAINAGE",
        "Storm Water Drainage & Flood Control", 42, 42, 3, 85, "CRITICAL",
        json.dumps({
            "severity_points": 22, "safety_risk_points": 24, "citizens_points": 20, "growth_points": 15,
            "sensitive_location_points": 14, "duration_points": 10, "total_score": 85,
            "explanation": ["Storm water drain overflow onto industrial approach road", "Repeat failure: New reports arrived post-resolution", "High vehicle stalling and pedestrian slip risks"]
        }), 80, "+60%", 60.0, "resolved",
        "Low (Suspicious)", c5_res_time.strftime("%b %d, %I:%M %p"),
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
        "Drain desilted by JCB Team 2. Water drained away at 4:30 PM.", 1,
        "⚠ POSSIBLE FAILED RESOLUTION: Issue was marked resolved 2 days ago by Drainage Department, but 5 new related complaints have arrived from the exact same location with citizen feedback 'Problem Still Exists'.",
        "Drainage Cell 2", "Anand Shinde",
        (base_time - datetime.timedelta(days=3)).strftime("%b %d, %I:%M %p"),
        datetime.datetime.now().strftime("%b %d, %I:%M %p"),
        (base_time - datetime.timedelta(days=3)).isoformat(), datetime.datetime.now().isoformat()
    ))

    # Add old complaints for RC-1019
    for idx in range(1, 38):
        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"CMP-D{idx:03d}", f"USR-D{idx:03d}", f"Industrial Worker {idx}",
            "Drainage naala is choked, black water overflowing onto main entry road.", "en",
            "Normalized: Storm water drain blockage causing black water flooding across roadway",
            "Drainage", "Choked Storm Water Drain", "High", 78, "HIGH",
            "DRAINAGE", "Storm Water Drainage & Flood Control", 94.0, "SANITATION", 6.0,
            c5_lat + random.uniform(-0.001, 0.001), c5_lon + random.uniform(-0.001, 0.001),
            "Vartak Nagar Industrial Sector 2", "Ward 6", "Thane",
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["flooded street", "drain overflow"], "visual_severity": "High", "safety_hazard": True}),
            c5_id, None, "resolved",
            (base_time - datetime.timedelta(days=2)).isoformat(), c5_res_time.isoformat()
        ))

    # Add 5 NEW complaints AFTER RESOLUTION (triggers the failed resolution warning!)
    failed_new_cmps = [
        ("CMP-D038", "The drain overflow is back again! It was cleared only for show, dirty water is flowing again.", "en", "still_exists"),
        ("CMP-D039", "Paani fir se sadak par bhar gaya hai, koi permanent kaam nahi hua.", "hinglish", "still_exists"),
        ("CMP-D040", "नाली दोबारा जाम हो गई है, पानी की बदबू बहुत आ रही है।", "hi", "still_exists"),
        ("CMP-D041", "Resolved bol diya portal pe but road is completely drowned in sewage water right now!", "en", "still_exists"),
        ("CMP-D042", "Black water entered my shop again today. Department marked it resolved falsely.", "en", "still_exists"),
    ]
    for cid, ctext, clang, cfeedback in failed_new_cmps:
        cursor.execute("""
            INSERT INTO complaints (
                id, citizen_id, citizen_name, raw_text, language, normalized_text,
                category, subcategory, severity, priority_score, priority_level,
                department_id, department_name, ai_confidence, alternative_department,
                alternative_confidence, latitude, longitude, address, ward, city,
                photo_url, photo_analysis, issue_cluster_id, duplicate_of, status,
                citizen_feedback, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cid, "USR-004", "Sunita Rao", ctext, clang,
            "Normalized: Recurring drain blockage and black sewage flooding post-resolution",
            "Drainage", "Choked Storm Water Drain", "Critical", 88, "CRITICAL",
            "DRAINAGE", "Storm Water Drainage & Flood Control", 96.0, "SANITATION", 4.0,
            c5_lat + random.uniform(-0.0008, 0.0008), c5_lon + random.uniform(-0.0008, 0.0008),
            "Vartak Nagar Industrial Gate", "Ward 6", "Thane",
            "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
            json.dumps({"detected_tags": ["flooded street", "drain overflow"], "visual_severity": "High", "safety_hazard": True}),
            c5_id, None, "new", cfeedback,
            (datetime.datetime.now() - datetime.timedelta(hours=6)).isoformat(), datetime.datetime.now().isoformat()
        ))

    # Add Reroute History sample for demonstrating the Department Rerouting Audit Trail (Section 14)
    cursor.execute("""
        INSERT INTO reroute_history (issue_cluster_id, from_department, to_department, reason, changed_by, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        c5_id, "SANITATION", "DRAINAGE",
        "Originally filed under garbage accumulation, but inspection revealed underground stormwater culvert blockage causing the overflow.",
        "Vikas More (Sanitation Officer)", (base_time - datetime.timedelta(days=3)).isoformat()
    ))

    conn.commit()
    conn.close()
    print("Database successfully seeded with 300+ realistic civic complaints across 5 major clusters.")

if __name__ == "__main__":
    seed_database()
