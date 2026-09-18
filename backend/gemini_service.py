import os
import json
import base64
import requests
from typing import Dict, Any, List, Optional

# Load API Key from Environment or Local Config
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "gemini_config.json")
if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "r") as f:
            cfg = json.load(f)
            if cfg.get("api_key"):
                GEMINI_API_KEY = cfg["api_key"]
    except Exception:
        pass

def set_gemini_api_key(key: str) -> bool:
    """Save user-provided Gemini API key to local config file."""
    global GEMINI_API_KEY
    GEMINI_API_KEY = key.strip()
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump({"api_key": GEMINI_API_KEY}, f)
        return True
    except Exception as e:
        print(f"Error saving Gemini config: {e}")
        return False

def get_gemini_status() -> Dict[str, Any]:
    """Check if Gemini API is active and configured."""
    is_active = bool(GEMINI_API_KEY and len(GEMINI_API_KEY) > 10)
    return {
        "is_configured": is_active,
        "model": "gemini-2.0-flash",
        "features": [
            "Multimodal Photo Scene Understanding & Defect Verification",
            "Executive Incident Briefings for City Administrators",
            "Cross-Department Dispatch & Coordination Action Plans",
            "Multilingual Voice/Text Nuance & Dialect Reasoning"
        ]
    }

def analyze_photo_with_gemini(photo_base64: str, complaint_text: str = "") -> Optional[Dict[str, Any]]:
    """
    Multimodal Computer Vision using Gemini 2.0 Flash:
    1. Inspects image for genuine civic defects (pothole, water pipe, garbage, flood, broken pole).
    2. Flags spam or irrelevant images (selfies, random memes, text documents).
    3. Assesses severity level and safety hazards (open trenches, missing barricades, live wires).
    4. Provides a concise 2-sentence visual evidence report.
    """
    if not GEMINI_API_KEY:
        return None

    try:
        # Clean Base64 string
        clean_b64 = photo_base64
        mime_type = "image/jpeg"
        if "data:image" in photo_base64 and "base64," in photo_base64:
            header, clean_b64 = photo_base64.split("base64,", 1)
            if "image/png" in header:
                mime_type = "image/png"
            elif "image/webp" in header:
                mime_type = "image/webp"

        prompt = f"""You are CivicPulse AI, a municipal computer vision inspector for city governance.
Analyze this citizen-uploaded photo evidence for a reported civic complaint: "{complaint_text}".

Provide your response in EXACT JSON format with the following keys:
{{
    "is_valid_civic_defect": true or false,
    "defect_type": "short title of defect (e.g. Excavation Trench, Road Pothole, Pipe Rupture, Garbage Pile)",
    "visual_severity": "Critical" | "High" | "Medium" | "Low",
    "safety_hazard": true or false,
    "hazard_reasons": ["list of safety risks like missing barricades, traffic obstruction, accident risk"],
    "evidence_summary": "Concise 2-sentence technical summary of physical evidence seen in photo."
}}
Return ONLY valid JSON without markdown fences."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": clean_b64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            # Clean possible markdown fences
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            return json.loads(raw_text.strip())
    except Exception as e:
        print(f"Gemini photo analysis fallback: {e}")

    return None

def generate_executive_cluster_summary(
    cluster_title: str,
    category: str,
    complaints: List[str],
    ward: str,
    department: str
) -> Optional[Dict[str, Any]]:
    """
    Generates an Executive Incident Brief for Municipal Commissioners & Chief Engineers:
    Synthesizes dozens of citizen reports into root cause, community impact, and action plan.
    """
    if not GEMINI_API_KEY:
        return None

    try:
        complaints_sample = "\n".join([f"- {c}" for c in complaints[:15]])
        prompt = f"""You are the Chief AI Intelligence Officer for Thane Municipal Corporation.
Synthesize the following {len(complaints)} citizen complaints clustered into one major civic incident:

Incident: {cluster_title}
Category: {category}
Ward/Location: {ward}
Assigned Department: {department}

Citizen Submissions Sample:
{complaints_sample}

Generate an executive briefing in EXACT JSON format with keys:
{{
    "root_cause_analysis": "One clear sentence identifying the underlying mechanical or infrastructural failure.",
    "community_impact_summary": "One sentence explaining scale of citizen disruption and safety risks.",
    "recommended_dispatch_plan": [
        "Step 1: Immediate containment action",
        "Step 2: Engineering repair action",
        "Step 3: Post-repair verification step"
    ],
    "estimated_sla_hours": 24 or 48 or 72,
    "confidence_score": 98.5
}}
Return ONLY valid JSON without markdown fences."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            return json.loads(raw_text.strip())
    except Exception as e:
        print(f"Gemini executive briefing fallback: {e}")

    return None

