import React, { useState } from 'react';
import {
  CheckCircle2, Copy, Check, ExternalLink, Printer, MapPin, Building2,
  Clock, ShieldAlert, Sparkles, Phone, Mail, ArrowRight, Share2, FileText, AlertTriangle
} from 'lucide-react';

interface GrievanceConfirmationModalProps {
  submissionResult: any;
  citizenMobile: string;
  citizenEmail: string;
  onViewComplaints: () => void;
  onLodgeAnother: () => void;
}

export const GrievanceConfirmationModal: React.FC<GrievanceConfirmationModalProps> = ({
  submissionResult,
  citizenMobile,
  citizenEmail,
  onViewComplaints,
  onLodgeAnother
}) => {
  const [copied, setCopied] = useState(false);

  const docketId = submissionResult.complaint_id || 'GRMS-DOCKET';
  const category = submissionResult.classification?.category || 'Public Infrastructure';
  const subcategory = submissionResult.classification?.subcategory || 'General Defect';
  const department = submissionResult.routed_department || 'Municipal Administration';
  const deptId = submissionResult.classification?.department_id || 'MUNICIPAL';
  const severity = submissionResult.priority?.priority_level || 'HIGH';
  const score = submissionResult.priority?.priority_score || 80;
  const address = submissionResult.location?.address || 'Thane Ward Center';
  const ward = submissionResult.location?.ward || 'Ward 14';
  const confidence = submissionResult.confidence || 98.5;

  const handleCopy = () => {
    navigator.clipboard.writeText(docketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-xl w-full overflow-hidden my-6 transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* 1. Indian Tricolor Micro-Band */}
        <div className="h-1.5 w-full flex">
          <div className="h-full flex-1 bg-[#FF9933]" />
          <div className="h-full flex-1 bg-[#FFFFFF] border-y border-slate-200" />
          <div className="h-full flex-1 bg-[#138808]" />
        </div>

        {/* 2. Top Deep Navy Header */}
        <div className="bg-[#0B2545] p-5 text-white text-center relative border-b border-blue-950">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Official Grievance Registration Docket
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Grievance Registered Successfully
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Assigned to <strong>{department}</strong> for time-bound inspection and resolution.
          </p>
        </div>

        {/* 3. Docket Summary Particulars */}
        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/50">
          
          {/* Docket ID Highlight Box */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-300 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Official Docket Tracking ID
              </span>
              <span className="text-xl font-black text-[#0B2545] font-mono tracking-wide">
                #{docketId}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded border border-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Docket #</span>
                </>
              )}
            </button>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xs overflow-hidden text-xs">
            <div className="divide-y divide-slate-200">
              
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Defect Classification:</span>
                <span className="font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {subcategory} ({category})
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Department:</span>
                <span className="font-bold text-[#0B2545] flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  {department} [{deptId}]
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Location & Ward:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[240px] flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
                  {address}, {ward}
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Priority & Urgency:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {severity} (Score {score}/100)
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Citizen Charter SLA:</span>
                <span className="font-bold text-emerald-700 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {severity === 'CRITICAL' ? 'Guaranteed within 24 Hours' : 'Guaranteed within 48 - 72 Hours'}
                </span>
              </div>

            </div>
          </div>

          {/* Spatial Clustering Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-blue-950 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Spatial Clustering & Deduplication Engine</span>
            </div>
            {submissionResult.is_duplicate_of ? (
              <p className="text-[11px] text-blue-900">
                Linked as supplementary evidence to existing grievance <strong>#{submissionResult.is_duplicate_of}</strong>.
              </p>
            ) : submissionResult.is_new_cluster ? (
              <p className="text-[11px] text-blue-900">
                Created new root-cause defect hotspot <strong>{submissionResult.issue_cluster_id}</strong>.
              </p>
            ) : (
              <p className="text-[11px] text-blue-900">
                Aggregated with nearby neighbor reports into cluster <strong>{submissionResult.issue_cluster_id}</strong> for high-priority dispatch.
              </p>
            )}
          </div>

          {/* Multi-Channel Notification Badges */}
          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 space-y-1.5 text-[11px] text-slate-700">
            <div className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
              Multi-Channel Dispatch Notification
            </div>
            <div className="flex items-center text-slate-700">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
              <span>Official registration email dispatched to: <strong>{citizenEmail}</strong></span>
            </div>
            <div className="flex items-center text-slate-700">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              <span>SMS confirmation dispatched to: <strong>+91 {citizenMobile}</strong> (Twilio Gateway)</span>
            </div>
          </div>

        </div>

        {/* 4. Action Buttons Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2">
          
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 px-3 py-2 rounded border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onLodgeAnother}
              className="text-xs font-semibold text-slate-700 hover:bg-slate-200 px-3 py-2 rounded border border-slate-300 transition-colors"
            >
              Report Another
            </button>

            <button
              type="button"
              onClick={onViewComplaints}
              className="bg-[#0B2545] hover:bg-[#102A45] text-amber-400 font-bold px-4 py-2 rounded text-xs flex items-center space-x-1 shadow-xs transition-colors"
            >
              <span>Track Live Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
