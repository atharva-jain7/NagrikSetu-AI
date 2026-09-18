import React, { useState, useEffect } from 'react';
import { IssueCluster, Department, Complaint } from '../../types';
import {
  Building2, Users, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, ShieldAlert, PlusCircle, Filter, ArrowRightLeft, Sparkles,
  FileText, MapPin, Phone, Layers, ShieldCheck, AlertCircle
} from 'lucide-react';
import { DepartmentIssueModal } from './DepartmentIssueModal';

interface DepartmentDashboardProps {
  departmentId: string;
  departments: Department[];
  clusters: IssueCluster[];
  complaints?: Complaint[];
  onRefresh: () => void;
  onSelectClusterForIntelligence?: (id: string) => void;
}

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({
  departmentId,
  departments,
  clusters,
  complaints = [],
  onRefresh,
  onSelectClusterForIntelligence
}) => {
  const currentDept = departments.find((d) => d.id === departmentId);
  const [viewMode, setViewMode] = useState<'clusters' | 'complaints'>('clusters');
  const [activeQueue, setActiveQueue] = useState<'all' | 'new' | 'priority' | 'assigned' | 'in_progress' | 'sla_risk' | 'resolved'>('priority');
  const [modalCluster, setModalCluster] = useState<IssueCluster | null>(null);

  // Auto-refresh on mount and whenever department changes
  useEffect(() => {
    onRefresh();
  }, [departmentId]);

  // Robust department matching helper
  const matchesDept = (deptCode: string | undefined, categoryStr: string | undefined) => {
    if (!deptCode) return false;
    const cleanDept = deptCode.toUpperCase();
    const targetDept = departmentId.toUpperCase();
    if (cleanDept === targetDept) return true;
    if (targetDept === 'PWD' && (cleanDept === 'ROADS' || (categoryStr && categoryStr.toLowerCase().includes('road')))) return true;
    if (targetDept === 'WATER' && (cleanDept === 'HYDRAULIC' || (categoryStr && categoryStr.toLowerCase().includes('water')))) return true;
    if (targetDept === 'SWM' && (cleanDept === 'SOLID_WASTE' || (categoryStr && categoryStr.toLowerCase().includes('garbage')))) return true;
    if (targetDept === 'DRAINAGE' && (cleanDept === 'STORMWATER' || (categoryStr && categoryStr.toLowerCase().includes('drain')))) return true;
    if (targetDept === 'ELECTRICAL' && (cleanDept === 'LIGHTING' || (categoryStr && categoryStr.toLowerCase().includes('light')))) return true;
    return false;
  };

  // Strictly Scoped Department Datasets
  const deptClusters = clusters.filter((cl) => matchesDept(cl.department_id, cl.category));
  const deptComplaints = complaints.filter((c) => matchesDept(c.department_id, c.category));

  // Filter into queues for clusters
  const queueClusters = deptClusters.filter((cl) => {
    if (activeQueue === 'new') return cl.status === 'new';
    if (activeQueue === 'assigned') return cl.assigned_team && cl.status !== 'resolved';
    if (activeQueue === 'in_progress') return cl.status === 'in_progress';
    if (activeQueue === 'resolved') return cl.status === 'resolved';
    if (activeQueue === 'sla_risk') return cl.priority_level === 'CRITICAL' && cl.status !== 'resolved';
    return true; // 'all' or 'priority'
  });

  // Sort: Priority Queue (Critical -> High -> Medium -> Low)
  const sortedClusters = [...queueClusters].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="space-y-6">
      
      {/* Department Executive Banner */}
      <div className="bg-[#0B2545] text-white rounded-xl p-6 shadow-md border border-blue-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-900/60 text-amber-300 text-xs font-bold px-3 py-1 rounded-md border border-blue-700/50 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Department Operational Workspace · Scoped Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {currentDept?.name || departmentId}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Jurisdiction: <em>{currentDept?.jurisdiction || 'Assigned municipal civic maintenance'}</em>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-blue-950/80 p-3.5 rounded-lg border border-blue-800 text-center min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Active Clusters
              </span>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                {deptClusters.filter((c) => c.status !== 'resolved').length}
              </div>
            </div>

            <div className="bg-blue-950/80 p-3.5 rounded-lg border border-blue-800 text-center min-w-[120px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Total Grievances
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {deptComplaints.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main View Switcher Tabs (Clusters vs Individual Citizen Grievances) */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('clusters')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'clusters'
                ? 'bg-[#0B2545] text-amber-400 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Problem Clusters ({deptClusters.length})</span>
          </button>

          <button
            onClick={() => setViewMode('complaints')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'complaints'
                ? 'bg-[#0B2545] text-amber-400 shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Citizen Grievance Dockets ({deptComplaints.length})</span>
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded border border-slate-300 flex items-center space-x-1"
        >
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* VIEW 1: CLUSTERS VIEW */}
      {viewMode === 'clusters' && (
        <div className="space-y-4">
          
          {/* Operational Queues Navigation Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveQueue('priority')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueue === 'priority'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              ⚡ Priority Queue ({deptClusters.length})
            </button>

            <button
              onClick={() => setActiveQueue('new')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueue === 'new'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              🆕 New ({deptClusters.filter((c) => c.status === 'new').length})
            </button>

            <button
              onClick={() => setActiveQueue('assigned')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueue === 'assigned'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              🛠️ Assigned ({deptClusters.filter((c) => c.assigned_team && c.status !== 'resolved').length})
            </button>

            <button
              onClick={() => setActiveQueue('resolved')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueue === 'resolved'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-300 text-emerald-800'
              }`}
            >
              ✅ Resolved ({deptClusters.filter((c) => c.status === 'resolved').length})
            </button>
          </div>

          {/* Clusters List */}
          <div className="space-y-3">
            {sortedClusters.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-300 p-10 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">No Active Issues in this Queue</h3>
                <p className="text-xs text-slate-500 mt-1">
                  All grievances for {currentDept?.name || departmentId} are up to date.
                </p>
              </div>
            ) : (
              sortedClusters.map((cl) => {
                const isCritical = cl.priority_level === 'CRITICAL';
                return (
                  <div
                    key={cl.id}
                    className={`bg-white rounded-xl border p-4 shadow-2xs transition-all hover:shadow-md ${
                      cl.failed_resolution_alert
                        ? 'border-rose-400 bg-rose-50/40'
                        : isCritical
                        ? 'border-rose-300 bg-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-xs font-black text-[#0B2545] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            #{cl.id}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {cl.title}
                          </h3>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              isCritical
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {cl.priority_level} (Priority: {cl.priority_score})
                          </span>
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {cl.category}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-slate-600 flex-wrap">
                          <span>📍 {cl.ward}</span>
                          <span className="font-bold text-slate-800">
                            👥 {cl.citizen_count} Citizen Reports ({cl.unique_complaint_count} unique, {cl.duplicate_count} duplicates)
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-bold text-rose-600">Trend: {cl.trend}</span>
                          <span className="text-slate-400">·</span>
                          <span>Latest: {cl.latest_reported_at}</span>
                        </div>

                        {cl.assigned_team && (
                          <div className="text-xs text-blue-950 font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block mt-1">
                            🛠️ Work Order Dispatched to: <strong>{cl.assigned_team}</strong> ({cl.assigned_officer})
                          </div>
                        )}
                      </div>

                      {/* Right: Operational Action Buttons */}
                      <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                        <button
                          onClick={() => setModalCluster(cl)}
                          className="px-3.5 py-2 bg-[#0B2545] hover:bg-[#102A45] text-amber-400 rounded text-xs font-bold transition-all shadow-2xs flex items-center space-x-1"
                        >
                          <span>Take Action / Work Order</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {onSelectClusterForIntelligence && (
                          <button
                            onClick={() => onSelectClusterForIntelligence(cl.id)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold border border-slate-300"
                          >
                            Dossier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL CITIZEN GRIEVANCE DOCKETS */}
      {viewMode === 'complaints' && (
        <div className="space-y-3">
          {deptComplaints.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-300 p-10 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Citizen Grievances Recorded</h3>
              <p className="text-xs text-slate-500 mt-1">
                When citizens lodge grievances for {currentDept?.name || departmentId}, individual dockets will appear here.
              </p>
            </div>
          ) : (
            deptComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-300 p-4 shadow-2xs space-y-2 hover:border-blue-400 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#0B2545] bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      #{c.id}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {c.subcategory}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      c.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.severity} Priority
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c.created_at}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50/60 p-2.5 rounded border border-slate-200">
                  "{c.raw_text}"
                </p>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center text-slate-700 font-semibold">
                      <MapPin className="w-3 h-3 mr-1 text-rose-600" />
                      {c.address}, {c.ward}
                    </span>
                    <span className="flex items-center text-slate-700">
                      <Phone className="w-3 h-3 mr-1 text-emerald-700" />
                      +91 {c.citizen_id}
                    </span>
                  </div>

                  {c.issue_cluster_id && (
                    <span className="text-[11px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Linked Cluster: #{c.issue_cluster_id}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Modal Dialog */}
      {modalCluster && (
        <DepartmentIssueModal
          cluster={modalCluster}
          department={currentDept}
          onClose={() => setModalCluster(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
