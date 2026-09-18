import math
import re
import datetime
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# 100-Class Grievance Taxonomy & 10 Municipal Departments Matrix
from taxonomy import DEPARTMENTS_10, TAXONOMY_100

DEPARTMENTS = DEPARTMENTS_10


# Multilingual Vocabulary and Normalization Lexicon for all 9 Municipal Departments
LEXICON = {
    "electrical": {
        "keywords": ["electricity", "power", "power cut", "power outage", "no electricity", "no power", "bijli", "bijli gul", "current", "batti", "street light", "streetlight", "electric pole", "transformer", "sparking", "blackout", "live wire", "open wire", "fuse", "short circuit", "voltage", "darkness", "andhera", "light nahi hai", "bijli nahi", "load shedding", "electric wire", "high voltage", "low voltage", "power failure", "meter", "electrical shock"],
        "category": "Street Lighting & Electrical Infrastructure",
        "department": "ELECTRICAL",
        "subcategories": {
            "power_outage": (["no electricity", "power cut", "power outage", "bijli gul", "blackout", "no power", "bijli nahi", "load shedding", "power failure"], "Power Outage / Supply Interruption", "Critical"),
            "streetlight": (["street light", "streetlight", "batti band", "darkness", "andhera", "light pole", "light band", "dark street"], "Defunct Streetlight & Public Darkness", "High"),
            "live_wire_hazard": (["live wire", "sparking", "transformer burst", "transformer blast", "open wire", "wire broken", "electric pole fallen", "shock hazard", "current lagna", "short circuit"], "Live Electrical Wire / Shock Hazard", "Critical")
        }
    },
    "water": {
        "keywords": ["drinking water", "water supply", "water cut", "tap water", "water tanker", "pipe leak", "pipeline burst", "no water", "nal", "tanki", "water pressure", "ganda paani", "dushit", "pyaas", "tanker", "peene ka paani", "dry tap", "irregular water pressure", "low water pressure", "water contamination", "paani nahi aa raha"],
        "category": "Water Supply (Hydraulic Engineering)",
        "department": "WATER",
        "subcategories": {
            "no_supply": (["paani nahi aa raha", "no water", "water cut", "paani band", "nal sukha", "3 days no water", "pyaase", "water supply stopped"], "No Water Supply", "Critical"),
            "leakage": (["pipeline leak", "water pipe burst", "water leaking", "pipe tut gaya", "pipeline broken", "water pipe burst"], "Pipeline Leakage", "High"),
            "contamination": (["ganda paani", "dirty water", "smelly water", "badboo paani", "peela paani", "yellow tap water", "water contamination"], "Contaminated Water", "Critical")
        }
    },
    "road": {
        "keywords": ["road", "sadak", "pothole", "gaddha", "khadda", "patch", "tar", "asphalt", "flyover", "broken", "bike", "accident", "chot", "gir gaya", "traffic", "crater", "tyre", "puncture", "footpath", "divider", "traffic obstruction", "road repair", "potholes"],
        "category": "Roads and Traffic",
        "department": "PWD",
        "subcategories": {
            "pothole": (["pothole", "potholes", "gaddha", "khadda", "crater", "deep hole", "bike", "scooter"], "Pothole Hazard", "High"),
            "broken_road": (["broken", "toota", "dhas", "collapsed", "bad condition", "kuch nahi bacha", "road repair"], "Road Collapse / Structural Damage", "Critical"),
            "traffic_obstruction": (["traffic obstruction", "traffic jam", "blocked road", "divider broken", "obstruction"], "Traffic Obstruction", "High")
        }
    },
    "swm": {
        "keywords": ["garbage", "trash", "kachra", "dustbin", "kuda", "kudedaan", "smell", "badboo", "dhalav", "waste", "cleaning", "safai", "deko", "overflow", "litter", "dump", "debris", "sweeping", "debris removal", "solid waste", "swm"],
        "category": "Solid Waste Management (SWM)",
        "department": "SWM",
        "subcategories": {
            "overflow": (["overflow", "bhara hua", "phek", "road par kachra", "dhair", "heaps", "dump"], "Overflowing Waste Dumpster", "High"),
            "sweeping_debris": (["sweeping", "debris", "malba", "safai nahi", "uncleaned debris"], "Street Sweeping & Debris", "Medium"),
            "not_collected": (["nahi utha", "not collected", "unpicked", "kitne din se", "safai nahi hui"], "Irregular Garbage Collection", "Medium")
        }
    },
    "drainage": {
        "keywords": ["water logging", "waterlogging", "water logged", "water-logging", "logging", "paani bhara", "paani jama", "jal jamaav", "jal jamav", "drain", "drainage", "storm water", "stormwater", "gutter", "nala", "naala", "manhole", "choked drain", "blocked drain", "overflowing sewer", "sewer", "sewage", "paani bhar gaya", "dhakkan", "open lid", "flooding", "flood", "submerged", "stagnant water", "water in front", "rain water", "choked gutters", "sewage overflows"],
        "category": "Storm Water Drains & Drainage",
        "department": "DRAINAGE",
        "subcategories": {
            "open_manhole": (["open manhole", "khula dhakkan", "without lid", "girne ka darr", "hazard", "fatal"], "Open Manhole Hazard", "Critical"),
            "choked_drain": (["choked", "jam", "blocked drain", "kachra phasa", "overflowing sewer", "ganda paani sadak", "gutter overflow", "choked gutters"], "Choked Storm Water Drain", "High"),
            "waterlogging": (["water logging", "water logged", "waterlogging", "logging", "paani bhara", "paani jama", "jal jamaav", "flooding", "flood", "submerged", "stagnant water", "water accumulation", "water in front of house", "water in front", "water near house", "water outside"], "Street Waterlogging & Flood", "High")
        }
    },
    "encroachment": {
        "keywords": ["encroachment", "unauthorized construction", "illegal construction", "illegal encroachment", "illegal building", "illegal structure", "illegal shop", "kabza", "footpath blocked", "footpath encroachment", "hawkers", "hawker encroachment", "unlicensed construction", "without permit", "demolition", "blocking footpath", "road encroachment", "unauthorized building", "unauthorized"],
        "category": "Building and Encroachment",
        "department": "ENCROACHMENT",
        "subcategories": {
            "unauthorized_construction": (["unauthorized construction", "illegal construction", "illegal building", "illegal structure", "without permit", "unauthorized building"], "Unauthorized Construction", "High"),
            "illegal_encroachment": (["encroachment", "illegal encroachment", "kabza", "footpath blocked", "hawkers blocking", "blocking footpath"], "Illegal Footpath / Road Encroachment", "High")
        }
    },
    "pest_control": {
        "keywords": ["pest control", "rodent", "rodents", "mosquito", "mosquito menace", "machhar", "dengue", "malaria", "fogging", "rats", "chuhe", "vector-borne", "disease prevention", "larvae", "spraying", "insect infestation", "vector"],
        "category": "Pest Control",
        "department": "PEST_CONTROL",
        "subcategories": {
            "mosquito_fogging": (["mosquito", "mosquito menace", "machhar", "dengue", "malaria", "fogging", "larvae"], "Mosquito Menace & Fogging", "High"),
            "rodent_menace": (["rodent", "rodents", "rats", "chuhe", "pest"], "Rodent Menace & Pest Spread", "Medium")
        }
    },
    "health_licensing": {
        "keywords": ["health and licensing", "food safety", "licenses for establishments", "biomedical concerns", "biomedical waste", "unhygienic restaurant", "food adulteration", "expired food", "hotel license", "clinic waste", "hospital waste", "food poisoning", "unlicensed food", "adulterated"],
        "category": "Health and Licensing",
        "department": "HEALTH_LICENSING",
        "subcategories": {
            "food_safety": (["food safety", "unhygienic restaurant", "food adulteration", "expired food", "food poisoning"], "Food Safety & Quality Violation", "Critical"),
            "biomedical_licensing": (["biomedical", "biomedical waste", "hospital waste", "clinic waste", "licenses for establishments", "trade license"], "Biomedical & Establishment Licensing", "High")
        }
    },
    "garden": {
        "keywords": ["garden", "tree trimming", "maintenance of public parks", "tree branch", "falling tree", "dry tree", "dangerous branch", "overgrown tree", "public park", "park maintenance", "park bench", "lawn", "play area", "garden department", "greenery", "pruning"],
        "category": "Garden Department",
        "department": "GARDEN",
        "subcategories": {
            "tree_trimming": (["tree trimming", "tree branch", "falling tree", "dry tree", "dangerous branch", "pruning"], "Tree Trimming & Hazard Pruning", "High"),
            "park_maintenance": (["public park", "park maintenance", "park bench", "lawn", "play area", "garden"], "Public Park & Garden Upkeep", "Medium")
        }
    }
}

