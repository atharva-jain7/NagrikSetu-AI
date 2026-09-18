import io
import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_cluster_pdf_report(cluster: Dict[str, Any], complaints: List[Dict[str, Any]]) -> bytes:
    """
    Generates a professional downloadable PDF incident & intelligence report
    for a civic issue cluster using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        fontName='Helvetica'
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        fontName='Helvetica'
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )

    elements = []

    # Header Banner
    elements.append(Paragraph("CIVICPULSE AI — MUNICIPAL GRIEVANCE INTELLIGENCE SYSTEM", subtitle_style))
    elements.append(Paragraph(f"CIVIC ISSUE INCIDENT INTELLIGENCE REPORT: {cluster['id']}", title_style))
    elements.append(Paragraph(f"Generated on {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')} | Jurisdiction: Thane Municipal Corporation", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceAfter=12))

    # Core Cluster Summary Table
    is_critical = cluster.get('priority_level') == 'CRITICAL'
    status_color = '#dc2626' if is_critical else '#d97706'
    
    summary_data = [
        [
            Paragraph("<b>Issue Title:</b>", bold_label),
            Paragraph(str(cluster.get('title')), body_style),
            Paragraph("<b>Cluster ID:</b>", bold_label),
            Paragraph(str(cluster.get('id')), bold_label)
        ],
        [
            Paragraph("<b>Category:</b>", bold_label),
            Paragraph(f"{cluster.get('category')} ({cluster.get('subcategory')})", body_style),
            Paragraph("<b>Responsible Dept:</b>", bold_label),
            Paragraph(str(cluster.get('department_name', cluster.get('department_id'))), body_style)
        ],
        [
            Paragraph("<b>Location / Ward:</b>", bold_label),
            Paragraph(f"{cluster.get('ward')}, {cluster.get('city')}", body_style),
            Paragraph("<b>Coordinates:</b>", bold_label),
            Paragraph(f"{cluster.get('latitude', 0):.4f}, {cluster.get('longitude', 0):.4f} (r={int(cluster.get('radius_meters', 0))}m)", body_style)
        ],
        [
            Paragraph("<b>Citizens Affected:</b>", bold_label),
            Paragraph(f"<b>{cluster.get('citizen_count', 0)} Citizens</b> ({cluster.get('unique_complaint_count', 0)} reports)", bold_label),
            Paragraph("<b>Surge Trend:</b>", bold_label),
            Paragraph(f"<font color='#dc2626'><b>{cluster.get('trend')}</b></font>", bold_label)
        ],
        [
            Paragraph("<b>Priority Urgency:</b>", bold_label),
            Paragraph(f"<font color='{status_color}'><b>{cluster.get('priority_level')} ({cluster.get('priority_score')}/100)</b></font>", bold_label),
            Paragraph("<b>Public Impact Score:</b>", bold_label),
            Paragraph(f"<b>{cluster.get('impact_score')}/100</b>", bold_label)
        ],
        [
            Paragraph("<b>Current Status:</b>", bold_label),
            Paragraph(f"<b>{str(cluster.get('status', '')).upper()}</b>", bold_label),
            Paragraph("<b>Assigned Team:</b>", bold_label),
            Paragraph(f"{cluster.get('assigned_team') or 'Unassigned'} ({cluster.get('assigned_officer') or 'N/A'})", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[110, 160, 110, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # Closed-Loop Resolution Verification Section
    elements.append(Paragraph("Closed-Loop Resolution Verification Audit", section_heading))
    if cluster.get('failed_resolution_alert'):
        res_text = f"<font color='#b91c1c'><b>ALERT: POSSIBLE FAILED RESOLUTION DETECTED</b></font><br/>{cluster.get('failed_resolution_reason') or 'New reports arrived post-resolution.'}<br/><b>Resolution Confidence:</b> Low (Suspicious)"
        res_bg = colors.HexColor('#fef2f2')
        res_border = colors.HexColor('#f87171')
    else:
        res_text = f"<b>Resolution Confidence:</b> {cluster.get('resolution_confidence', 'High')}<br/>No anomalous recurring reports detected within 72 hours post-resolution. Real-world integrity verified."
        res_bg = colors.HexColor('#f0fdf4')
        res_border = colors.HexColor('#86efac')

    res_table = Table([[Paragraph(res_text, body_style)]], colWidths=[530])
    res_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), res_bg),
        ('BOX', (0, 0), (-1, -1), 1, res_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(res_table)
    elements.append(Spacer(1, 14))

    # Priority Explainability Factors
    elements.append(Paragraph("AI Intelligence: Contributing Priority Factors", section_heading))
    bkd = cluster.get('priority_breakdown') or {}
    explanations = bkd.get('explanation', [
        f"{cluster.get('citizen_count', 0)} citizens directly affected in municipal ward",
        f"Complaint surge trend: {cluster.get('trend')}",
        f"Category criticality: {cluster.get('category')}"
    ])
    factor_items = "<br/>".join([f"• <b>{exp}</b>" for exp in explanations])
    elements.append(Paragraph(factor_items, body_style))
    elements.append(Spacer(1, 14))

    # Supporting Citizen Complaints Table
    elements.append(Paragraph(f"Supporting Citizen Evidence Reports ({len(complaints)} Ingested)", section_heading))
    
    table_rows = [
        [
            Paragraph("<b>ID</b>", bold_label),
            Paragraph("<b>Citizen</b>", bold_label),
            Paragraph("<b>Grievance Description (Original & Normalized)</b>", bold_label),
            Paragraph("<b>Severity</b>", bold_label),
            Paragraph("<b>Date</b>", bold_label)
        ]
    ]

    for c in complaints[:12]:  # Show top reports
        is_dup = " (Duplicate)" if c.get('duplicate_of') else ""
        desc = f"\"{c.get('raw_text', '')}\"{is_dup}<br/><font color='#475569'><i>Norm: {c.get('normalized_text', '')}</i></font>"
        table_rows.append([
            Paragraph(c.get('id', ''), bold_label),
            Paragraph(c.get('citizen_name', ''), body_style),
            Paragraph(desc, body_style),
            Paragraph(c.get('severity', 'Medium'), body_style),
            Paragraph(c.get('created_at', '')[:10], body_style)
        ])

    evidence_table = Table(table_rows, colWidths=[65, 85, 260, 60, 60])
    evidence_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(evidence_table)

    # Footer Signoff
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
    elements.append(Paragraph("This document is an automated municipal evidence artifact generated by CivicPulse AI. Preserved for departmental accountability and public grievance verification audits.", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
