import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { requestOtp, verifyOtp, loginPassword } from '../../api';
import { GovFooter } from '../common/GovFooter';
import {
  Shield, User as UserIcon, Lock, Phone, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Droplets, Construction,
  KeyRound, CheckCircle, ShieldCheck, Activity, MapPin, Building2, PhoneCall,
  Mail, Clock, RefreshCw, Settings
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'citizen' | 'official'>('citizen');

  // Citizen State
  const [mobile, setMobile] = useState<string>('9970073370');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes

  // Official State
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [officialLoading, setOfficialLoading] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Send Secret Real OTP to citizen's phone via Twilio SMS
  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpLoading(true);
    try {
      const res = await requestOtp(mobile);
      if (res.success) {
        setOtpSent(true);
        setOtp('');
        setCountdown(300);
        if (res.live_sms) {
          setSuccessMsg(`✅ Real SMS delivered to +91 ${mobile} via Twilio Gateway! Please check your mobile phone messages.`);
        } else if (res.twilio_error) {
          setErrorMsg(`⚠️ Twilio Dispatch Warning: ${res.twilio_error}. Note: On Twilio Trial accounts, recipient numbers must be added under 'Verified Caller IDs' in Twilio Console. For immediate testing, code is: ${res.simulation_code || '123456'}`);
        } else {
          setSuccessMsg(`ℹ️ OTP generated (Twilio keys not set yet — add them in backend/.env to enable live SMS). Current test code: ${res.simulation_code || '123456'}`);
        }
      } else {
        setErrorMsg('Failed to send OTP. Please check your mobile number.');
      }
      setOtpLoading(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to dispatch SMS');
      setOtpLoading(false);
    }
  };

  // Verify Real OTP entered by citizen from their phone
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code received on your phone.');
      return;
    }
    setErrorMsg(null);
    setOtpLoading(true);
    try {
      const res = await verifyOtp(mobile, otp.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('Invalid or expired OTP. Please verify the code sent to your phone.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Official Username/Password login handler
  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please provide both Officer ID and Password.');
      return;
    }
    setErrorMsg(null);
    setOfficialLoading(true);
    try {
      const res = await loginPassword(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid Official Credentials. Please verify.');
    } finally {
      setOfficialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. Indian Tricolor Micro-Band */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" />
        <div className="h-full flex-1 bg-[#FFFFFF] border-y border-slate-200" />
        <div className="h-full flex-1 bg-[#138808]" />
      </div>

      {/* 2. Top Deep Navy Strip */}
      <div className="bg-[#0B2545] text-slate-200 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-blue-950">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 font-bold">नागरिकसेतु • NagrikSetu</span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">National Municipal Grievance & Urban Defect Intelligence Portal</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-emerald-300 font-bold">
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Helpline: 1913</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Authentication Center */}
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Brand Identity & Citizen Charter */}
          <div className="md:col-span-6 space-y-4">
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-[#0B2545] text-amber-400 flex items-center justify-center shadow-md border border-blue-900">
                <Shield className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#0B2545]">
                  Nagrik<span className="text-[#FF9933]">Setu</span>
                  <span className="text-sm font-bold text-blue-800 ml-2 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">AI</span>
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  नागरिक-प्रशासन शिकायत निवारण सेतु
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Unified citizen grievance portal for time-bound resolution of municipal defects across Urban Local Body departments. Powered by Twilio SMS OTP verification and instant email docket dispatch.
            </p>

            {/* Official e-Governance Authentication & SLA Assurance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 space-y-2 text-xs text-blue-950">
              <div className="font-bold flex items-center text-blue-900">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                <span>Verified National Grievance Redressal Assurance</span>
              </div>
              <ul className="text-[11px] text-blue-900 space-y-1 pl-1">
                <li>• <strong>Two-Factor SMS Verification:</strong> Dynamic 6-digit passcode sent directly to citizen's mobile.</li>
                <li>• <strong>Guaranteed Redressal SLA:</strong> 24h for Critical Hazards and 48–72h for Standard Grievances.</li>
              </ul>
            </div>

            {/* Citizen Charter Key SLA Metrics */}
            <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-2xs space-y-2.5 text-xs text-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B2545] border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Citizen Charter SLA Standards</span>
                <span className="text-emerald-700 font-bold">94.2% On-Time</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Critical Hazards</span>
                  <span className="font-bold text-rose-700 text-sm">Within 24 Hours</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Standard Grievance</span>
                  <span className="font-bold text-[#0B2545] text-sm">48 - 72 Hours</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="text-[11px] text-slate-500 flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>256-Bit SSL Encrypted Government Gateway (CERT-In Compliant)</span>
            </div>
          </div>

          {/* Right Column: Official Login Box */}
          <div className="md:col-span-6 bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
            
            {/* Card Top Header */}
            <div className="bg-[#0B2545] p-3 text-center text-white border-b border-blue-950">
              <div className="text-xs font-bold tracking-wide text-amber-300">USER AUTHENTICATION GATEWAY</div>
              <div className="text-[10px] text-slate-300">Secure Phone SMS OTP & Official Authority Credentials</div>
            </div>

            <div className="p-6">
              
              {/* Mode Switcher Tabs */}
              <div className="flex border border-slate-300 rounded-lg p-1 bg-slate-100 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('citizen');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    authMode === 'citizen'
                      ? 'bg-white text-[#0B2545] shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>Citizen (SMS OTP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('official');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    authMode === 'official'
                      ? 'bg-white text-[#0B2545] shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Officer Login</span>
                </button>
              </div>

              {/* Success Message */}
              {successMsg && (
                <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
                  <span className="leading-tight">{successMsg}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. CITIZEN LOGIN (Mobile + Real Twilio SMS OTP) */}
              {authMode === 'citizen' && (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Citizen Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex rounded-md shadow-2xs">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-100 text-slate-700 text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        disabled={otpSent}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#102A45] text-amber-400 font-bold rounded-md text-xs transition-colors shadow-2xs flex items-center justify-center space-x-1.5"
                    >
                      {otpLoading ? (
                        <span>Dispatching SMS...</span>
                      ) : (
                        <>
                          <Phone className="w-3.5 h-3.5" />
                          <span>Send OTP via SMS to Phone</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      
                      {/* SMS Sent Notice with Countdown */}
                      <div className="p-2.5 bg-blue-50 border border-blue-300 rounded text-xs space-y-1">
                        <div className="text-blue-950 font-semibold flex items-center justify-between">
                          <span>SMS dispatched to: <strong>+91 {mobile}</strong></span>
                          <span className="text-[10px] text-blue-700 flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            {formatTimer(countdown)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Check phone SMS inbox for code.</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={countdown > 250}
                            className="text-blue-700 hover:text-blue-900 font-semibold flex items-center disabled:opacity-50"
                          >
                            <RefreshCw className="w-2.5 h-2.5 mr-1" /> Resend SMS
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Enter 6-Digit OTP from SMS <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          autoFocus
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="• • • • • •"
                          className="block w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm font-black tracking-widest text-center text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={otpLoading || countdown <= 0}
                        className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md text-xs transition-colors shadow-2xs flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Verify SMS OTP & Enter Portal</span>
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Change Mobile Number
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}

              {/* 2. OFFICIAL AUTHORITY LOGIN */}
              {authMode === 'official' && (
                <form onSubmit={handleOfficialLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Officer ID / Username <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin, pwd_officer, water_officer"
                      className="block w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Password <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="block w-full px-3 py-2 rounded-md border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={officialLoading}
                    className="w-full py-2.5 px-4 bg-[#0B2545] hover:bg-[#102A45] text-amber-400 font-bold rounded-md text-xs transition-colors shadow-2xs flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Authenticate Session</span>
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <GovFooter />
    </div>
  );
};