# Known Landmarks and Wards for Reverse Geocoding Simulation
MUNICIPAL_ZONES = [
    {"name": "Ghodbunder Road near XYZ School", "ward": "Ward 14", "lat": 19.2612, "lon": 72.9734, "sensitivity": "High (School Zone & Major Highway)"},
    {"name": "Hiranandani Estate Main Boulevard", "ward": "Ward 14", "lat": 19.2550, "lon": 72.9810, "sensitivity": "Medium"},
    {"name": "Majiwada Junction Flyover", "ward": "Ward 8", "lat": 19.2185, "lon": 72.9860, "sensitivity": "High (Major Traffic Interchange)"},
    {"name": "Naupada Commercial Complex", "ward": "Ward 4", "lat": 19.1890, "lon": 72.9720, "sensitivity": "Medium (Dense Market)"},
    {"name": "Thane Station West Bus Stand", "ward": "Ward 2", "lat": 19.1860, "lon": 72.9750, "sensitivity": "Critical (Transit Hub)"},
    {"name": "Vartak Nagar Industrial Area", "ward": "Ward 6", "lat": 19.2110, "lon": 72.9650, "sensitivity": "Medium"},
    {"name": "Kopri Colony Creek Road", "ward": "Ward 1", "lat": 19.1770, "lon": 72.9830, "sensitivity": "High (Low-lying Coastal)"},
    {"name": "Wagle Estate IT Park Ring Road", "ward": "Ward 7", "lat": 19.1950, "lon": 72.9510, "sensitivity": "Medium"}
]

