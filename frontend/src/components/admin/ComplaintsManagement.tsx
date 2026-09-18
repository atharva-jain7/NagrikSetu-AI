import React, { useState } from 'react';
import { Complaint } from '../../types';
import { Search, Filter, Eye, Layers, MapPin, Building2, Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ComplaintsManagementProps {
  complaints: Complaint[];
  onSelectCluster: (clusterId: string) => void;
}

export const ComplaintsManagement: React.FC<ComplaintsManagementProps> = ({
  complaints,
  onSelectCluster
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    if (selectedDept !== 'ALL' && c.department_id !== selectedDept) return false;
    if (selectedPriority !== 'ALL' && c.priority_level !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.raw_text.toLowerCase().includes(q) ||
        c.normalized_text.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.citizen_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, citizen, address, or grievance text..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="PWD">PWD (Roads)</option>
              <option value="WATER">Water Supply</option>
              <option value="SANITATION">Sanitation</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="ELECTRICAL">Electrical</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Operational Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Citizen</th>
                <th className="py-3 px-4">Category / Issue</th>
                <th className="py-3 px-4">Cluster Link (Level 3)</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 50).map((c) => {
                const isCritical = c.priority_level === 'CRITICAL';
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {c.id}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.citizen_name}</div>
                      <div className="text-[10px] text-slate-400">{c.citizen_id}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <span className="font-bold text-slate-800">{c.category}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600 uppercase">
                          {c.language}
                        </span>
                        {c.duplicate_of && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 font-bold text-amber-800">
                            Duplicate of {c.duplicate_of}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate" title={c.raw_text}>
                        "{c.raw_text}"
                      </p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.issue_cluster_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCluster(c.issue_cluster_id!);
                          }}
                          className="font-mono font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded text-[11px] transition-colors"
                        >
                          {c.issue_cluster_id} →
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {c.department_id}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700'
                            : c.priority_level === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.priority_level} ({c.priority_score})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                      {c.ward}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComplaint(c);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="View Evidence Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Detail Evidence Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">{selectedComplaint.id}</span>
                <h3 className="text-base font-black text-slate-900">Complaint Evidence & AI Audit</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo preview with EXIF GPS */}
            {selectedComplaint.photo_url && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={selectedComplaint.photo_url}
                  alt="Citizen report photo"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-md font-mono">
                  GPS: {selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}
                </div>
              </div>
            )}

            {/* Original vs Normalized Text */}
            <div className="space-y-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Original Citizen Text ({selectedComplaint.language.toUpperCase()})
                </span>
                <p className="text-xs font-medium text-slate-900 mt-0.5">
                  "{selectedComplaint.raw_text}"
                </p>
              </div>

              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">
                  AI Normalized Representation
                </span>
                <p className="text-xs text-blue-900 mt-0.5">
                  {selectedComplaint.normalized_text}
                </p>
              </div>
            </div>

            {/* Routing & Priority Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">AI Auto-Routed Dept</span>
                <span className="font-bold text-slate-800">{selectedComplaint.department_name}</span>
                <span className="text-[10px] text-emerald-600 block">Confidence: {selectedComplaint.ai_confidence}%</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Priority Urgency</span>
                <span className="font-bold text-rose-600">{selectedComplaint.priority_level}</span>
                <span className="text-[10px] text-slate-500 block">Score: {selectedComplaint.priority_score}/100</span>
              </div>
            </div>

            {/* Cluster Link Button */}
            {selectedComplaint.issue_cluster_id && (
              <button
                onClick={() => {
                  const clId = selectedComplaint.issue_cluster_id!;
                  setSelectedComplaint(null);
                  onSelectCluster(clId);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Inspect Parent Issue Cluster ({selectedComplaint.issue_cluster_id})</span>
                <Layers className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
