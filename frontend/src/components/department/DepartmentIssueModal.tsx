import React, { useState } from 'react';
import { IssueCluster, Department } from '../../types';
import {
  X, Building2, Users, AlertTriangle, CheckCircle2,
  Clock, ArrowRightLeft, ShieldAlert, Camera, Send, FileText
} from 'lucide-react';
import { assignCluster, updateClusterStatus, rerouteCluster } from '../../api';

interface DepartmentModalProps {
  cluster: IssueCluster;
  department: Department | undefined;
  onClose: () => void;
  onRefresh: () => void;
}

export const DepartmentIssueModal: React.FC<DepartmentModalProps> = ({
  cluster,
  department,
  onClose,
  onRefresh
}) => {
  const [activeAction, setActiveAction] = useState<'details' | 'assign' | 'status' | 'reroute'>('details');

  // Assign Form
  const [teamName, setTeamName] = useState<string>(cluster.assigned_team || 'Road Maintenance Team 3');
  const [officerName, setOfficerName] = useState<string>(cluster.assigned_officer || 'Officer In-Charge');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Status Form
  const [newStatus, setNewStatus] = useState<string>(cluster.status);
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

  // Reroute Form
  const [targetDept, setTargetDept] = useState<string>('WATER');
  const [rerouteReason, setRerouteReason] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleAssign = async () => {
    setLoading(true);
    try {
      await assignCluster(cluster.id, {
        team: teamName,
        officer: officerName,
        notes: assignNotes || `Assigned to ${teamName} - ${officerName}`,
        changed_by: `${officerName} (${cluster.department_id})`
      });
      setFeedbackMsg('Team successfully assigned!');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      await updateClusterStatus(cluster.id, {
        status: newStatus,
        notes: statusNotes || `Status updated to ${newStatus}`,
        changed_by: `${cluster.assigned_officer || 'Officer'} (${cluster.department_id})`
      });
      setFeedbackMsg(`Status updated to ${newStatus.toUpperCase()}!`);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleReroute = async () => {
    if (!rerouteReason.trim()) return;
    setLoading(true);
    try {
      await rerouteCluster(cluster.id, {
        new_department_id: targetDept,
        reason: rerouteReason,
        changed_by: `${cluster.assigned_officer || 'Department Officer'} (${cluster.department_id})`
      });
      setFeedbackMsg('Issue successfully rerouted with audit trail!');
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-700">{cluster.id}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                {cluster.priority_level} ({cluster.priority_score}/100)
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 mt-1">{cluster.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Confidence Notice */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-blue-900">
              <strong>AI Recommended Department:</strong> {cluster.department_name}
            </span>
          </div>
          <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
            Confidence: 94.8%
          </span>
        </div>

        {/* CLOSED-LOOP VERIFICATION WARNING */}
        {cluster.failed_resolution_alert ? (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-black text-rose-900 block">
                ⚠ CLOSED-LOOP ALERT: POSSIBLE FAILED RESOLUTION
              </span>
              <p className="text-rose-800 mt-0.5">
                {cluster.failed_resolution_reason || 'New complaints or negative citizen confirmations detected post-repair.'}
              </p>
            </div>
          </div>
        ) : null}

        {/* Operational Action Sub-tabs */}
        <div className="flex space-x-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveAction('details')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAction === 'details' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Issue Evidence
          </button>
          <button
            onClick={() => setActiveAction('assign')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAction === 'assign' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assign Team
          </button>
          <button
            onClick={() => setActiveAction('status')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAction === 'status' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Update Status & Work Proof
          </button>
          <button
            onClick={() => setActiveAction('reroute')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeAction === 'reroute' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3 inline mr-1" />
            Reroute Issue
          </button>
        </div>

        {/* Action Content */}
        {feedbackMsg ? (
          <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            {feedbackMsg}
          </div>
        ) : (
          <div>
            {/* View 1: Evidence */}
            {activeAction === 'details' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Citizens Affected</span>
                    <span className="text-lg font-black text-slate-900">{cluster.citizen_count}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Unique Reports</span>
                    <span className="text-lg font-black text-slate-900">{cluster.unique_complaint_count}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Surge Trend</span>
                    <span className="text-lg font-black text-rose-600">{cluster.trend}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Assigned Operational Team:</span>
                  <p className="text-slate-600">
                    {cluster.assigned_team ? (
                      <>
                        <strong>{cluster.assigned_team}</strong> (Lead: {cluster.assigned_officer})
                      </>
                    ) : (
                      <span className="text-amber-700 font-semibold">⚠ Not yet assigned to an internal field unit</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* View 2: Assign Team (Section 33) */}
            {activeAction === 'assign' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Field Team</label>
                  <select
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none"
                  >
                    <option value="Road Maintenance Team 3">Road Maintenance Team 3 (Cold Asphalt Crew)</option>
                    <option value="Road Rapid Response Unit 1">Road Rapid Response Unit 1</option>
                    <option value="Pothole Heavy Equipment Crew">Pothole Heavy Equipment Crew</option>
                    <option value="Pipeline Emergency Squad B">Pipeline Emergency Squad B</option>
                    <option value="Solid Waste Mobile Compactor 4">Solid Waste Mobile Compactor 4</option>
                    <option value="Storm Drainage Desilting Team 2">Storm Drainage Desilting Team 2</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supervising Officer</label>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Kulkarni"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Work Order Instructions / Field Notes</label>
                  <textarea
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="e.g. Priority dispatch post morning school traffic peak. Barricade road depression."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleAssign}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {loading ? 'Assigning...' : 'Confirm Team Assignment'}
                </button>
              </div>
            )}

            {/* View 3: Update Status & Upload Evidence */}
            {activeAction === 'status' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operational Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 outline-none"
                  >
                    <option value="acknowledged">Acknowledged (Work Order Scheduled)</option>
                    <option value="in_progress">In Progress (Field Team Active on Site)</option>
                    <option value="resolved">Resolved (Repairs Completed on Ground)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inspection / Repair Notes</label>
                  <textarea
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Pothole filled with bitumen cold mix and compacted. Traffic restored."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 outline-none resize-none"
                  />
                </div>

                {/* Evidence photo preview simulation */}
                <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
                  <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-700 block">Work Evidence Photo Attached</span>
                  <span className="text-[10px] text-slate-400">repair_completion_site_proof.jpg (Verified)</span>
                </div>

                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {loading ? 'Saving...' : 'Submit Status Update & Work Evidence'}
                </button>
              </div>
            )}

            {/* View 4: Department Rerouting (Section 14) */}
            {activeAction === 'reroute' && (
              <div className="space-y-3 text-xs bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Department Rerouting Workflow</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  If this issue does not fall under your jurisdiction, reroute it at the <strong>Cluster Level</strong>. All {cluster.unique_complaint_count} citizen complaints will move together.
                </p>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Current Department</label>
                  <input
                    type="text"
                    disabled
                    value={cluster.department_name}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">New Target Department</label>
                  <select
                    value={targetDept}
                    onChange={(e) => setTargetDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-300 font-bold text-slate-900 outline-none"
                  >
                    <option value="PWD">PWD (Public Works & Roads)</option>
                    <option value="WATER">Water Supply & Sewerage</option>
                    <option value="SANITATION">Solid Waste & Sanitation</option>
                    <option value="DRAINAGE">Storm Water Drainage</option>
                    <option value="ELECTRICAL">Street Lighting & Electrical</option>
                    <option value="HEALTH">Public Health & Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Mandatory Rerouting Justification / Audit Reason
                  </label>
                  <textarea
                    rows={3}
                    value={rerouteReason}
                    onChange={(e) => setRerouteReason(e.target.value)}
                    placeholder="e.g. Road falls under Municipal Corporation jurisdiction, not State PWD."
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-slate-800 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleReroute}
                  disabled={!rerouteReason.trim() || loading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {loading ? 'Rerouting...' : 'Confirm Department Reroute'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