def classify_complaint_with_gemini(raw_text: str) -> Optional[Dict[str, Any]]:
    """
    Zero-shot LLM Classification & Department Suggestion using Gemini 2.0 Flash:
    Evaluates raw citizen text against the 100-Class Municipal Grievance Taxonomy across 10 Departments:
    - R01–R10 -> PWD (Roads & PWD)
    - W01–W10 -> WATER (Water Supply)
    - S01–S10 -> SWM (Sanitation & Solid Waste)
    - D01–D10 -> DRAINAGE (Drainage & Stormwater)
    - E01–E10 -> ELECTRICAL (Electrical & Street Lighting)
    - P01–P10 -> GARDEN (Parks & Public Spaces)
    - B01–B10 -> ENCROACHMENT (Municipal Engineering & Buildings)
    - T01–T10 -> TRAFFIC (Traffic & Transport)
    - H01–H10 -> HEALTH (Public Health)
    - A01–A10 -> ANIMAL_CONTROL (Animal Control)
    """
    if not GEMINI_API_KEY:
        return None

    try:
        prompt = f"""You are the automated municipal grievance router for city municipal administration.
Analyze the following citizen complaint (in English, Hindi, or Hinglish):
"{raw_text}"

Match it to EXACTLY ONE of the 100 official municipal grievance classes:
1. Roads & PWD (PWD): R01: Pothole, R02: Damaged Road, R03: Road Cracks, R04: Damaged Footpath, R05: Road Obstruction, R06: Missing Road Sign, R07: Damaged Road Divider, R08: Damaged Speed Breaker, R09: Road Flooding, R10: Road Construction Hazard.
2. Water Supply (WATER): W01: No Water Supply, W02: Low Water Pressure, W03: Water Pipeline Leakage, W04: Contaminated Water, W05: Broken Water Pipeline, W06: Irregular Water Supply, W07: Water Wastage, W08: Damaged Water Valve, W09: Illegal Water Connection, W10: Water Tanker Issue.
3. Sanitation & Solid Waste (SWM): S01: Garbage Accumulation, S02: Missed Garbage Collection, S03: Overflowing Garbage Bin, S04: Illegal Garbage Dumping, S05: Open Garbage Site, S06: Construction Waste, S07: Plastic Waste Accumulation, S08: Unclean Public Area, S09: Waste Collection Vehicle Issue, S10: Dead Animal Waste Disposal.
4. Drainage & Stormwater (DRAINAGE): D01: Blocked Drain, D02: Overflowing Drain, D03: Waterlogging, D04: Flooded Street, D05: Damaged Drain, D06: Open Manhole, D07: Sewage Overflow, D08: Drainage Bad Odour, D09: Clogged Stormwater Channel, D10: Broken Drain Cover.
5. Electrical & Street Lighting (ELECTRICAL): E01: Streetlight Not Working, E02: Broken Streetlight, E03: Flickering Streetlight, E04: Dark Road, E05: Damaged Electric Pole, E06: Exposed Electrical Wire, E07: Fallen Electric Pole, E08: Transformer Problem, E09: Traffic Signal Malfunction, E10: Electrical Safety Hazard / Power Outage.
6. Parks & Public Spaces (GARDEN): P01: Damaged Park Equipment, P02: Unmaintained Park, P03: Broken Public Bench, P04: Overgrown Vegetation / Tree Trimming, P05: Damaged Playground, P06: Poor Park Lighting, P07: Public Space Encroachment, P08: Public Space Cleanliness, P09: Damaged Park Fencing, P10: Unsafe Public Open Space.
7. Municipal Engineering & Buildings (ENCROACHMENT): B01: Illegal Construction, B02: Unsafe Building, B03: Building Damage, B04: Building Encroachment, B05: Unauthorized Building Extension, B06: Construction Debris, B07: Dangerous Structure, B08: Footpath Encroachment / Hawkers, B09: Structural Cracks, B10: Construction Safety Hazard.
8. Traffic & Transport (TRAFFIC): T01: Traffic Congestion, T02: Illegal Parking, T03: Abandoned Vehicle, T04: Missing Traffic Sign, T05: Traffic Signal Problem, T06: Dangerous Junction, T07: Bus Stop Problem, T08: Roadside Obstruction, T09: Pedestrian Safety Issue, T10: Wrong-Way Traffic.
9. Public Health (HEALTH): H01: Mosquito Breeding / Fogging, H02: Public Health Hazard, H03: Food Hygiene Complaint, H04: Unsanitary Premises, H05: Stray Animal Health Concern, H06: Disease Risk Area, H07: Sewage Health Hazard, H08: Foul Smell / Public Nuisance, H09: Unsafe Drinking Water, H10: Public Hygiene Issue.
10. Animal Control (ANIMAL_CONTROL): A01: Stray Dog, A02: Aggressive Animal / Dog Bite, A03: Injured Animal, A04: Dead Animal, A05: Animal Nuisance, A06: Stray Cattle, A07: Animal Shelter Issue, A08: Animal Waste, A09: Animal Traffic Hazard, A10: Illegal Animal Activity.

Respond in EXACT JSON format with keys:
{{
    "class_id": "R01" to "A10",
    "class_name": "Official class name",
    "department_id": "PWD" | "WATER" | "SWM" | "DRAINAGE" | "ELECTRICAL" | "GARDEN" | "ENCROACHMENT" | "TRAFFIC" | "HEALTH" | "ANIMAL_CONTROL",
    "category": "Official department name",
    "subcategory": "Official class name",
    "severity": "Critical" | "High" | "Medium" | "Low",
    "confidence": 98.5,
    "reasoning": "1 sentence explanation why this class and department was selected",
    "alternative_department": "Secondary department if relevant or null"
}}
Return ONLY valid JSON without markdown fences."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        resp = requests.post(url, json=payload, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            raw_text_out = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if raw_text_out.startswith("```json"):
                raw_text_out = raw_text_out[7:]
            if raw_text_out.endswith("```"):
                raw_text_out = raw_text_out[:-3]
            res_json = json.loads(raw_text_out.strip())
            return res_json
    except Exception as e:
        print(f"Gemini routing classification fallback: {e}")

    return None

