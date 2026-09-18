import React from 'react';
import { Shield, ExternalLink, Phone, Mail, Building, FileText, CheckCircle2 } from 'lucide-react';

export const GovFooter: React.FC = () => {
  return (
    <footer className="bg-[#0B2545] text-slate-300 text-xs border-t-4 border-[#FF9933] mt-auto">
      
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Col 1: About NagrikSetu */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>About NagrikSetu AI</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              NagrikSetu (नागरिकसेतु) is the unified public grievance redressal and municipal defect intelligence platform. Powered by Defect Taxonomy AI routing and spatial issue clustering.
            </p>
            <div className="text-[11px] text-amber-300 font-semibold">
              Aligned with Smart Cities & Digital Governance.
            </div>
          </div>

          {/* Col 2: National & Municipal Coverage */}
          <div className="space-y-2">
            <div className="text-white font-bold text-sm tracking-wide">Municipal Departments</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
              <span>• Roads & PWD</span>
              <span>• Water Supply</span>
              <span>• Solid Waste (SWM)</span>
              <span>• Drainage & Storm</span>
              <span>• Electrical Infra</span>
              <span>• Parks & Garden</span>
              <span>• Encroachments</span>
              <span>• Traffic & Transit</span>
              <span>• Public Health</span>
              <span>• Animal Control</span>
            </div>
          </div>

          {/* Col 3: Citizen SLA Standards */}
          <div className="space-y-2">
            <div className="text-white font-bold text-sm tracking-wide">Citizen Charter Standards</div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                <span className="text-amber-400 font-bold">› Critical Safety Hazards:</span> Within 24 Hours
              </li>
              <li>
                <span className="text-emerald-400 font-bold">› Standard Grievances:</span> 48 - 72 Hours
              </li>
              <li>
                <span className="text-blue-300 font-bold">› Closed-Loop Verification:</span> Photo Evidence Required
              </li>
              <li>
                <span className="text-slate-300">› Right to Information (RTI) Compliance</span>
              </li>
            </ul>
          </div>

          {/* Col 4: 24x7 Control Room */}
          <div className="space-y-2">
            <div className="text-white font-bold text-sm tracking-wide">24x7 Grievance Control Room</div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-blue-900 space-y-1.5 text-[11px]">
              <div className="text-amber-400 font-bold flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Toll-Free: 1913
              </div>
              <div className="text-slate-300 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> helpdesk@nagriksetu.gov.in
              </div>
              <div className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                Thane Municipal Administrative Center.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#06152B] py-3 px-4 sm:px-6 lg:px-8 border-t border-blue-950 text-slate-400 text-[11px]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © 2026 NagrikSetu AI · Municipal Urban Grievance Intelligence System.
          </div>
          <div className="flex items-center justify-center space-x-4 text-[10px] text-slate-300">
            <span className="text-emerald-400 font-semibold flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> 10-Department AI Routing Active
            </span>
            <span>•</span>
            <span>Security Audit: PASSED</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
