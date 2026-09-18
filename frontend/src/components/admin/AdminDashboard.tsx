import React, { useEffect } from 'react';
import { Complaint, IssueCluster, AnalyticsData } from '../../types';
import {
  ShieldAlert, TrendingUp, Users, FileText, CheckCircle2, Clock,
  ArrowRight, Flame, Building2, MapPin, Sparkles, AlertTriangle, RefreshCw,
  Trash2, Droplets, Construction, Waves, Trees, Bug, HeartPulse, Home, Zap, Car, Dog,
  BarChart3, Activity, Download, ShieldCheck
} from 'lucide-react';

interface AdminDashboardProps {
  clusters: IssueCluster[];
  complaints: Complaint[];
  analytics: AnalyticsData | null;
  onSelectCluster: (clusterId: string) => void;
  onNavigateToGIS: () => void;
  onNavigateToComplaints: () => void;
  onRefresh?: () => void;
}

const getDeptVisuals = (deptId: string) => {
  switch (deptId) {
    case 'PWD':
    case 'ROADS':
      return { icon: Construction, color: 'text-amber-900 bg-amber-50 border-amber-300', badge: 'bg-amber-100 text-amber-900 font-bold', tag: 'Roads & PWD', code: 'PWD' };
    case 'WATER':
      return { icon: Droplets, color: 'text-blue-900 bg-blue-50 border-blue-300', badge: 'bg-blue-100 text-blue-900 font-bold', tag: 'Water Supply', code: 'WATER' };
    case 'SWM':
      return { icon: Trash2, color: 'text-orange-900 bg-orange-50 border-orange-300', badge: 'bg-orange-100 text-orange-900 font-bold', tag: 'Solid Waste (SWM)', code: 'SWM' };
    case 'DRAINAGE':
      return { icon: Waves, color: 'text-cyan-900 bg-cyan-50 border-cyan-300', badge: 'bg-cyan-100 text-cyan-900 font-bold', tag: 'Drainage & Storm', code: 'DRAIN' };
    case 'ELECTRICAL':
      return { icon: Zap, color: 'text-yellow-950 bg-yellow-50 border-yellow-300', badge: 'bg-yellow-100 text-yellow-950 font-bold', tag: 'Electrical & Lighting', code: 'ELEC' };
    case 'GARDEN':
      return { icon: Trees, color: 'text-green-900 bg-green-50 border-green-300', badge: 'bg-green-100 text-green-900 font-bold', tag: 'Parks & Public Spaces', code: 'GARDEN' };
    case 'ENCROACHMENT':
      return { icon: Home, color: 'text-purple-900 bg-purple-50 border-purple-300', badge: 'bg-purple-100 text-purple-900 font-bold', tag: 'Buildings & Encroach', code: 'ENCROACH' };
    case 'TRAFFIC':
      return { icon: Car, color: 'text-indigo-900 bg-indigo-50 border-indigo-300', badge: 'bg-indigo-100 text-indigo-900 font-bold', tag: 'Traffic & Transport', code: 'TRAFFIC' };
    case 'HEALTH':
    case 'HEALTH_LICENSING':
      return { icon: HeartPulse, color: 'text-rose-900 bg-rose-50 border-rose-300', badge: 'bg-rose-100 text-rose-900 font-bold', tag: 'Public Health', code: 'HEALTH' };
    case 'ANIMAL_CONTROL':
    case 'PEST_CONTROL':
      return { icon: Dog, color: 'text-emerald-900 bg-emerald-50 border-emerald-300', badge: 'bg-emerald-100 text-emerald-900 font-bold', tag: 'Animal Control', code: 'ANIMAL' };
    default:
      return { icon: Building2, color: 'text-slate-900 bg-slate-50 border-slate-300', badge: 'bg-slate-100 text-slate-900 font-bold', tag: 'Municipal Civic', code: 'CIVIC' };
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clusters,
  complaints,
  analytics,
  onSelectCluster,
  onNavigateToGIS,
  onNavigateToComplaints,
  onRefresh
}) => {
  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const kpis = analytics?.kpis || {
    total_complaints: complaints.length,
    unique_reports: complaints.filter(c => !c.duplicate_of).length,
    duplicate_submissions: complaints.filter(c => c.duplicate_of).length,
    issue_clusters: clusters.length,
    critical_issues: clusters.filter(c => c.priority_level === 'CRITICAL').length,
    resolved_issues: clusters.filter(c => c.status === 'resolved').length,
    failed_resolutions_detected: clusters.filter(c => c.failed_resolution_alert).length,
    duplicate_reduction_rate_pct: 84.8
  };

  // Top civic problems ranked by Impact Score
  const sortedClusters = [...clusters].sort((a, b) => b.impact_score - a.impact_score);

  return (
    <div className="space-y-6">
      
      {/* NagrikSetu Executive Command Banner */}
      <div className="bg-[#0B2545] text-white rounded-lg p-5 sm:p-6 border border-blue-950 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                MUNICIPAL COMMISSIONER EXECUTIVE COMMAND CONSOLE
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-semibold">NagrikSetu AI Engine</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Municipal Grievance & Urban Defect Intelligence Dashboard
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Real-time AI spatial clustering engine aggregating individual citizen dockets into root-cause infrastructure defects across municipal departments.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA Compliance</span>
              <div className="text-2xl font-black text-emerald-400">94.2%</div>
              <span className="text-[10px] text-slate-300">Target ≥ 90%</span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Deduplication</span>
              <div className="text-2xl font-black text-amber-400">
                {kpis.duplicate_reduction_rate_pct}%
              </div>
              <span className="text-[10px] text-slate-300">{kpis.total_complaints} reports → {kpis.issue_clusters} issues</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official 6-Metric KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Dockets</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{kpis.total_complaints}</div>
          <span className="text-[10px] text-slate-500 font-medium">All Citizen Intakes</span>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Unique Defects</span>
          <div className="text-2xl font-black text-blue-900 mt-0.5">{kpis.unique_reports}</div>
          <span className="text-[10px] text-slate-500 font-medium">Unique Locations</span>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Issue Clusters</span>
          <div className="text-2xl font-black text-indigo-900 mt-0.5">{kpis.issue_clusters}</div>
          <span className="text-[10px] text-indigo-700 font-bold">Actionable Hotspots</span>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Critical Hazards</span>
          <div className="text-2xl font-black text-rose-700 mt-0.5">{kpis.critical_issues}</div>
          <span className="text-[10px] text-rose-700 font-bold">24h SLA Required</span>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">SLA At Risk</span>
          <div className="text-2xl font-black text-amber-700 mt-0.5">0</div>
          <span className="text-[10px] text-amber-700 font-bold">Near Breach</span>
        </div>

        <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block uppercase">Resolved (Closed)</span>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{kpis.resolved_issues}</div>
          <span className="text-[10px] text-emerald-700 font-bold">Evidence Verified</span>
        </div>

      </div>

      {/* 3. 10 MUNICIPAL DEPARTMENTS WORKLOAD MATRIX */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xs p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-900" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Municipal Departments Workload Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated routing distribution across municipal departments. Workload counters start at 0 and update in real-time.
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
            Comprehensive Defect Classification
          </span>
        </div>

        {/* 10 Department Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {analytics?.by_department && analytics.by_department.length > 0 ? (
            analytics.by_department.map((dept) => {
              const visuals = getDeptVisuals(dept.department_id);
              const DeptIcon = visuals.icon;
              return (
                <div
                  key={dept.department_id}
                  className={`p-3.5 rounded-lg border transition-all ${visuals.color} hover:shadow-xs relative`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded bg-white border border-slate-300 flex items-center justify-center">
                      <DeptIcon className="w-4 h-4 text-slate-800" />
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border border-slate-300 ${visuals.badge}`}>
                      {visuals.code}
                    </span>
                  </div>
                  
                  <div className="text-xs font-bold text-slate-900 truncate" title={dept.name}>
                    {dept.name}
                  </div>
                  
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pending</span>
                      <span className="text-xl font-black text-slate-900">{dept.count}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">SLA</span>
                      <span className="text-xs font-bold text-emerald-700">94%</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-4 text-center text-slate-500 text-xs bg-slate-50 rounded border border-slate-200">
              Loading 10-department matrix...
            </div>
          )}
        </div>

      </div>

      {/* 4. ACTIVE ROOT-CAUSE CIVIC DEFECT CLUSTERS */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xs p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-900" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Active Root-Cause Issue Clusters
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by citizen impact score and geographic concentration. Click any issue to view AI root-cause analysis and dispatch work orders.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateToGIS}
              className="text-xs font-bold text-blue-900 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 flex items-center space-x-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Open GIS Map</span>
            </button>
            <button
              onClick={onNavigateToComplaints}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Dockets</span>
            </button>
          </div>
        </div>

        {/* Cluster List */}
        {sortedClusters.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Active Grievance Clusters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All departments currently have 0 complaints. Submit new complaints from the Citizen Portal or click "Sample Data" to test.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedClusters.map((cluster) => {
              const visuals = getDeptVisuals(cluster.department_id);
              const DeptIcon = visuals.icon;
              return (
                <div
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster.id)}
                  className="p-4 bg-slate-50 hover:bg-white rounded-lg border border-slate-300 hover:border-blue-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded bg-white border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <DeptIcon className="w-5 h-5 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                          {cluster.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{cluster.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          cluster.priority_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {cluster.priority_level}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {cluster.ward}, {cluster.city}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{visuals.tag}</span>
                        <span>•</span>
                        <span>{cluster.citizen_count} Citizen Reports ({cluster.duplicate_count} Deduplicated)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Impact Score</span>
                      <span className="text-lg font-black text-blue-900">{cluster.impact_score}/100</span>
                    </div>
                    <span className="text-xs font-bold text-blue-900 bg-white border border-slate-300 px-3 py-1.5 rounded flex items-center hover:bg-blue-50">
                      <span>Investigate</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
