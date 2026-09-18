import json
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

def post(endpoint, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=body, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def get(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    return json.loads(urllib.request.urlopen(req).read())

def test_full_pipeline():
    print("--- 1. Testing Reset Demo Data ---")
    res = post("/api/demo/reset", {})
    assert res["success"] is True
    print("Demo data reset OK.")

    print("\n--- 2. Testing Level 1 Ingestion & Language Normalization (Hinglish) ---")
    res1 = post("/api/complaints/submit", {
        "citizen_mobile": "9820123456",
        "citizen_name": "Rahul Verma",
        "raw_text": "Sadak par school ke samne bahut bada gaddha hai, bike slip ho rahi hai",
        "category": "Road Damage",
        "latitude": 19.2612,
        "longitude": 72.9734,
        "address": "Ghodbunder Road near XYZ School",
        "ward": "Ward 14"
    })
    print("Complaint 1 created:", res1["complaint_id"])
    print("AI Language:", res1["classification"]["language"])
    print("AI Normalized:", res1["classification"]["normalized_text"])
    print("Auto-Routed Dept:", res1["routed_department"])
    print("AI Confidence:", res1["confidence"], "%")
    print("Priority Level:", res1["priority"]["priority_level"])
    print("Linked Cluster:", res1["issue_cluster_id"])
    assert res1["classification"]["language"] == "hinglish"
    assert res1["routed_department"] == "Public Works Department (Roads & Bridges)"
    assert res1["issue_cluster_id"] == "RC-1042"
    print("Test 2 Passed.")

    print("\n--- 3. Testing Level 2 Same-Citizen Duplicate Detection ---")
    res2 = post("/api/complaints/submit", {
        "citizen_mobile": "9820123456", # Same mobile!
        "citizen_name": "Rahul Verma",
        "raw_text": "Same pothole still not repaired outside XYZ school!",
        "category": "Road Damage",
        "latitude": 19.2613,
        "longitude": 72.9735,
        "address": "Ghodbunder Road near XYZ School",
        "ward": "Ward 14"
    })
    print("Repeat complaint submitted:", res2["complaint_id"])
    print("Duplicate Detected Link:", res2["is_duplicate_of"])
    assert res2["is_duplicate_of"] is not None
    print("Test 3 Passed: Successfully linked as duplicate of parent complaint.")

    print("\n--- 4. Testing Level 3 Multi-Citizen Semantic Clustering ---")
    res3 = post("/api/complaints/submit", {
        "citizen_mobile": "9820987654", # Different citizen!
        "citizen_name": "Priya Sharma",
        "raw_text": "My bike was severely damaged because of the road crater near the school!",
        "category": "Road Damage",
        "latitude": 19.2614,
        "longitude": 72.9736,
        "address": "Ghodbunder Road near XYZ School",
        "ward": "Ward 14"
    })
    print("Different citizen complaint:", res3["complaint_id"])
    print("Clustered to existing issue:", res3["issue_cluster_id"])
    assert res3["issue_cluster_id"] == "RC-1042"
    assert res3["is_duplicate_of"] is None
    print("Test 4 Passed: Multiple citizens clustered into underlying issue RC-1042.")

    print("\n--- 5. Testing Department Action: Assignment & Status Update ---")
    assign_res = post("/api/clusters/RC-1042/assign", {
        "team": "Road Maintenance Team 3",
        "officer": "Er. Rajesh Kulkarni",
        "notes": "Emergency cold asphalt mix dispatch.",
        "changed_by": "Er. Rajesh Kulkarni"
    })
    assert assign_res["success"] is True

    status_res = post("/api/clusters/RC-1042/status", {
        "status": "resolved",
        "notes": "Cold mix bitumen asphalt laid by Road Maintenance Team 3. Pothole leveled.",
        "changed_by": "Er. Rajesh Kulkarni"
    })
    assert status_res["success"] is True
    print("Test 5 Passed: Cluster assigned to Team 3 and marked Resolved.")

    print("\n--- 6. Testing Closed-Loop Resolution Verification (Failed Resolution Trigger) ---")
    # New complaint arrives at same spot after resolution
    res4 = post("/api/complaints/submit", {
        "citizen_mobile": "9820555444",
        "citizen_name": "Amit Patel",
        "raw_text": "The pothole is back again after rain! Shoddy repair work outside XYZ School.",
        "category": "Road Damage",
        "latitude": 19.2613,
        "longitude": 72.9735,
        "address": "Ghodbunder Road near XYZ School",
        "ward": "Ward 14"
    })
    
    # Check cluster status now
    cluster_detail = get("/api/clusters/RC-1042")
    print("Failed Resolution Alert Active:", cluster_detail["failed_resolution_alert"])
    print("Resolution Confidence:", cluster_detail["resolution_confidence"])
    print("Alert Reason:", cluster_detail["failed_resolution_reason"].encode("ascii", "replace").decode())
    assert cluster_detail["failed_resolution_alert"] == 1
    assert "Low" in cluster_detail["resolution_confidence"]
    print("Test 6 Passed: Closed-loop Resolution Verification successfully caught recurring failure!")

    print("\n--- 7. Testing Department Rerouting with Audit Trail ---")
    reroute_res = post("/api/clusters/RC-1014/reroute", {
        "new_department_id": "HEALTH",
        "reason": "Water contamination posing immediate public health vector epidemic risk.",
        "changed_by": "Superintending Engineer"
    })
    assert reroute_res["success"] is True
    cl_after_reroute = get("/api/clusters/RC-1014")
    assert cl_after_reroute["department_id"] == "HEALTH"
    assert len(cl_after_reroute["reroutes"]) >= 1
    print("Reroute Audit Recorded:", cl_after_reroute["reroutes"][0])
    print("Test 7 Passed: Cluster-level reroute with audit trail successful.")

    print("\n=======================================================")
    print("ALL 7 CORE AI INTELLIGENCE & CLUSTERING TESTS PASSED!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_pipeline()
