import React from 'react';
import { AnalyticsData, IssueCluster } from '../../types';
import { BarChart3, TrendingUp, Users, Building2, Layers, CheckCircle2, AlertTriangle, Printer, Download, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

interface AnalyticsProps {
  analytics: AnalyticsData | null;
  clusters: IssueCluster[];
  onSelectCluster: (id: string) => void;
}

const COLORS = ['#2563eb', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({
  analytics,
  clusters,
  onSelectCluster
}) => {
  if (!analytics) {
    return <div className="p-8 text-center text-slate-500">Loading Analytics...</div>;
  }

  const { kpis, by_category, by_department, by_ward, hotspots } = analytics;

  // Format data for Recharts
  const categoryChartData = by_category.map((c) => ({
    name: c.category.length > 12 ? c.category.substring(0, 12) + '...' : c.category,
    fullName: c.category,
    count: c.count
  }));

  const wardChartData = by_ward.map((w) => ({
    name: w.ward,
    count: w.count
  }));

  return (
    <div className="space-y-6">
      {/* Top Header with Report Print/Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-black text-slate-900">
              Municipal Grievance Intelligence & AI Clustering Report
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Recharts + ReportLab Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational metrics across municipal wards, departments, and AI issue clustering
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/clusters/RC-1042/report/pdf"
            download="CivicPulse_Executive_Incident_Report.pdf"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Incident PDF (ReportLab)</span>
          </a>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Duplicate Reduction Impact Metric Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/15">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
              Total Ingested Reports
            </span>
            <div className="text-4xl font-black text-white">{kpis.total_complaints}</div>
            <p className="text-[11px] text-blue-300">Citizen submissions processed by AI</p>
          </div>

          <div className="pt-4 md:pt-0 space-y-1">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              AI Issue Clustering Output
            </span>
            <div className="text-4xl font-black text-amber-300">{kpis.issue_clusters}</div>
            <p className="text-[11px] text-blue-200">Actionable real-world civic issues</p>
          </div>

          <div className="pt-4 md:pt-0 space-y-1">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Administrative Workload Saved
            </span>
            <div className="text-4xl font-black text-emerald-400">
              {kpis.duplicate_reduction_rate_pct}%
            </div>
            <p className="text-[11px] text-emerald-200 font-semibold">
              Avoided {kpis.total_complaints - kpis.issue_clusters} redundant field dispatches!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown with Recharts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">
              Grievance Distribution by Category (Recharts)
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} reports`, 'Complaints']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Breakdown with Recharts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">
              Grievance Concentration by Ward (Recharts)
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} reports`, 'Volume']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Largest Civic Problems Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Largest Real-World Civic Problems by Citizen Volume
            </h3>
            <p className="text-[11px] text-slate-500">
              Individual tickets aggregated into underlying issues with full ReportLab PDF generation
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Cluster ID</th>
                <th className="p-3">Civic Issue</th>
                <th className="p-3">Department</th>
                <th className="p-3">Citizens</th>
                <th className="p-3">Growth Velocity</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Impact</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clusters.map((cl) => (
                <tr key={cl.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-700">{cl.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{cl.title}</td>
                  <td className="p-3 text-slate-600">{cl.department_id}</td>
                  <td className="p-3 font-bold text-slate-900">{cl.citizen_count}</td>
                  <td className="p-3 font-bold text-rose-600">{cl.trend}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-rose-100 text-rose-700">
                      {cl.priority_level}
                    </span>
                  </td>
                  <td className="p-3 font-black text-indigo-700">{cl.impact_score}/100</td>
                  <td className="p-3 text-right space-x-2">
                    <a
                      href={`/api/clusters/${cl.id}/report/pdf`}
                      download={`CivicPulse_Report_${cl.id}.pdf`}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded"
                    >
                      PDF
                    </a>
                    <button
                      onClick={() => onSelectCluster(cl.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
