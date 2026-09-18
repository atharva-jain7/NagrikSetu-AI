import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Phone, CheckCircle2, AlertCircle, X, Save, ExternalLink } from 'lucide-react';
import { getTwilioStatus, setTwilioCredentials } from '../../api';

interface TwilioConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TwilioConfigModal: React.FC<TwilioConfigModalProps> = ({ isOpen, onClose }) => {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await getTwilioStatus();
      setStatus(res);
      if (res.configured) {
        setPhoneNumber(res.phone_number !== 'Not Set' ? res.phone_number : '');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountSid.trim() || !authToken.trim() || !phoneNumber.trim()) {
      setMsg({ type: 'error', text: 'Please provide Account SID, Auth Token, and Twilio Phone Number.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await setTwilioCredentials(accountSid, authToken, phoneNumber);
      setStatus(res);
      setMsg({ type: 'success', text: '✅ Twilio Gateway configured! Live SMS enabled.' });
      setAccountSid('');
      setAuthToken('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update credentials' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0B2545] p-4 text-white flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">Twilio SMS Gateway Configuration</h3>
              <p className="text-[10px] text-slate-300">Live phone SMS delivery for citizen OTPs & receipts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          {/* Status Indicator */}
          {status && (
            <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
              status.configured ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${status.configured ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold">{status.mode}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Account SID: {status.account_sid} | Phone: {status.phone_number}
                </div>
              </div>
            </div>
          )}

          {msg && (
            <div className={`p-2.5 rounded text-xs flex items-center space-x-1.5 ${
              msg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Twilio Account SID</label>
              <input
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="e.g. ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Twilio Auth Token</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Enter auth token"
                className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Twilio Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +1234567890"
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-[#0B2545] hover:bg-[#102A45] text-amber-400 font-bold flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save & Enable SMS'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
