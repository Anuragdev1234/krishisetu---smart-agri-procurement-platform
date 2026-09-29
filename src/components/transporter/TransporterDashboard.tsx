import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Navigation, 
  FileCheck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  KeyRound,
  ArrowRight, 
  ExternalLink, 
  ChevronRight, 
  Check, 
  Radio, 
  Gauge, 
  Zap, 
  Sparkles, 
  Route,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Wrench,
  CheckSquare
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { DispatchTrip } from '../../types/procurement';
import { speechVoice } from '../../utils/speechVoice';
import { audioChime } from '../../utils/audioChime';
import { DeliveryReceiptModal } from './DeliveryReceiptModal';
import { RouteOptimizer } from './RouteOptimizer';

interface TransporterDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export interface CheckpointWorkDetails {
  km: number;
  name: string;
  tag: string;
  workHeading: string;
  workHindi: string;
  tasks: string[];
  actionLabel: string;
}

const CHECKPOINTS_DATA: CheckpointWorkDetails[] = [
  {
    km: 0,
    name: 'Karnal Mandi Gate 4 (Loading Dock)',
    tag: 'Dock Active',
    workHeading: 'Cargo Loading & Manifest Verification',
    workHindi: 'अनाज लोडिंग व डिजिटल ई-वे बिल सत्यापन',
    tasks: [
      'Pneumatic bulk grain loading (25.0 MT Wheat PBW-725)',
      'Gross tare-weight tare calibration on weighbridge',
      'Electronic RFID tamper bolt seal fastened (#WB-9921)',
      'Driver manifest biometrics & e-Challan verified'
    ],
    actionLabel: 'Complete Loading Work & Proceed to CP 02 ➔'
  },
  {
    km: 14,
    name: 'Taraori Toll Plaza (NH-44)',
    tag: 'FASTag Cleared',
    workHeading: 'FASTag Electronic Toll & Gross Axle Scanning',
    workHindi: 'फास्टैग टोल व एक्सल वजन जांच',
    tasks: [
      'Automated FASTag RFID lane scanner deducted ₹185 commercial toll',
      'Static-speed weigh-in-motion axle scan: 34,200 kg (compliant)',
      'DoCA central logistics server notified: Checkpoint 02 cleared'
    ],
    actionLabel: 'Complete Toll Clearance & Proceed to CP 03 ➔'
  },
  {
    km: 28,
    name: 'Samalkha Agro Corridor Checkpost',
    tag: 'Weigh Sensor',
    workHeading: 'Grain Security Seal & Moisture In-Transit Audit',
    workHindi: 'सुरक्षा सील व नमी ऑडिट',
    tasks: [
      'Physical & RFID tamper wire seal verified intact (#WB-9921)',
      'Corridor IoT temperature probe check: 18.2°C nominal',
      'Speed compliance check: 52 km/h maintained on NH-44 express corridor'
    ],
    actionLabel: 'Complete Security Audit & Proceed to CP 04 ➔'
  },
  {
    km: 36,
    name: 'Kurukshetra Industrial Crossing',
    tag: 'Patrol 52 km/h',
    workHeading: 'Rail Crossing Clearance & Final Mile Routing',
    workHindi: 'रेलवे क्रॉसिंग क्लीयरेंस व फाइनल अप्रोच',
    tasks: [
      'Bypassing Kurukshetra city congestion via Western agro bypass',
      'Railway signal level crossing green channel cleared',
      'FCI Silo Inbound receiving bay notified: ETA 8 minutes'
    ],
    actionLabel: 'Clear Crossing & Proceed to FCI Silo ➔'
  },
  {
    km: 42,
    name: 'Central FCI Silo Kurukshetra',
    tag: 'Unloading Bay',
    workHeading: 'Silo Weigh-Out & Receiver Handover OTP Verification',
    workHindi: 'साइलो अनलोडिंग व 4-डिजिट ओटीपी सत्यापन',
    tasks: [
      'Weighbridge gross tare check & digital net weight certificate',
      'Pneumatic grain auger unloading into FCI Silo Bin 04',
      '4-digit recipient verification OTP submission'
    ],
    actionLabel: 'Enter 4-Digit Handover OTP & Complete Delivery'
  }
];

