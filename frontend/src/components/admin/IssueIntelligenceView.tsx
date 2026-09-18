import React, { useState, useEffect } from 'react';
import { IssueCluster, Complaint } from '../../types';
import { fetchClusterDetail, getGeminiClusterBriefing, setGeminiKey } from '../../api';
import {
  ShieldAlert, Users, TrendingUp, Building2, MapPin, CheckCircle2,
  Clock, AlertTriangle, ArrowLeft, Layers, Camera, FileText, ChevronRight,
  Sparkles, Cpu, Zap, Key
} from 'lucide-react';

interface IssueIntelligenceProps {
  clusterId: string;
  onBack: () => void;
  onSelectComplaint?: (complaint: Complaint) => void;
}

export const IssueIntelligenceView: React.FC<IssueIntelligenceProps> = ({
  clusterId,
  onBack,
  onSelectComplaint
}) => {
  const [cluster, setCluster] = useState<IssueCluster | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'timeline' | 'reroutes'>('evidence');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchClusterDetail(clusterId);
        setCluster(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    load();
  }, [clusterId]);

  if (loading || !cluster) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-semibold">Loading Issue Intelligence for {clusterId}...</p>
      </div>
    );
  }

  const breakdown = cluster.priority_breakdown;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center flex-wrap gap-2">
          <a
            href={`/api/clusters/${cluster.id}/report/pdf`}
            download={`CivicPulse_Incident_Report_${cluster.id}.pdf`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <span>📄 Download Official PDF Report</span>
          </a>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
            Level 3 · Issue Cluster
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
              cluster.priority_level === 'CRITICAL'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {cluster.priority_level} (Score {cluster.priority_score}/100)
          </span>
        </div>
      </div>

      {/* FAILED RESOLUTION WARNING BANNER (Closed-Loop Resolution Verification) */}
      {cluster.failed_resolution_alert ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-rose-900 tracking-wide">
                  🚨 CLOSED-LOOP ALERT: POSSIBLE FAILED RESOLUTION DETECTED
                </h3>
                <span className="bg-rose-200 text-rose-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Confidence: {cluster.resolution_confidence}
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed font-medium">
                {cluster.failed_resolution_reason ||
                  'Issue was marked resolved by the department, but recurring citizen complaints and negative confirmation feedback have been detected from the same geographic zone.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Issue Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="font-mono text-sm font-black text-blue-700">{cluster.id}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {cluster.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {cluster.subcategory}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900">{cluster.title}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{cluster.ward}, {cluster.city} · Geographic Radius: ~{Math.round(cluster.radius_meters)}m</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Authority</span>
              <span className="text-xs font-bold text-slate-800 flex items-center justify-end mt-0.5">
                <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                {cluster.department_name}
              </span>
              {cluster.assigned_team && (
                <span className="text-[11px] text-indigo-700 font-semibold block mt-0.5">
                  Field Team: {cluster.assigned_team}
                </span>
              )}
            </div>

            <div className={`px-4 py-2 rounded-xl text-center border ${
              cluster.status === 'resolved'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : cluster.status === 'in_progress'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <span className="text-[10px] uppercase font-bold block">Status</span>
              <span className="text-xs font-black uppercase">{cluster.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* 4 Core Quantitative Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-center">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs font-semibold mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Citizens Affected</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{cluster.citizen_count}</div>
            <span className="text-[10px] text-slate-500">Unique individuals</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs font-semibold mb-1">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Unique Reports</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{cluster.unique_complaint_count}</div>
            <span className="text-[10px] text-slate-500">Supporting evidence</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs font-semibold mb-1">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Same-Citizen Duplicates</span>
            </div>
            <div className="text-2xl font-black text-amber-700">{cluster.duplicate_count}</div>
            <span className="text-[10px] text-slate-500">Filtered repeats</span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-center space-x-1 text-slate-500 text-xs font-semibold mb-1">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <span>Complaint Trend</span>
            </div>
            <div className="text-2xl font-black text-rose-600">{cluster.trend}</div>
            <span className="text-[10px] text-slate-500">72-hour velocity</span>
          </div>
        </div>
      </div>

      {/* Innovation Section: Transparent Priority & Impact Factor Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why is this Critical? Explainability Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                Transparent Priority Scoring Engine
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {cluster.priority_score} / 100
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Priority is derived from a multi-factor transparent formula, not a black-box LLM guess:
          </p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Citizen Volume ({cluster.citizen_count} people)</span>
                <span>+{breakdown?.citizens_points || 30} pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (breakdown?.citizens_points || 30) * 2.8)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Safety Risk & Body Injury Hazard</span>
                <span>+{breakdown?.safety_risk_points || 25} pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-rose-600 h-2 rounded-full" style={{ width: `${Math.min(100, (breakdown?.safety_risk_points || 25) * 3.3)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Complaint Surge Velocity ({cluster.trend})</span>
                <span>+{breakdown?.growth_points || 20} pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${Math.min(100, (breakdown?.growth_points || 20) * 4.5)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Sensitive Location Context (School/Highway)</span>
                <span>+{breakdown?.sensitive_location_points || 20} pts</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, (breakdown?.sensitive_location_points || 20) * 4.5)}%` }} />
              </div>
            </div>
          </div>

          {/* Qualitative Explanation List */}
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
              Key Contributing Factors:
            </span>
            <ul className="space-y-1 text-xs text-slate-600">
              {breakdown?.explanation?.map((exp, idx) => (
                <li key={idx} className="flex items-start space-x-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{exp}</span>
                </li>
              )) || (
                <li className="text-xs text-slate-500">Multi-factor public disruption detected</li>
              )}
            </ul>
          </div>
        </div>

        {/* Priority vs Impact Score Differentiation (Prompt Section 39) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                Priority vs. Impact Score Duality
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              CivicPulse AI separates <strong>Urgency Priority</strong> (how fast must officers act) from <strong>Public Impact</strong> (total civic scale and population disruption).
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Urgency Priority</span>
                <div className="text-2xl font-black text-rose-700 mt-1">{cluster.priority_score}</div>
                <p className="text-[10px] text-rose-900 mt-0.5">
                  Hazard level & speed of response needed
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">Public Impact Score</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">{cluster.impact_score}</div>
                <p className="text-[10px] text-indigo-900 mt-0.5">
                  Affected population & geographic footprint
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Closed-Loop Resolution Verification:</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Status: <span className="font-semibold text-slate-800">{cluster.resolution_confidence}</span>. The system continuously listens for recurring complaints within 750m post-repair to verify ground resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Evidence Gallery, Timeline, Reroute History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex space-x-6">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Supporting Citizen Complaints ({cluster.supporting_complaints?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Action Timeline ({cluster.timeline?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reroutes')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'reroutes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Reroute Audit Trail ({cluster.reroutes?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {/* Tab 1: Supporting Citizen Complaints */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 flex items-center justify-between mb-2">
                <span>Original citizen submissions automatically clustered into this issue:</span>
                <span className="font-semibold text-slate-700">All records preserved for legal audit</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {cluster.supporting_complaints?.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectComplaint && onSelectComplaint(c)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{c.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-200 text-slate-700">
                          {c.language}
                        </span>
                        {c.duplicate_of && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium line-clamp-2">
                      "{c.raw_text}"
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span>👤 {c.citizen_name}</span>
                      <span className="font-semibold text-blue-600">AI Priority: {c.priority_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {cluster.timeline && cluster.timeline.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
                  {cluster.timeline.map((t, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                      <div>
                        <span className="text-[11px] font-mono text-slate-400 block">
                          {new Date(t.timestamp).toLocaleString()}
                        </span>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">
                          Status updated to: <span className="uppercase text-blue-700">{t.new_status}</span> by {t.changed_by}
                        </div>
                        {t.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                            "{t.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No timeline updates recorded yet.</p>
              )}
            </div>
          )}

          {/* Tab 3: Reroute History */}
          {activeTab === 'reroutes' && (
            <div className="space-y-3">
              {cluster.reroutes && cluster.reroutes.length > 0 ? (
                cluster.reroutes.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                      <span>Rerouted: {r.from_department} → {r.to_department}</span>
                      <span className="text-[10px] font-normal text-amber-700">
                        {new Date(r.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-amber-800">
                      <strong>Audit Reason:</strong> "{r.reason}"
                    </p>
                    <span className="text-[10px] text-amber-700 mt-1 block">
                      Rerouted by: {r.changed_by}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  ✓ Original AI routing intact. No departmental rerouting required.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
