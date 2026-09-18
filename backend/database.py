import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "civicpulse.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create Departments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        sla_compliance_pct REAL DEFAULT 92.0
    );
    """)

    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        mobile TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL, -- citizen, admin, officer
        department_id TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Create Issue Clusters table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issue_clusters (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius_meters REAL NOT NULL,
        ward TEXT NOT NULL,
        city TEXT NOT NULL,
        department_id TEXT NOT NULL,
        department_name TEXT NOT NULL,
        citizen_count INTEGER DEFAULT 1,
        unique_complaint_count INTEGER DEFAULT 1,
        duplicate_count INTEGER DEFAULT 0,
        priority_score INTEGER DEFAULT 50,
        priority_level TEXT DEFAULT 'MEDIUM',
        priority_breakdown TEXT,
        impact_score INTEGER DEFAULT 50,
        trend TEXT DEFAULT '+0%',
        growth_rate_pct REAL DEFAULT 0.0,
        status TEXT DEFAULT 'new', -- new, acknowledged, in_progress, resolved, reopened
        resolution_confidence TEXT DEFAULT 'High',
        resolution_marked_at TEXT,
        resolution_evidence_url TEXT,
        resolution_notes TEXT,
        failed_resolution_alert INTEGER DEFAULT 0,
        failed_resolution_reason TEXT,
        assigned_team TEXT,
        assigned_officer TEXT,
        first_reported_at TEXT NOT NULL,
        latest_reported_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Create Complaints table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        citizen_id TEXT NOT NULL,
        citizen_name TEXT NOT NULL,
        citizen_email TEXT DEFAULT 'citizen@example.com',
        raw_text TEXT NOT NULL,
        language TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        severity TEXT NOT NULL,
        priority_score INTEGER NOT NULL,
        priority_level TEXT NOT NULL,
        department_id TEXT NOT NULL,
        department_name TEXT NOT NULL,
        ai_confidence REAL NOT NULL,
        alternative_department TEXT,
        alternative_confidence REAL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT NOT NULL,
        ward TEXT NOT NULL,
        city TEXT NOT NULL,
        photo_url TEXT,
        photo_analysis TEXT,
        issue_cluster_id TEXT,
        duplicate_of TEXT,
        status TEXT DEFAULT 'new',
        citizen_feedback TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (issue_cluster_id) REFERENCES issue_clusters (id)
    );
    """)

    try:
        cursor.execute("ALTER TABLE complaints ADD COLUMN citizen_email TEXT DEFAULT 'citizen@example.com'")
    except Exception:
        pass

    # Create Assignments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_cluster_id TEXT NOT NULL,
        department_id TEXT NOT NULL,
        team TEXT NOT NULL,
        officer TEXT NOT NULL,
        notes TEXT,
        assigned_at TEXT NOT NULL
    );
    """)

    # Create Status History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_cluster_id TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        notes TEXT,
        evidence_photo_url TEXT
    );
    """)

    # Create Reroute History table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reroute_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_cluster_id TEXT NOT NULL,
        from_department TEXT NOT NULL,
        to_department TEXT NOT NULL,
        reason TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    # Seed/Sync all 8 Municipal Departments
    from ai_engine import DEPARTMENTS
    for d in DEPARTMENTS:
        cursor.execute("""
            INSERT OR REPLACE INTO departments (id, code, name, jurisdiction, contact_email, sla_compliance_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (d["id"], d["code"], d["name"], d["jurisdiction"], d["contact_email"], 94.0))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully with 8 municipal departments.")