export const TransporterDashboard: React.FC<TransporterDashboardProps> = ({ currentTab, onSelectTab }) => {
  const { dispatches, updateTripCheckpoint, resetTripCheckpoint, confirmChallanDelivery } = useProcurement();

  const [isOnDuty, setIsOnDuty] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<DispatchTrip>(dispatches[0]);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [signedChallan, setSignedChallan] = useState(false);
  const [lastNotice, setLastNotice] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Checkpoint Work & Auto-Proceed state
  const [isWorkingOnCheckpoint, setIsWorkingOnCheckpoint] = useState<boolean>(false);
  const [workProgress, setWorkProgress] = useState<number>(0);
  const [autoProceedWork, setAutoProceedWork] = useState<boolean>(false);
  const [completedWorkCheckpoints, setCompletedWorkCheckpoints] = useState<number[]>([0]);

  const activeTrip = selectedTrip || dispatches[0];

  const checkpoints = CHECKPOINTS_DATA.map(cp => ({
    name: cp.name,
    km: cp.km,
    tag: cp.tag
  }));

  // Resolve current active checkpoint index
  const getCurrentCpIndex = () => {
    if (activeTrip.completedKm >= 42) return 4;
    if (activeTrip.completedKm >= 36) return 3;
    if (activeTrip.completedKm >= 28) return 2;
    if (activeTrip.completedKm >= 14) return 1;
    return 0;
  };

  const currentCpIndex = getCurrentCpIndex();
  const currentCp = CHECKPOINTS_DATA[currentCpIndex];

  // Perform operational work at the current checkpoint, then proceed to next checkpoint
  const handlePerformWorkAndProceed = () => {
    if (!activeTrip || isWorkingOnCheckpoint) return;

    const nextCpIndex = Math.min(CHECKPOINTS_DATA.length - 1, currentCpIndex + 1);
    const nextCp = CHECKPOINTS_DATA[nextCpIndex];

    setIsWorkingOnCheckpoint(true);
    setWorkProgress(15);
    audioChime.playGateCallChime();

    speechVoice.speak(`Executing checkpoint operations at ${currentCp.name}. Verification in progress.`, 'en-IN');

    // Smooth work progress simulation
    let currentP = 15;
    const progressTimer = setInterval(() => {
      currentP += 28;
      if (currentP >= 100) {
        clearInterval(progressTimer);
        setWorkProgress(100);
      } else {
        setWorkProgress(currentP);
      }
    }, 250);

    setTimeout(() => {
      clearInterval(progressTimer);
      setWorkProgress(100);
      setIsWorkingOnCheckpoint(false);
      setCompletedWorkCheckpoints(prev => Array.from(new Set([...prev, currentCp.km])));
      audioChime.playSuccessChime();

      if (currentCpIndex < CHECKPOINTS_DATA.length - 1) {
        updateTripCheckpoint(activeTrip.tripId, nextCp.name, nextCp.km, 'in_transit');
        setLastNotice(`✓ Work completed at ${currentCp.name}. Vehicle dispatched to ${nextCp.name} (${nextCp.km} km / ${activeTrip.distanceKm} km).`);
        speechVoice.speak(`Work complete at ${currentCp.name}. Advancing vehicle to next checkpoint: ${nextCp.name}.`, 'en-IN');

        if (nextCp.km >= 42) {
          setTimeout(() => {
            setOtpModalOpen(true);
            setEnteredOtp('4918');
          }, 800);
        }
      } else {
        // Final destination work complete, open Handover OTP
        setLastNotice(`✓ Arrival at destination FCI Silo Kurukshetra. Ready for recipient handover OTP.`);
        setOtpModalOpen(true);
        setEnteredOtp('4918');
      }
    }, 1100);
  };

  // Auto-proceed listener: when autoProceedWork is enabled, automatically works and proceeds
  useEffect(() => {
    let timer: any;
    if (autoProceedWork && !isWorkingOnCheckpoint && activeTrip.completedKm < activeTrip.distanceKm && activeTrip.status !== 'delivered') {
      timer = setTimeout(() => {
        handlePerformWorkAndProceed();
      }, 1600);
    }
    return () => clearTimeout(timer);
  }, [autoProceedWork, activeTrip.completedKm, isWorkingOnCheckpoint, activeTrip.status]);

  // Reset route to origin
  const handleResetTrip = () => {
    setAutoProceedWork(false);
    setIsWorkingOnCheckpoint(false);
    setWorkProgress(0);
    setCompletedWorkCheckpoints([0]);
    resetTripCheckpoint(activeTrip.tripId);
    setLastNotice('Trip reset to origin loading dock (0 km). Ready for transit simulation.');
    speechVoice.speak('Trip reset to origin loading dock. Operations ready.', 'en-IN');
  };

  const handleAdvanceRoute = () => {
    handlePerformWorkAndProceed();
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = confirmChallanDelivery(activeTrip.tripId, enteredOtp);
    if (ok) {
      setOtpError(false);
      setOtpModalOpen(false);
      setEnteredOtp('');
    } else {
      setOtpError(true);
    }
  };

  const progressPercent = Math.round((activeTrip.completedKm / activeTrip.distanceKm) * 100);

  // Dedicated Route Optimizer Tab View
  if (currentTab === 'route_optimizer') {
    return (
      <RouteOptimizer 
        trip={activeTrip}
        onBackToCockpit={() => onSelectTab && onSelectTab('cockpit')}
        onApplyRoute={() => {
          if (onSelectTab) onSelectTab('cockpit');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Driver Cockpit Banner & Duty Toggle */}
      <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-2xl shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            🚛
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
              <span>National Grain Transit Logistics</span>
              <span>·</span>
              <span>Vehicle: UP 32 BN 4410 (Tata Signa 2823)</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              Driver: {activeTrip?.driverName || 'Rajesh Kumar'}
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">
              Authorized Transporter: Kisan Express Logistics Ltd · GPS Telemetry: Active · DL: DL14-2022-00918
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab && onSelectTab('route_optimizer')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900/90 hover:bg-blue-800 text-blue-100 border border-blue-700/80 text-xs font-bold transition-all shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Route Optimizer</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/30">
              Gate-Aware
            </span>
          </button>

          <button
            onClick={() => setIsOnDuty(!isOnDuty)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isOnDuty 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-neutral-700 text-neutral-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-white animate-pulse' : 'bg-neutral-400'}`} />
            <span>{isOnDuty ? 'On-Duty Dispatching' : 'Off-Duty Standby'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Current Trip Status */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Active Transit Run</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-mono font-bold text-neutral-900">
              {activeTrip.tripId}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              activeTrip.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
              activeTrip.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {activeTrip.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-100 truncate">
            {activeTrip.cropName} · {activeTrip.totalBags} Bags
          </p>
        </div>

        {/* Metric 2: Payload Capacity Gauge */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Payload Utilization</span>
            <span className="font-mono font-bold text-neutral-900">
              {activeTrip.netWeightMT} MT / 25.0 MT
            </span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${(activeTrip.netWeightMT / 25.0) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-neutral-100 text-neutral-600">
            <span>Axle Load Limit:</span>
            <span className="font-semibold text-emerald-700">Within Safe Limits</span>
          </div>
        </div>

        {/* Metric 3: Live ETA */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Estimated Destination ETA</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-neutral-900">
              {activeTrip.eta}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {activeTrip.distanceKm - activeTrip.completedKm} km left
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-100 truncate">
            Current: {activeTrip.currentCheckpoint}
          </p>
        </div>

        {/* Metric 4: Digital E-Challan */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">National E-Challan</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-mono font-bold text-blue-950 truncate">
              {activeTrip.eChallanNumber}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 mt-2 border-t border-neutral-100 text-neutral-600">
            <span>Handover Security OTP:</span>
            <span className="font-mono font-bold text-blue-900">••••</span>
          </div>
        </div>

      </div>

      {/* 3. Main Logistics View: Live Transit Route & Active Dispatches List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Transit Route Map & Trip Tracker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Live Dispatch Route & Milestone Telemetry
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {activeTrip.fromCenterName} ➔ {activeTrip.toWarehouseName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTrip.completedKm > 0 && (
                <button
                  onClick={handleResetTrip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors shadow-xs"
                  title="Reset trip back to loading dock (0 km)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Reset Trip</span>
                </button>
              )}

              <button
                onClick={() => onSelectTab && onSelectTab('route_optimizer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-colors shadow-xs"
                title="Calculate shortest path based on live gate congestion"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Optimize Route</span>
              </button>

              {activeTrip.status !== 'delivered' && (
                <button
                  onClick={() => setAutoProceedWork(!autoProceedWork)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                    autoProceedWork
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold animate-pulse'
                      : 'border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900'
                  }`}
                  title="Automatically perform work at each checkpoint and proceed forward"
                >
                  {autoProceedWork ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{autoProceedWork ? 'Pause Auto-Proceed' : 'Auto-Proceed Work'}</span>
                </button>
              )}

              {activeTrip.status !== 'delivered' && (
                <button
                  onClick={handleAdvanceRoute}
                  disabled={isWorkingOnCheckpoint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs"
                  title="Perform checkpoint work and advance vehicle to next checkpoint"
                >
                  {isWorkingOnCheckpoint ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Working...</span>
                    </>
                  ) : (
                    <>
                      <span>Advance Checkpoint</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Interactive Route Progress Diagram */}
          <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400">CORRIDOR: NH-44 HIGHWAY</span>
              <span className="font-mono text-neutral-300">
                {activeTrip.completedKm} km / {activeTrip.distanceKm} km ({progressPercent}%)
              </span>
            </div>

            {/* Simulated Road Line */}
            <div className="relative py-4">
              <div className="w-full bg-neutral-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Vehicle Icon on Road */}
              <div 
                className="absolute top-1 transform -translate-x-1/2 transition-all duration-500"
                style={{ left: `${Math.min(95, Math.max(5, progressPercent))}%` }}
              >
                <div className="p-1.5 bg-blue-600 text-white rounded-full shadow-lg ring-4 ring-blue-900 animate-pulse">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Checkpoint Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] pt-2 border-t border-neutral-800">
              {checkpoints.map((cp, idx) => {
                const isPassed = activeTrip.completedKm > cp.km || (cp.km === 42 && activeTrip.status === 'delivered');
                const isCurrent = !isPassed && (idx === currentCpIndex);
                return (
                  <div key={cp.name} className="space-y-0.5">
                    <span className="text-[10px] font-mono text-neutral-400">CP 0{idx + 1} ({cp.km} km)</span>
                    <p className={`font-semibold leading-tight text-[11px] ${
                      isPassed ? 'text-emerald-400' : isCurrent ? 'text-amber-300 font-bold' : 'text-neutral-500'
                    }`}>
                      {cp.name.split('(')[0]}
                    </p>
                    <span className={`text-[10px] font-mono block ${
                      isPassed ? 'text-emerald-400' : isCurrent ? 'text-amber-400 font-bold animate-pulse' : 'text-neutral-400'
                    }`}>
                      {isPassed ? '✓ Work Cleared' : isCurrent ? '📍 Active Work' : 'Upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {lastNotice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 font-medium flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-700 animate-pulse shrink-0" />
                <span>{lastNotice}</span>
              </div>
              <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                CORRIDOR TELEMETRY
              </span>
            </div>
          )}

          {/* Smart Gate-Congestion Route Optimization Advice */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <span className="font-bold text-blue-950 block">
                  AI Gate-Congestion Routing Active
                </span>
                <span className="text-[11px] text-blue-800">
                  Gate 1 Queue: +24 mins · Western Agro Bypass (Gate 4): 3 min wait.
                </span>
              </div>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('route_optimizer')}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 shadow-xs"
            >
              <span>View Route Options</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3b. Active Checkpoint Operations & Work Station */}
          <div className="p-4 bg-gradient-to-br from-white to-blue-50/50 rounded-xl border border-blue-200 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-700 text-white shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      CP 0{currentCpIndex + 1} OF 05
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                      Milestone: {currentCp.km} km
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900 mt-0.5">
                    {currentCp.workHeading}
                  </h4>
                  <p className="text-[11px] text-blue-900/80 font-medium">
                    {currentCp.workHindi} · {currentCp.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1.5 ${
                  autoProceedWork 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${autoProceedWork ? 'bg-amber-600 animate-ping' : 'bg-neutral-400'}`} />
                  <span>{autoProceedWork ? 'AUTO-PROCEED ON' : 'MANUAL CLEARANCE'}</span>
                </span>
              </div>
            </div>

            {/* Checkpoint Work Tasks Checklist */}
            <div className="space-y-1.5 pt-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Operational Tasks at this Station:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentCp.tasks.map((task, idx) => {
                  const isTaskDone = completedWorkCheckpoints.includes(currentCp.km) || activeTrip.completedKm > currentCp.km || (isWorkingOnCheckpoint && workProgress >= (idx + 1) * 25);
                  return (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 transition-all ${
                        isTaskDone 
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : isWorkingOnCheckpoint 
                          ? 'bg-blue-50/70 border-blue-200 text-blue-950 animate-pulse'
                          : 'bg-white border-neutral-200 text-neutral-700'
                      }`}
                    >
                      {isTaskDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : isWorkingOnCheckpoint ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-tight">{task}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live Work Progress */}
            {isWorkingOnCheckpoint && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                    <span>Executing Checkpoint Operations...</span>
                  </span>
                  <span className="font-bold text-blue-950">{workProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${workProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checkpoint Work Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-blue-100">
              <span className="text-[11px] text-neutral-500">
                {activeTrip.status === 'delivered' 
                  ? 'Consignment fully delivered at Kurukshetra FCI Silo.'
                  : currentCpIndex === 4
                  ? 'At Final Destination: Silo grain intake & Handover OTP verification required.'
                  : `Next Checkpoint: CP 0${currentCpIndex + 2} (${CHECKPOINTS_DATA[currentCpIndex + 1]?.name.split('(')[0]})`}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeTrip.status === 'delivered' ? (
                  <button
                    onClick={() => setIsReceiptOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>View Signed e-Challan</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePerformWorkAndProceed}
                    disabled={isWorkingOnCheckpoint}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isWorkingOnCheckpoint ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Performing Work...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{currentCp.actionLabel}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cargo & Dispatch Manifest Summary */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2">
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Cargo Manifest & Physical Sealing
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-neutral-700">
              <div>
                <span className="text-neutral-500 block text-[11px]">Consignor (Pickup):</span>
                <span className="font-semibold text-neutral-900">{activeTrip.fromCenterName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Consignee (Delivery):</span>
                <span className="font-semibold text-neutral-900">{activeTrip.toWarehouseName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Cargo Specification:</span>
                <span className="font-semibold text-neutral-900">{activeTrip.cropName} ({activeTrip.totalBags} Jute Bags)</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Certified Net Weight:</span>
                <span className="font-mono font-bold text-neutral-900">{activeTrip.netWeightMT} Metric Tonnes</span>
              </div>
            </div>
          </div>

          {/* End of Route Handover Action */}
          {activeTrip.status !== 'delivered' ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Arrived at FCI Silo Warehouse?</span>
                <p className="text-[11px] text-emerald-800">
                  Request destination warehouse officer for the 4-digit handover OTP to close challan.
                </p>
              </div>
              <button
                onClick={() => setOtpModalOpen(true)}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
              >
                Complete Delivery OTP
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">Challan Closed & Cargo Successfully Handed Over</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Delivered at {activeTrip.deliveredAt || '08:30 AM'}. Proof of delivery recorded on central DoCA ledger.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="px-3 py-1.5 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs whitespace-nowrap"
              >
                View Delivery Proof
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Ready Dispatches List & Digital E-Challan Sign-Off (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Ready Dispatches List */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900">
                Ready Dispatches at Mandis
              </h3>
              <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                {dispatches.length} Loads
              </span>
            </div>

            <div className="space-y-2.5">
              {dispatches.map((trip) => {
                const isSelected = activeTrip.tripId === trip.tripId;
                return (
                  <div
                    key={trip.tripId}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-neutral-900">{trip.tripId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        trip.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        trip.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 mt-1">
                      {trip.cropName} · {trip.netWeightMT} MT ({trip.totalBags} Bags)
                    </h4>

                    <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
                      <span className="truncate">{trip.toWarehouseName.split(',')[0]}</span>
                      <span className="font-mono text-neutral-600 shrink-0">{trip.distanceKm} km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Digital E-Challan & Driver Signature Box */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Digital Transit Sign-Off
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                LEGAL COMPLIANCE
              </span>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5">
              <p>
                <strong>Electronic Waybill Declaration:</strong> Driver certifies receipt of undamaged sealed jute bags from Mandi Weighbridge. Tamper-evident GPS geo-fencing enabled.
              </p>
              <div className="pt-2 flex justify-between font-mono text-[11px] text-neutral-700">
                <span>E-Challan: {activeTrip.eChallanNumber}</span>
                <span>Security Token: DOCA-LOG-2026</span>
              </div>
            </div>

            {/* Signature Box */}
            <div className="border border-dashed border-neutral-300 rounded-xl p-3 bg-neutral-50 text-center">
              <span className="text-[10px] text-neutral-400 block mb-1">DRIVER DIGITAL SIGNATURE</span>
              <div className="font-serif italic text-base text-neutral-800 font-bold select-none">
                Rajesh Kumar
              </div>
              <span className="text-[10px] text-emerald-700 font-mono block mt-1">
                ✓ Cryptographically Verified with AADHAAR e-Sign
              </span>
            </div>

            <button
              onClick={() => setSignedChallan(true)}
              disabled={signedChallan}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                signedChallan 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {signedChallan ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Challan e-Signed & Logged</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Sign & Acknowledge Cargo Load</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Handover OTP Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-neutral-200 p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">
                Warehouse Handover OTP
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Enter the 4-digit verification code provided by the receiving officer at {activeTrip.toWarehouseName}.
              </p>
              <p className="text-[11px] font-mono text-blue-800 font-bold mt-1">
                Demo OTP Code: {activeTrip.otpCode}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="• • • •"
                className="w-full text-center text-xl font-mono font-bold tracking-widest py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />

              {otpError && (
                <p className="text-xs text-rose-600 text-center font-medium">
                  Invalid OTP. Please check with warehouse officer.
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-800 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                >
                  Verify Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Delivery Certificate Modal */}
      <DeliveryReceiptModal
        trip={activeTrip}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

    </div>
  );
};
