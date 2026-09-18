import React, { useState } from 'react';
import { Complaint } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck, MapPin, Building2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitCitizenFeedback } from '../../api';

interface MyComplaintsProps {
  complaints: Complaint[];
  onRefresh: () => void;
}

export const MyComplaints: React.FC<MyComplaintsProps> = ({ complaints, onRefresh }) => {
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const handleFeedback = async (id: string, feedback: 'solved' | 'still_exists') => {
    try {
      await submitCitizenFeedback(id, feedback);
      setFeedbackSuccess(id);
      setTimeout(() => {
        onRefresh();
        setFeedbackSuccess(null);
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Complaints Submitted Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          When you report civic issues, their AI tracking and resolution progress will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          My Grievances ({complaints.length})
        </h2>
        <span className="text-[11px] text-slate-500">Live AI Tracking</span>
      </div>

      {complaints.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:shadow-md"
        >
          {/* Card Header */}
          <div className="p-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-slate-900">{c.id}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                  {c.category}
                </span>
                {c.duplicate_of && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
                    Linked Duplicate
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                <span>{c.address}</span>
              </p>
            </div>

            {/* Status Pill */}
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                c.status === 'resolved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : c.status === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {c.status.replace('_', ' ')}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              "{c.raw_text}"
            </p>

            {/* Department routing and cluster info */}
            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Responsible Department</span>
                <span className="font-semibold text-slate-800 flex items-center mt-0.5">
                  <Building2 className="w-3 h-3 mr-1 text-blue-600" />
                  {c.department_name.split('(')[0]}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">AI Civic Cluster</span>
                <span className="font-semibold text-indigo-700 mt-0.5 block">
                  {c.issue_cluster_id || 'Evaluating...'}
                </span>
              </div>
            </div>

            {/* RESOLUTION CONFIRMATION WORKFLOW (Prompt Section 36) */}
            {c.status === 'resolved' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 mt-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Resolution Verification Request</span>
                </div>
                <p className="text-[11px] text-emerald-800 mb-3">
                  The municipal department marked this issue as <strong>Resolved</strong>. Can you confirm if the real problem has been solved on the ground?
                </p>

                {c.citizen_feedback ? (
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 inline-block">
                    ✓ You responded: {c.citizen_feedback === 'solved' ? 'Problem Solved' : 'Problem Still Exists'}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFeedback(c.id, 'solved')}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Problem Solved</span>
                    </button>
                    <button
                      onClick={() => handleFeedback(c.id, 'still_exists')}
                      className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>Problem Still Exists</span>
                    </button>
                  </div>
                )}

                {feedbackSuccess === c.id && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-2 animate-fade-in">
                    ✓ Feedback recorded! AI Closed-Loop Verification updated.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