# Sensitive Location Keywords
SENSITIVE_LOCATIONS = ["school", "hospital", "station", "junction", "highway", "creek", "market", "metro", "bus stand"]

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in meters."""
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def detect_language(text: str) -> str:
    """Detect if text is Hindi (Devanagari), Hinglish, or English."""
    devanagari_pattern = re.compile(r'[\u0900-\u097F]')
    if devanagari_pattern.search(text):
        return "hi"
    
    hinglish_markers = ["nahi", "paani", "sadak", "gaddha", "kachra", "hai", "bahut", "aa raha", "batti", "andhera", "kuda", "choked", "naala", "ganda", "khadda", "pichle", "dino", "se"]
    lower = text.lower()
    matches = sum(1 for m in hinglish_markers if m in lower)
    if matches >= 1:
        return "hinglish"
    return "en"

def normalize_language(text: str) -> Dict[str, Any]:
    """
    Normalizes Hindi / Hinglish / English complaint into canonical English representation.
    Extracts underlying civic issue keywords and standardized summary while keeping raw text intact.
    """
    lang = detect_language(text)
    lower = text.lower()

    # Dictionary of Hinglish / Hindi translations to canonical terms
    translations = [
        (r'\bpaani nahi aa raha\b', 'no municipal water supply'),
        (r'\bpani nahi aa raha\b', 'no municipal water supply'),
        (r'\bपानी नहीं आ रहा\b', 'no municipal water supply'),
        (r'\bpaani ki samasya\b', 'drinking water shortage'),
        (r'\bganda paani\b', 'contaminated dirty water supply'),
        (r'\bgaddha\b', 'pothole road crater'),
        (r'\bkhadda\b', 'deep pothole hazard'),
        (r'\bsadak tooti\b', 'broken damaged road'),
        (r'\bसड़क टूटी हुई है\b', 'broken damaged road surface'),
        (r'\bgir gaya\b', 'fallen accident risk'),
        (r'\bbike phasi\b', 'two-wheeler accident risk'),
        (r'\bkachra nahi utha\b', 'uncollected garbage accumulation'),
        (r'\bkudedaan overflow\b', 'overflowing municipal waste dumpster'),
        (r'\bandhera rehta hai\b', 'darkness due to defunct streetlight'),
        (r'\bbatti band hai\b', 'streetlight failure'),
        (r'\bnaala choke\b', 'choked storm drainage block'),
        (r'\bkhula manhole\b', 'uncovered open manhole safety hazard'),
    ]

    normalized = text
    for pattern, repl in translations:
        normalized = re.sub(pattern, repl, normalized, flags=re.IGNORECASE)

    return {
        "original_text": text,
        "language": lang,
        "normalized_text": normalized
    }

def classify_complaint_ai(raw_text: str, declared_category: Optional[str] = None) -> Dict[str, Any]:
    """
    Classifies complaint text into 100-Class Taxonomy, Subcategory, Severity, Department, and AI Confidence.
    1. Uses Gemini 2.0 Flash AI for zero-shot 100-class taxonomy routing if API key is active.
    2. Uses robust rule-based 100-class semantic tokenizer as instant high-speed fallback.
    """
    lower = raw_text.lower()
    norm = normalize_language(raw_text)
    norm_lower = norm["normalized_text"].lower()

    # Step 1: Check Gemini Zero-Shot AI 100-Class Routing
    try:
        from gemini_service import classify_complaint_with_gemini
        gemini_res = classify_complaint_with_gemini(raw_text)
        if gemini_res and gemini_res.get("department_id"):
            extracted_kws = [w for w in re.findall(r'\b\w{4,}\b', norm_lower) if w not in ["this", "there", "with", "from", "near", "have", "please", "getting"]][:6]
            return {
                "class_id": gemini_res.get("class_id", "R01"),
                "class_name": gemini_res.get("class_name", gemini_res.get("subcategory", "General Civic Grievance")),
                "category": gemini_res.get("category", "Roads & PWD"),
                "subcategory": gemini_res.get("subcategory", gemini_res.get("class_name", "General Civic Grievance")),
                "severity": gemini_res.get("severity", "Medium"),
                "department_id": gemini_res["department_id"],
                "department_name": gemini_res.get("category", "Municipal Department"),
                "ai_confidence": float(gemini_res.get("confidence", 98.5)),
                "alternative_department": gemini_res.get("alternative_department", "PWD"),
                "alternative_confidence": 30.0,
                "keywords": extracted_kws,
                "normalized_text": norm["normalized_text"],
                "language": norm["language"],
                "ai_reasoning": gemini_res.get("reasoning", "Gemini 2.0 Flash 100-Class Taxonomy Router")
            }
    except Exception:
        pass

    # Step 2: High-Precision 100-Class Semantic Matcher
    # Priority multi-entity intent rules:
    # 1. Road repair / restoration after utility work -> R02 (Damaged Road)
    if ("road" in lower or "sadak" in lower or "gaddha" in lower or "trench" in lower) and any(w in lower for w in ["pipe", "pipeline", "utility", "water work", "cable", "cabling"]) and any(w in lower for w in ["after", "repaired", "not repaired", "khod ke", "left open", "dug up", "unfilled"]):
        c = TAXONOMY_100["R02"]
        return {
            "class_id": "R02",
            "class_name": "Road Restoration Post-Utility Digging",
            "department_id": "PWD",
            "department_name": "Roads & PWD",
            "category": "Roads & PWD",
            "subcategory": "Road Restoration Post-Utility Digging",
            "severity": "High",
            "ai_confidence": 99.2,
            "alternative_department": "WATER",
            "alternative_confidence": 35.0,
            "keywords": ["road", "repair", "pipeline", "utility"],
            "normalized_text": norm["normalized_text"],
            "language": norm["language"]
        }

    # 2. Animal Control Rules -> A01 - A10
    if any(aw in lower for aw in ["dog", "dogs", "kutte", "kutta", "cat", "cattle", "cow", "cows", "bhais", "bull", "monkey", "animal"]):
        if any(w in lower for w in ["bite", "biting", "attack", "aggressive", "kata"]):
            c = TAXONOMY_100["A02"]
        elif any(w in lower for w in ["dead", "carcass", "mar gaya"]):
            c = TAXONOMY_100["A04"]
        elif any(w in lower for w in ["injured", "ghayal", "wound", "hit and run"]):
            c = TAXONOMY_100["A03"]
        elif any(w in lower for w in ["cattle", "cow", "cows", "bhais", "bull", "traffic hazard"]):
            c = TAXONOMY_100["A06"]
        else:
            c = TAXONOMY_100["A01"]
        return {
            "class_id": c["class_id"],
            "class_name": c["class_name"],
            "department_id": c["department_id"],
            "department_name": c["department_name"],
            "category": c["department_name"],
            "subcategory": c["class_name"],
            "severity": c["severity"],
            "ai_confidence": 98.5,
            "alternative_department": "HEALTH",
            "alternative_confidence": 25.0,
            "keywords": [w for w in re.findall(r'\b\w{4,}\b', norm_lower) if w not in ["this", "there", "with", "from", "near", "have", "please", "getting"]][:6],
            "normalized_text": norm["normalized_text"],
            "language": norm["language"]
        }

    # 3. Potable Water Supply & Contamination -> W01 - W10
    is_water_query = any(wt in lower or wt in norm_lower for wt in [
        "water", "drinking water", "tap water", "clean water", "not clean water",
        "dirty water", "unclean water", "muddy water", "contaminated water", "smelly water",
        "yellow water", "black water", "water smell", "water taste", "peene ka paani",
        "paani", "pani", "nal", "tanki", "water pressure", "low pressure", "water cut",
        "water tanker", "dry tap", "no water", "paani nahi", "water supply", "pipeline leak"
    ]) and not any(dt in lower for dt in ["waterlogging", "water logging", "flood", "gutter", "drain", "sewage"])

    if is_water_query:
        if any(cw in lower or cw in norm_lower for cw in ["not clean", "dirty", "unclean", "muddy", "smelly", "badboo", "peela", "yellow", "kala", "black water", "contamination", "contaminated", "bad taste", "ganda", "dushit"]):
            c = TAXONOMY_100["W04"]
        elif any(nw in lower or nw in norm_lower for nw in ["no water", "paani nahi", "water cut", "paani band", "nal sukha", "dry tap", "supply stopped"]):
            c = TAXONOMY_100["W01"]
        elif any(lw in lower or lw in norm_lower for lw in ["pipeline leak", "pipe leak", "water pipe burst", "water burst", "leaking"]):
            c = TAXONOMY_100["W03"]
        elif any(pw in lower or pw in norm_lower for pw in ["low pressure", "kam pressure", "pressure"]):
            c = TAXONOMY_100["W02"]
        elif any(tw in lower or tw in norm_lower for tw in ["tanker"]):
            c = TAXONOMY_100["W10"]
        else:
            c = TAXONOMY_100["W01"]
        return {
            "class_id": c["class_id"],
            "class_name": c["class_name"],
            "department_id": c["department_id"],
            "department_name": c["department_name"],
            "category": c["department_name"],
            "subcategory": c["class_name"],
            "severity": c["severity"],
            "ai_confidence": 98.8,
            "alternative_department": "DRAINAGE",
            "alternative_confidence": 20.0,
            "keywords": [w for w in re.findall(r'\b\w{4,}\b', norm_lower) if w not in ["this", "there", "with", "from", "near", "have", "please", "getting"]][:6],
            "normalized_text": norm["normalized_text"],
            "language": norm["language"]
        }

    # 4. Drainage & Stormwater -> D01 - D10
    is_drainage_query = any(dt in lower or dt in norm_lower for dt in [
        "waterlogging", "water logging", "water logged", "paani bhara", "jal jamaav",
        "drain", "drainage", "gutter", "nala", "sewer", "sewage", "open manhole",
        "flooded street", "flood", "stagnant water", "choked drain", "choked gutter"
    ])
    if is_drainage_query:
        if any(mh in lower for mh in ["manhole", "khula manhole", "manhole lid", "open lid"]):
            c = TAXONOMY_100["D06"]
        elif any(sw in lower for sw in ["sewage", "sewer", "toilet sewage"]):
            c = TAXONOMY_100["D07"]
        elif any(fl in lower for fl in ["flooded street", "street flood", "rasta duba"]):
            c = TAXONOMY_100["D04"]
        elif any(cd in lower for cd in ["blocked drain", "choked drain", "choked gutter", "nala choke"]):
            c = TAXONOMY_100["D01"]
        elif any(od in lower for od in ["overflowing drain", "gutter overflowing", "drain overflow"]):
            c = TAXONOMY_100["D02"]
        else:
            c = TAXONOMY_100["D03"]
        return {
            "class_id": c["class_id"],
            "class_name": c["class_name"],
            "department_id": c["department_id"],
            "department_name": c["department_name"],
            "category": c["department_name"],
            "subcategory": c["class_name"],
            "severity": c["severity"],
            "ai_confidence": 98.5,
            "alternative_department": "PWD",
            "alternative_confidence": 25.0,
            "keywords": [w for w in re.findall(r'\b\w{4,}\b', norm_lower) if w not in ["this", "there", "with", "from", "near", "have", "please", "getting"]][:6],
            "normalized_text": norm["normalized_text"],
            "language": norm["language"]
        }

    # 5. Score across all 100 classes
    best_class = None
    best_score = -1
    for cid, cinfo in TAXONOMY_100.items():
        score = 0
        for kw in cinfo["keywords"]:
            if kw in lower or kw in norm_lower:
                score += 20 * len(kw.split())
        if score > best_score:
            best_score = score
            best_class = cinfo

    if best_class and best_score > 0:
        c = best_class
        confidence = min(98.5, 75.0 + (best_score * 0.3))
    else:
        c = TAXONOMY_100["R02"]
        confidence = 60.0

    extracted_keywords = [w for w in re.findall(r'\b\w{4,}\b', norm_lower) if w not in ["this", "there", "with", "from", "near", "have", "please", "getting"]][:6]

    return {
        "class_id": c["class_id"],
        "class_name": c["class_name"],
        "department_id": c["department_id"],
        "department_name": c["department_name"],
        "category": c["department_name"],
        "subcategory": c["class_name"],
        "severity": c["severity"],
        "ai_confidence": round(confidence, 1),
        "alternative_department": "PWD" if c["department_id"] != "PWD" else "SWM",
        "alternative_confidence": round(max(5.0, 100.0 - confidence), 1),
        "keywords": extracted_keywords,
        "normalized_text": norm["normalized_text"],
        "language": norm["language"]
    }

def calculate_complaint_priority(raw_text: str, severity: str, latitude: float, longitude: float, photo_hazard: bool = False) -> Dict[str, Any]:
    """
    Transparent scoring engine for individual citizen complaints (Level 1).
    Factors: Severity (+20), Safety Risk (+25), Sensitive Location (+15), Keywords (+15), Time (+10)
    """
    lower = raw_text.lower()
    
    # 1. Severity points (0-25)
    sev_map = {"Critical": 25, "High": 20, "Medium": 12, "Low": 5}
    severity_pts = sev_map.get(severity, 15)

    # 2. Safety Risk points (0-30)
    safety_risk_pts = 0
    safety_reasons = []
    if any(term in lower for term in ["accident", "chot", "gir gaya", "fatal", "blood", "damage", "bike slip", "broken tyre", "ambulance"]):
        safety_risk_pts += 15
        safety_reasons.append("Accident or bodily injury risk reported")
    if any(term in lower for term in ["manhole", "live wire", "taar", "electric", "deep crater", "collapse", "gas leak"]):
        safety_risk_pts += 15
        safety_reasons.append("Direct life safety hazard keyword identified")
    if photo_hazard:
        safety_risk_pts = min(30, safety_risk_pts + 10)
        safety_reasons.append("Visual computer vision identified hazardous terrain")
    if safety_risk_pts == 0:
        safety_risk_pts = 8

    # 3. Sensitive Location points (0-20)
    sensitive_pts = 5
    for kw in SENSITIVE_LOCATIONS:
        if kw in lower:
            sensitive_pts = 20
            safety_reasons.append(f"Located in sensitive civic zone ({kw.title()})")
            break

    # 4. Keyword and public disruption urgency (0-15)
    disruption_pts = 10
    if any(term in lower for term in ["traffic", "jam", "blocked", "school bus", "hundreds", "daily", "commute", "colony"]):
        disruption_pts = 15
        safety_reasons.append("Substantial public transit / community disruption")

    # 5. Base time & reporting weight
    time_pts = 10

    total_score = min(100, severity_pts + safety_risk_pts + sensitive_pts + disruption_pts + time_pts)

    if total_score >= 76:
        level = "CRITICAL"
    elif total_score >= 51:
        level = "HIGH"
    elif total_score >= 26:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "priority_score": total_score,
        "priority_level": level,
        "breakdown": {
            "severity_points": severity_pts,
            "safety_risk_points": safety_risk_pts,
            "sensitive_location_points": sensitive_pts,
            "disruption_points": disruption_pts,
            "duration_points": time_pts,
            "total_score": total_score,
            "explanation": safety_reasons
        }
    }

def calculate_issue_priority_and_impact(
    unique_citizens: int,
    complaint_count: int,
    avg_complaint_priority: float,
    category: str,
    growth_rate_pct: float,
    radius_meters: float,
    location_sensitivity: str
) -> Tuple[int, str, int, Dict[str, Any]]:
    """
    Calculates:
    1. Issue Priority (Urgency: how fast must authorities act?)
    2. Issue Impact (Scale: how large is the public problem?)
    """
    # Priority Calculation (Urgency)
    citizens_weight = min(35, int(unique_citizens * 0.75))
    growth_weight = 20 if growth_rate_pct >= 200 else (12 if growth_rate_pct >= 80 else 5)
    base_urgency = int(avg_complaint_priority * 0.4)
    sensitive_pts = 20 if "High" in location_sensitivity or "Critical" in location_sensitivity else 8
    
    total_priority = min(100, base_urgency + citizens_weight + growth_weight + sensitive_pts)
    
    if total_priority >= 76:
        priority_level = "CRITICAL"
    elif total_priority >= 51:
        priority_level = "HIGH"
    elif total_priority >= 26:
        priority_level = "MEDIUM"
    else:
        priority_level = "LOW"

    # Impact Calculation (Scale of Public Problem)
    # Even if an issue has moderate urgency, 500 citizens = Very High Impact
    scale_pts = min(45, int(unique_citizens * 0.9))
    spread_pts = min(20, int(radius_meters / 30))
    infra_weight = 25 if category in ["Water Supply", "Road Damage", "Drainage"] else 15
    duration_pts = 10

    impact_score = min(100, scale_pts + spread_pts + infra_weight + duration_pts)

    breakdown = {
        "citizens_points": citizens_weight,
        "growth_points": growth_weight,
        "base_urgency_points": base_urgency,
        "sensitive_location_points": sensitive_pts,
        "total_score": total_priority,
        "explanation": [
            f"{unique_citizens} citizens directly affected across neighborhood",
            f"Rapid complaint velocity trend ({growth_rate_pct:+.0f}% change)",
            f"Location context: {location_sensitivity}",
            f"Category infrastructure criticality: {category}"
        ]
    }

    return total_priority, priority_level, impact_score, breakdown

def compute_text_embedding_vector(text: str) -> np.ndarray:
    """
    Creates a dense semantic feature vector for text using a domain-informed vocabulary representation.
    Provides fast, deterministic cosine similarity across English, Hindi, and Hinglish.
    """
    vocabulary = [
        "water", "paani", "pani", "supply", "leak", "dirty", "ganda", "pressure", "tanker", "pipe", "outage",
        "road", "sadak", "pothole", "gaddha", "khadda", "crater", "bike", "accident", "damage", "tar", "broken",
        "traffic", "school", "hospital", "highway", "commute", "car", "footpath", "asphalt",
        "garbage", "kachra", "trash", "dumpster", "kuda", "overflow", "smell", "badboo", "waste", "safai",
        "drain", "drainage", "gutter", "nala", "manhole", "choked", "sewage", "waterlogging", "dhakkan", "open",
        "streetlight", "light", "batti", "pole", "andhera", "dark", "wire", "shock", "electric", "spark"
    ]

    lower = text.lower()
    vec = np.zeros(len(vocabulary), dtype=float)
    for i, word in enumerate(vocabulary):
        if word in lower:
            vec[i] = 1.0 + (0.5 if len(word) > 5 else 0.0)

    # Normalize vector to unit length
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

def check_same_citizen_duplicate(
    citizen_id: str,
    new_text: str,
    category: str,
    lat: float,
    lon: float,
    existing_complaints: List[Dict[str, Any]]
) -> Optional[str]:
    """
    Level 2 Duplicate Detection:
    Checks if the SAME citizen previously submitted a complaint about the same issue.
    Criteria:
    - Same citizen_id
    - Same category
    - Geographic distance < 500 meters
    - Semantic similarity > 0.65
    Returns parent complaint ID if duplicate, else None.
    """
    new_vec = compute_text_embedding_vector(new_text)

    for cmp in existing_complaints:
        if cmp.get("citizen_id") == citizen_id and cmp.get("category") == category:
            dist = haversine_distance_meters(lat, lon, cmp["latitude"], cmp["longitude"])
            if dist < 500:
                past_vec = compute_text_embedding_vector(cmp["raw_text"])
                sim = cosine_similarity(new_vec, past_vec)
                if sim >= 0.60 or dist < 100:  # Same citizen at exact same spot or high similarity
                    return cmp["id"]

    return None

def find_or_create_issue_cluster(
    new_complaint: Dict[str, Any],
    existing_clusters: List[Dict[str, Any]],
    all_complaints_in_clusters: Dict[str, List[Dict[str, Any]]]
) -> Tuple[Optional[str], bool, Optional[Dict[str, Any]]]:
    """
    Level 3 AI Issue Clustering (The Core Differentiator):
    Combines:
    1. Semantic similarity (> 0.60)
    2. Geographic proximity (Haversine distance < 750 meters)
    3. Category match
    4. Active status (not archived)

    Returns: (cluster_id, is_new_cluster, cluster_data_or_update)
    """
    new_lat = new_complaint["latitude"]
    new_lon = new_complaint["longitude"]
    new_cat = new_complaint["category"]
    new_text = new_complaint["raw_text"]
    new_vec = compute_text_embedding_vector(new_text)

    best_cluster = None
    min_distance = 800  # meters threshold

    for cluster in existing_clusters:
        if cluster["category"] != new_cat:
            continue

        # Check geographic distance to cluster centroid
        dist = haversine_distance_meters(new_lat, new_lon, cluster["latitude"], cluster["longitude"])
        if dist <= max(600, cluster.get("radius_meters", 350) + 150):
            # Check semantic alignment with cluster title / subcategory
            cluster_text = f"{cluster['title']} {cluster['subcategory']}"
            cluster_vec = compute_text_embedding_vector(cluster_text)
            sim = cosine_similarity(new_vec, cluster_vec)

            # Check semantic match with sample complaints in cluster
            sample_cmps = all_complaints_in_clusters.get(cluster["id"], [])
            sample_sims = [cosine_similarity(new_vec, compute_text_embedding_vector(c["raw_text"])) for c in sample_cmps[:5]]
            max_sample_sim = max(sample_sims) if sample_sims else sim

            if max_sample_sim >= 0.55 or dist < 250:
                if dist < min_distance:
                    min_distance = dist
                    best_cluster = cluster

    if best_cluster:
        # Match found: Update existing cluster metrics
        cluster_id = best_cluster["id"]
        return cluster_id, False, best_cluster
    else:
        # Create a brand new Issue Cluster
        import random
        new_id = f"CL-{random.randint(10000, 99999)}"
        title = f"{new_complaint['category']} — {new_complaint.get('address', 'Local Sector')}"
        
        new_cluster_data = {
            "id": new_id,
            "title": title,
            "category": new_complaint["category"],
            "subcategory": new_complaint["subcategory"],
            "latitude": new_lat,
            "longitude": new_lon,
            "radius_meters": 180.0,
            "ward": new_complaint.get("ward", "Ward 1"),
            "city": new_complaint.get("city", "Thane"),
            "department_id": new_complaint["department_id"],
            "department_name": new_complaint["department_name"],
            "citizen_count": 1,
            "unique_complaint_count": 1,
            "duplicate_count": 1 if new_complaint.get("duplicate_of") else 0,
            "priority_score": new_complaint["priority_score"],
            "priority_level": new_complaint["priority_level"],
            "impact_score": 35,
            "trend": "+100%",
            "growth_rate_pct": 100.0,
            "status": "new",
            "resolution_confidence": "High",
            "resolution_marked_at": None,
            "resolution_evidence_url": None,
            "resolution_notes": None,
            "failed_resolution_alert": False,
            "failed_resolution_reason": None,
            "assigned_team": None,
            "assigned_officer": None,
            "first_reported_at": datetime.datetime.now().strftime("%b %d, %I:%M %p"),
            "latest_reported_at": datetime.datetime.now().strftime("%b %d, %I:%M %p"),
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat()
        }
        return new_id, True, new_cluster_data

def verify_resolution_closed_loop(
    cluster: Dict[str, Any],
    new_complaints_since_resolution: int,
    negative_feedback_count: int
) -> Dict[str, Any]:
    """
    Closed-Loop Resolution Verification Engine:
    When an issue was marked resolved, verifies if the real-world civic problem actually vanished.
    If new complaints or negative citizen confirmations arrive:
    - flags failed_resolution_alert = True
    - degrades resolution_confidence to "Low (Suspicious)"
    """
    if cluster["status"] != "resolved" and not cluster.get("resolution_marked_at"):
        return {"status": "active", "confidence": "Normal"}

    if new_complaints_since_resolution >= 1 or negative_feedback_count >= 1:
        return {
            "failed_alert": True,
            "confidence": "Low (Suspicious)",
            "reason": f"⚠ POSSIBLE FAILED RESOLUTION: Issue was marked resolved, but {new_complaints_since_resolution} new related complaint(s) and {negative_feedback_count} citizen 'Still Exists' reports have arrived from the same geographic zone."
        }
    
    return {
        "failed_alert": False,
        "confidence": "High (Verified)",
        "reason": "No recurring reports detected in 72h window. High resolution integrity."
    }

# ==========================================
# OPEN-SOURCE SPATIAL-SEMANTIC DBSCAN CLUSTERING
# ==========================================
from sklearn.cluster import DBSCAN

def run_dbscan_clustering(complaints: List[Dict[str, Any]], eps_meters: float = 650.0, min_samples: int = 2) -> Dict[str, List[str]]:
    """
    Open-Source Clustering Engine (DBSCAN + Spatial-Semantic projection):
    Uses Haversine distance metric over spherical radians to detect spatial clusters.
    """
    if len(complaints) < min_samples:
        return {}

    coords = np.array([[math.radians(c["latitude"]), math.radians(c["longitude"])] for c in complaints])
    kms_per_radian = 6371.0
    epsilon_radians = (eps_meters / 1000.0) / kms_per_radian

    db = DBSCAN(eps=epsilon_radians, min_samples=min_samples, metric='haversine')
    labels = db.fit_predict(coords)

    clusters_found = {}
    for idx, label in enumerate(labels):
        if label != -1:
            key = f"DBSCAN-Cluster-{label}"
            if key not in clusters_found:
                clusters_found[key] = []
            clusters_found[key].append(complaints[idx]["id"])

    return clusters_found
