import React, { useState, useEffect } from 'react';
import { Complaint, IssueCluster } from '../../types';
import {
  PlusCircle, ListOrdered, MapPin, Bell, ShieldAlert, Sparkles,
  CheckCircle2, ChevronRight, Phone, FileText, Clock, HelpCircle,
  Shield, Building2, ArrowRight
} from 'lucide-react';
import { ReportProblemWizard } from './ReportProblemWizard';
import { MyComplaints } from './MyComplaints';
import { fetchComplaints, fetchClusters } from '../../api';

interface CitizenHomeProps {
  citizenMobile: string;
  onComplaintSubmitted?: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({ citizenMobile, onComplaintSubmitted }) => {
  const [activeView, setActiveView] = useState<'home' | 'report' | 'my-complaints' | 'nearby'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cmpRes, clRes] = await Promise.all([
        fetchComplaints({ citizen_id: citizenMobile }),
        fetchClusters()
      ]);
      setComplaints(cmpRes);
      setClusters(clRes);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [citizenMobile]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* NagrikSetu Citizen Service Banner */}
      <div className="bg-[#0B2545] text-white rounded-lg p-5 sm:p-6 border border-blue-950 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-blue-900 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              NagrikSetu • Citizen Grievance Redressal
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-300 font-medium flex items-center">
              <Phone className="w-3 h-3 mr-1 text-emerald-400" /> +91 {citizenMobile}
            </span>
          </div>
          <span className="text-[11px] bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-300" /> Verified Citizen
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Municipal Public Grievance Redressal Desk
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Lodge grievances for Roads, Water Supply, Sanitation, Drainage, Streetlights, Encroachments, and municipal engineering departments with auto-GPS routing and time-bound SLA tracking.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={() => setActiveView('report')}
              className="w-full bg-[#FF9933] hover:bg-[#E68A2E] text-slate-950 font-bold px-4 py-2.5 rounded text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Report a Problem</span>
            </button>

            <button
              onClick={() => setActiveView('my-complaints')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded text-xs flex items-center justify-center space-x-1.5 border border-white/20 transition-colors"
            >
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>My Reports ({complaints.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'report' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('home')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center bg-white hover:bg-slate-100 px-3 py-1.5 rounded border border-slate-300"
            >
              ← Back to Portal Home
            </button>
          </div>
          <ReportProblemWizard
            citizenMobile={citizenMobile}
            onSuccess={() => {
              setActiveView('my-complaints');
              loadData();
              if (onComplaintSubmitted) onComplaintSubmitted();
            }}
            onCancel={() => setActiveView('home')}
          />
        </div>
      ) : activeView === 'my-complaints' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('home')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center bg-white hover:bg-slate-100 px-3 py-1.5 rounded border border-slate-300"
            >
              ← Back to Portal Home
            </button>
            <button
              onClick={() => setActiveView('report')}
              className="text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded border border-amber-500 flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Docket</span>
            </button>
          </div>
          <MyComplaints complaints={complaints} onRefresh={loadData} />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Action Navigation Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div
              onClick={() => setActiveView('report')}
              className="p-4 bg-white rounded-lg border border-slate-300 shadow-2xs hover:border-blue-900 hover:shadow-xs cursor-pointer transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-900 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Report an Issue</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Report civic defects with photo, audio voice, or text. Automatically classifies defect and routes to the correct department.
              </p>
              <span className="text-[11px] text-blue-900 font-bold flex items-center pt-1">
                Lodge Grievance →
              </span>
            </div>

            <div
              onClick={() => setActiveView('my-complaints')}
              className="p-4 bg-white rounded-lg border border-slate-300 shadow-2xs hover:border-blue-900 hover:shadow-xs cursor-pointer transition-all space-y-2"
            >
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-900 flex items-center justify-center">
                <ListOrdered className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Track Past Reports</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Track live resolution progress, SLA timers, and closed-loop photo verification receipts for past dockets.
              </p>
              <span className="text-[11px] text-emerald-800 font-bold flex items-center pt-1">
                Track {complaints.length} Dockets →
              </span>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-300 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Resolution SLA Charter</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Guaranteed time-bound redressal: Critical hazards within 24h, standard defects in 48-72h under Citizen Charter.
              </p>
              <span className="text-[11px] text-amber-900 font-bold flex items-center pt-1">
                SLA Compliance: 94.2%
              </span>
            </div>

          </div>

          {/* Municipal Departments Jurisdictional Directory */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Municipal Grievance Jurisdictional Coverage Directory
                </h3>
                <p className="text-[11px] text-slate-500">Every complaint is mapped to its official department</p>
              </div>
              <span className="text-[11px] font-bold text-[#0B2545] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Municipal Departments Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { name: 'Roads & PWD', range: 'R01 - R10', tag: 'PWD' },
                { name: 'Water Supply', range: 'W01 - W10', tag: 'WATER' },
                { name: 'Solid Waste (SWM)', range: 'S01 - S10', tag: 'SWM' },
                { name: 'Drainage & Storm', range: 'D01 - D10', tag: 'DRAINAGE' },
                { name: 'Electrical & Lighting', range: 'E01 - E10', tag: 'ELECTRICAL' },
                { name: 'Parks & Garden', range: 'P01 - P10', tag: 'GARDEN' },
                { name: 'Buildings & Encroach', range: 'B01 - B10', tag: 'ENCROACH' },
                { name: 'Traffic & Transport', range: 'T01 - T10', tag: 'TRAFFIC' },
                { name: 'Public Health', range: 'H01 - H10', tag: 'HEALTH' },
                { name: 'Animal Control', range: 'A01 - A10', tag: 'ANIMAL' }
              ].map((dept, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800">
                  <span className="text-[10px] font-bold text-blue-900 block">{dept.tag}</span>
                  <div className="font-semibold text-[11px] truncate">{dept.name}</div>
                  <span className="text-[10px] text-slate-500">{dept.range}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
