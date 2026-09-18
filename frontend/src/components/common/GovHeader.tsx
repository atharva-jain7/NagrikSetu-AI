import React, { useState, useEffect } from 'react';
import { Shield, PhoneCall, Clock, Globe, Eye, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';

interface GovHeaderProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({ currentUser, onLogout }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);

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

  const adjustFontSize = (delta: number) => {
    const newLevel = Math.max(-1, Math.min(2, fontSizeLevel + delta));
    setFontSizeLevel(newLevel);
    const root = document.documentElement;
    if (newLevel === -1) root.style.fontSize = '14px';
    else if (newLevel === 0) root.style.fontSize = '16px';
    else if (newLevel === 1) root.style.fontSize = '17.5px';
    else if (newLevel === 2) root.style.fontSize = '19px';
  };

  return (
    <div className="w-full bg-white border-b border-slate-200">
      {/* 1. Indian National Tricolor Top Micro-Band */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" title="Saffron - Strength and Courage" />
        <div className="h-full flex-1 bg-[#FFFFFF] border-y border-slate-200" title="White - Peace and Truth" />
        <div className="h-full flex-1 bg-[#138808]" title="Green - Fertility and Growth" />
      </div>

      {/* 2. Top Government Utility & Accessibility Bar */}
      <div className="bg-[#0B2545] text-slate-200 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-blue-950 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Ministry & Portal Identity */}
          <div className="flex items-center space-x-3">
            <span className="text-amber-400 font-bold tracking-wide">
              भारत सरकार | Government of India
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">
              आवासन और शहरी कार्य मंत्रालय | Ministry of Housing and Urban Affairs
            </span>
          </div>

          {/* Right: Accessibility Controls, Clock, and Toll-Free Helpline */}
          <div className="flex items-center space-x-4">
            {/* Live IST Time */}
            <div className="hidden lg:flex items-center space-x-1.5 text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{timeStr}</span>
            </div>

            {/* Toll Free Helpline */}
            <div className="flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
              <PhoneCall className="w-3 h-3" />
              <span>Helpline: 1913 (Toll Free)</span>
            </div>

            {/* Accessibility Font Zoom Controls */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700 text-[10px]">
              <span className="text-slate-400 mr-1">Text:</span>
              <button
                onClick={() => adjustFontSize(-1)}
                className={`px-1 rounded hover:bg-slate-700 ${fontSizeLevel === -1 ? 'bg-amber-400 text-slate-900 font-bold' : ''}`}
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                onClick={() => adjustFontSize(0 - fontSizeLevel)}
                className={`px-1 rounded hover:bg-slate-700 ${fontSizeLevel === 0 ? 'bg-amber-400 text-slate-900 font-bold' : ''}`}
                title="Normal Font Size"
              >
                A
              </button>
              <button
                onClick={() => adjustFontSize(1)}
                className={`px-1 rounded hover:bg-slate-700 ${fontSizeLevel > 0 ? 'bg-amber-400 text-slate-900 font-bold' : ''}`}
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* Language Indicator */}
            <div className="flex items-center space-x-1 text-slate-300">
              <Globe className="w-3 h-3 text-blue-400" />
              <span>English / हिंदी</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Official Municipal & Ministry Branding Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* State Emblem / Seal + Portal Title */}
        <div className="flex items-center space-x-3.5">
          {/* Emblem Representation */}
          <div className="flex flex-col items-center justify-center p-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs">
            <svg className="w-9 h-11 text-slate-800" viewBox="0 0 64 80" fill="currentColor">
              <circle cx="32" cy="16" r="10" fill="#0B2545" opacity="0.9" />
              <circle cx="20" cy="18" r="8" fill="#0B2545" opacity="0.8" />
              <circle cx="44" cy="18" r="8" fill="#0B2545" opacity="0.8" />
              <rect x="22" y="28" width="20" height="8" rx="2" fill="#0B2545" />
              <circle cx="32" cy="32" r="3" fill="#FF9933" />
              <path d="M16 38 L48 38 L42 62 L22 62 Z" fill="#0B2545" />
              <rect x="14" y="62" width="36" height="5" rx="1" fill="#138808" />
              <rect x="10" y="68" width="44" height="6" rx="2" fill="#0B2545" />
            </svg>
            <span className="text-[7.5px] font-black tracking-tighter text-slate-700 uppercase mt-0.5">सत्यमेव जयते</span>
          </div>

          {/* Bilingual Government Title */}
          <div>
            <div className="text-xs font-bold text-slate-600 tracking-wide">
              राष्ट्रीय नागरिक सेवा एवं नगर शिकायत निवारण प्रणाली
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0B2545] tracking-tight leading-tight">
              CENTRALIZED MUNICIPAL GRIEVANCE & URBAN DEFECT INTELLIGENCE SYSTEM
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
              <span className="text-blue-800 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                CP-GRMS v2.0
              </span>
              <span>•</span>
              <span className="text-slate-600">Unified 10-Department Taxonomy & Root-Cause Clustering Platform</span>
            </div>
          </div>
        </div>

        {/* Right Side: Digital India & Swachh Bharat Branding Badges */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="text-right border-r border-slate-200 pr-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">MUNICIPAL JURISDICTION</div>
            <div className="text-xs font-bold text-slate-900">THANE MUNICIPAL CORPORATION</div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1"></span>
              Live AI Routing Active
            </div>
          </div>

          {/* Swachh Bharat / Digital India Mark */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="text-center">
              <span className="text-[10px] font-black text-blue-900 block leading-none">डिजिटल</span>
              <span className="text-[10px] font-black text-amber-600 block leading-none">भारत</span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div className="text-center">
              <span className="text-[9px] font-bold text-emerald-800 block leading-none">स्वच्छ भारत</span>
              <span className="text-[8px] font-semibold text-slate-600 block leading-none">एक कदम स्वच्छता की ओर</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
