import React, { useState } from 'react';
import { Sparkles, Play, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, X, ChevronUp, ChevronDown } from 'lucide-react';
import { submitComplaint, updateClusterStatus, submitCitizenFeedback, resetDemoData } from '../../api';

interface DemoControllerProps {
  onRefresh: () => void;
  onSwitchRole: (role: 'citizen' | 'admin' | 'officer', dept?: string) => void;
  onSelectCluster: (clusterId: string) => void;
}

export const DemoScenarioController: React.FC<DemoControllerProps> = ({
  onRefresh,
  onSwitchRole,
  onSelectCluster
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);

  // Step 1: Citizen 1 submits "Huge pothole near XYZ School"
  const handleStep1 = async () => {
    setIsExecuting(true);
    setStepMessage('Submitting Citizen 1 Pothole Grievance...');
    try {
      await submitComplaint({
        citizen_mobile: '9820123456',
        citizen_name: 'Rahul Verma',
        raw_text: 'Huge pothole near XYZ School, traffic getting heavily choked.',
        category: 'Road Damage',
        latitude: 19.2612,
        longitude: 72.9734,
        address: 'Ghodbunder Road near XYZ School',
        ward: 'Ward 14'
      });
      setIsExecuting(false);
      setStepMessage('✓ Step 1 Complete: AI classified & routed to PWD. Created/Updated RC-1042.');
      setCurrentStep(2);
      onRefresh();
      onSwitchRole('citizen');
    } catch (e) {
      console.error(e);
      setIsExecuting(false);
    }
  };

  // Step 2: Citizen 2 submits "My bike got damaged on this road" -> Auto-clusters!
  const handleStep2 = async () => {
    setIsExecuting(true);
    setStepMessage('Submitting Citizen 2 report with semantic difference...');
    try {
      await submitComplaint({
        citizen_mobile: '9820234567',
        citizen_name: 'Priya Sharma',
        raw_text: 'My bike got severely damaged because of the road crater near the school!',
        category: 'Road Damage',
        latitude: 19.2614,
        longitude: 72.9736,
        address: 'Ghodbunder Road near XYZ School',
        ward: 'Ward 14'
      });
      setIsExecuting(false);
      setStepMessage('✓ Step 2 Complete: AI Semantic Similarity & Geo proximity matched to existing cluster RC-1042!');
      setCurrentStep(3);
      onRefresh();
      onSwitchRole('admin');
      onSelectCluster('RC-1042');
    } catch (e) {
      console.error(e);
      setIsExecuting(false);
    }
  };

  // Step 3: Admin inspects Top Civic Problems & Issue Intelligence
  const handleStep3 = () => {
    onSwitchRole('admin');
    onSelectCluster('RC-1042');
    setStepMessage('✓ Step 3: Inspecting RC-1042 Issue Intelligence ("Why is this Critical?" factor breakdown).');
    setCurrentStep(4);
  };

  // Step 4: PWD Officer acknowledges, assigns Team 3, and marks Resolved
  const handleStep4 = async () => {
    setIsExecuting(true);
    setStepMessage('Simulating PWD Officer field repair & resolution...');
    try {
      await updateClusterStatus('RC-1042', {
        status: 'resolved',
        notes: 'Cold mix bitumen asphalt laid by Road Maintenance Team 3. Pothole leveled and compacted.',
        changed_by: 'Er. Rajesh Kulkarni (PWD Executive Engineer)'
      });
      setIsExecuting(false);
      setStepMessage('✓ Step 4 Complete: Issue marked Resolved by PWD officer with work evidence.');
      setCurrentStep(5);
      onRefresh();
      onSwitchRole('officer', 'PWD');
    } catch (e) {
      console.error(e);
      setIsExecuting(false);
    }
  };

  // Step 5: Closed-Loop Resolution Verification demonstration (Failed Resolution Alert!)
  const handleStep5 = async () => {
    setIsExecuting(true);
    setStepMessage('Simulating new complaint post-resolution from same geographic zone...');
    try {
      // Submit new complaint at same spot after resolution
      await submitComplaint({
        citizen_mobile: '9820345678',
        citizen_name: 'Amit Patel',
        raw_text: 'The pothole repair broke again after rain! Road is damaged again outside XYZ School.',
        category: 'Road Damage',
        latitude: 19.2613,
        longitude: 72.9735,
        address: 'Ghodbunder Road near XYZ School',
        ward: 'Ward 14'
      });
      setIsExecuting(false);
      setStepMessage('🚨 Closed-Loop Verification Triggered: ⚠ POSSIBLE FAILED RESOLUTION alert generated!');
      onRefresh();
      onSwitchRole('admin');
      onSelectCluster('RC-1042');
    } catch (e) {
      console.error(e);
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    setIsExecuting(true);
    await resetDemoData();
    setIsExecuting(false);
    setCurrentStep(1);
    setStepMessage('Demo database reset to initial pristine seed state.');
    onRefresh();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden">
        {/* Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-black tracking-wide">
              Live Demo Evaluator Flow (5 Steps)
            </span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>

        {isExpanded && (
          <div className="p-4 space-y-3 text-xs">
            <p className="text-[11px] text-slate-300">
              Run the end-to-end Problem Statement workflow in 1 click:
            </p>

            {/* Stepper buttons */}
            <div className="space-y-1.5">
              <button
                onClick={handleStep1}
                disabled={isExecuting}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  currentStep === 1
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>1. Citizen 1: Report Pothole</span>
                <Play className="w-3 h-3 shrink-0" />
              </button>

              <button
                onClick={handleStep2}
                disabled={isExecuting}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  currentStep === 2
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>2. Citizen 2: Bike Damage → Auto-Clusters!</span>
                <Play className="w-3 h-3 shrink-0" />
              </button>

              <button
                onClick={handleStep3}
                disabled={isExecuting}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  currentStep === 3
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>3. Admin: Inspect RC-1042 Intelligence</span>
                <Play className="w-3 h-3 shrink-0" />
              </button>

              <button
                onClick={handleStep4}
                disabled={isExecuting}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  currentStep === 4
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>4. PWD Officer: Assign Team & Mark Resolved</span>
                <Play className="w-3 h-3 shrink-0" />
              </button>

              <button
                onClick={handleStep5}
                disabled={isExecuting}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  currentStep === 5
                    ? 'bg-rose-600 text-white border-rose-400 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>5. 🚨 Trigger Resolution Verification Alert</span>
                <Play className="w-3 h-3 shrink-0" />
              </button>
            </div>

            {/* Status message */}
            {stepMessage && (
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-blue-300 font-medium leading-tight">
                {stepMessage}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={isExecuting}
              className="w-full py-1.5 text-[11px] text-slate-400 hover:text-white flex items-center justify-center space-x-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo to Initial State</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
