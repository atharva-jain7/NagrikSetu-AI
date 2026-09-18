import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import {
  Layers, Shield, Sparkles, User as UserIcon, RefreshCw,
  LogOut, Construction, Droplets, Trash2, MapPin, BarChart3,
  FileText, CheckCircle2, ChevronRight, Activity, Bell, PhoneCall, Clock, Globe
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  onResetDemo: () => void;
  onClearData: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onResetDemo,
  onClearData,
  activeTab,
  onTabChange
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      };
      setTimeStr(now.toLocaleString('en-IN', options) + ' IST');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs border-b border-slate-200">
      
      {/* 1. Indian Tricolor Micro-Band */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron" />
        <div className="h-full flex-1 bg-[#FFFFFF] border-y border-slate-200" title="White" />
        <div className="h-full flex-1 bg-[#138808]" title="Green" />
      </div>

      {/* 2. Top Government Deep Navy Utility Strip */}
      <div className="bg-[#0B2545] text-slate-200 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-blue-950">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center space-x-3">
            <span className="text-amber-400 font-bold tracking-wide">
              नागरिकसेतु • NagrikSetu
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden md:inline">
              National Municipal Grievance & Urban Defect Intelligence Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-1.5 text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{timeStr}</span>
            </div>

            <div className="flex items-center space-x-1 text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Helpline: 1913</span>
            </div>

            <div className="flex items-center space-x-1 text-slate-300 text-[11px]">
              <Globe className="w-3 h-3 text-blue-400" />
              <span>English / हिंदी</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Brand & Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
              {/* Emblem / Logo Icon */}
              <div className="w-10 h-10 rounded-lg bg-[#0B2545] text-amber-400 flex items-center justify-center shadow-xs border border-blue-900">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-[#0B2545] font-['Plus_Jakarta_Sans']">
                    Nagrik<span className="text-[#FF9933]">Setu</span>
                    <span className="text-xs text-blue-700 font-bold ml-1.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">AI</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    Defect Classification
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Citizen-to-Administration Municipal Redressal Bridge
                </p>
              </div>
            </div>

            {/* Admin Nav Tabs */}
            {currentUser.role === 'admin' && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#0B2545] text-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Executive Overview & 10 Depts</span>
                </button>

                <button
                  onClick={() => onTabChange('gis')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${
                    activeTab === 'gis'
                      ? 'bg-[#0B2545] text-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GIS Hotspots</span>
                </button>

                <button
                  onClick={() => onTabChange('complaints')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${
                    activeTab === 'complaints'
                      ? 'bg-[#0B2545] text-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Grievance Master Register</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Controls: Authenticated Identity Badge & Actions */}
          <div className="flex items-center space-x-2.5">
            
            {/* User Profile Pill */}
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg">
              <div className={`w-7 h-7 rounded flex items-center justify-center text-white ${
                currentUser.role === 'admin'
                  ? 'bg-[#0B2545] text-amber-400'
                  : currentUser.role === 'officer'
                  ? 'bg-amber-700'
                  : 'bg-emerald-700'
              }`}>
                {currentUser.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : currentUser.role === 'officer' ? (
                  <Construction className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 leading-none mt-0.5">
                  {currentUser.role === 'admin'
                    ? 'Municipal Administrator'
                    : currentUser.role === 'officer'
                    ? `${currentUser.department_id} Officer`
                    : `Verified Citizen (+91 ${currentUser.mobile})`}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded border border-amber-500 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar for Admin */}
        {currentUser.role === 'admin' && (
          <div className="flex md:hidden space-x-1 border-t border-slate-200 py-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-1 rounded ${activeTab === 'dashboard' ? 'bg-[#0B2545] text-amber-300 font-bold' : 'text-slate-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => onTabChange('gis')}
              className={`px-3 py-1 rounded ${activeTab === 'gis' ? 'bg-[#0B2545] text-amber-300 font-bold' : 'text-slate-700'}`}
            >
              GIS Map
            </button>
            <button
              onClick={() => onTabChange('complaints')}
              className={`px-3 py-1 rounded ${activeTab === 'complaints' ? 'bg-[#0B2545] text-amber-300 font-bold' : 'text-slate-700'}`}
            >
              Grievance Register
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
