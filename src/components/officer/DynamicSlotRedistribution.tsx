import React, { useState, useMemo } from 'react';
import { 
  Shuffle, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Users, 
  Sliders, 
  Sparkles, 
  Volume2, 
  Radio, 
  Send, 
  RotateCcw,
  Zap,
  Building2,
  TrendingDown,
  Info,
  ChevronRight,
  Truck
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking } from '../../types/procurement';
import { audioChime } from '../../utils/audioChime';
import { speechVoice } from '../../utils/speechVoice';

interface DynamicSlotRedistributionProps {
  onProceedNextCheckpoint?: () => void;
  standalone?: boolean;
}

export const DynamicSlotRedistribution: React.FC<DynamicSlotRedistributionProps> = ({
  onProceedNextCheckpoint,
  standalone = false
}) => {
  const { 
    bookings, 
    selectedCenter, 
    redistributeGateSlots, 
    reassignBookingGate, 
    sendSms,
    audioEnabled 
  } = useProcurement();

  // Configurable Safety Threshold (default: 10 vehicles per gate)
  const [safetyThreshold, setSafetyThreshold] = useState<number>(10);
  const [selectedSourceGate, setSelectedSourceGate] = useState<number>(2);
  const [selectedTargetGate, setSelectedTargetGate] = useState<number>(3);
  const [vehiclesToReroute, setVehiclesToReroute] = useState<number>(4);
  const [isAutoPilotEnabled, setIsAutoPilotEnabled] = useState<boolean>(false);
  const [lastExecutionReport, setLastExecutionReport] = useState<{
    count: number;
    sourceGate: number;
    targetGate: number;
    tokens: string[];
    timestamp: string;
  } | null>(null);

  // Compute live queue depth and wait times per gate (Gates 1, 2, 3, 4)
  const gateStats = useMemo(() => {
    return [1, 2, 3, 4].map(gateNum => {
      // Find bookings allocated to this gate that are still queued (booked or in_yard)
      const gateBookings = bookings.filter(b => (b.gateNumber === gateNum || (!b.gateNumber && gateNum === 2)) && (b.status === 'booked' || b.status === 'in_yard'));
      
      // Fixed base simulation values to realistically reflect yard vehicle arrivals
      const baseArrivals = gateNum === 2 ? 18 : gateNum === 1 ? 9 : gateNum === 3 ? 3 : 2;
      const count = Math.max(gateBookings.length, baseArrivals);
      const isExceeded = count > safetyThreshold;
      const utilizationPercent = Math.min(100, Math.round((count / (safetyThreshold * 1.5)) * 100));
      const avgWaitMins = gateNum === 2 ? 14.5 : gateNum === 1 ? 8.2 : gateNum === 3 ? 3.5 : 2.0;

      let gateName = 'Commercial Multi-Axle Lane';
      if (gateNum === 2) gateName = 'Tractor Trolley Direct Lane';
      if (gateNum === 3) gateName = 'Light Commercial & Pickup Lane';
      if (gateNum === 4) gateName = 'Outbound Silo & Weighbridge Lane';

      return {
        gateNumber: gateNum,
        gateName,
        activeQueue: count,
        isExceeded,
        excessCount: Math.max(0, count - safetyThreshold),
        utilizationPercent,
        avgWaitMins,
        bookings: gateBookings
      };
    });
  }, [bookings, safetyThreshold]);

  // Congested gates exceeding threshold
  const congestedGates = gateStats.filter(g => g.isExceeded);
  const mostCongestedGate = congestedGates.length > 0 
    ? congestedGates.sort((a, b) => b.activeQueue - a.activeQueue)[0] 
    : gateStats[1]; // default Gate 2

  // Under-utilized gates available as target recipients
  const availableTargetGates = gateStats.filter(g => g.activeQueue < safetyThreshold);
  const bestTargetGate = availableTargetGates.length > 0 
    ? availableTargetGates.sort((a, b) => a.activeQueue - b.activeQueue)[0] 
    : gateStats[2]; // default Gate 3

  // Eligible incoming farmers at source gate for individual or batch re-routing
  const incomingEligibleFarmers = useMemo(() => {
    return bookings.filter(b => 
      (b.gateNumber === selectedSourceGate || (!b.gateNumber && selectedSourceGate === 2)) && 
      (b.status === 'booked' || b.status === 'in_yard')
    );
  }, [bookings, selectedSourceGate]);

  // Execute batch redistribution
  const handleExecuteRedistribution = () => {
    const result = redistributeGateSlots(selectedSourceGate, selectedTargetGate, vehiclesToReroute);
    
    setLastExecutionReport({
      count: result.reassignedCount,
      sourceGate: selectedSourceGate,
      targetGate: selectedTargetGate,
      tokens: result.affectedTokens,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  };

  // Re-route single farmer
  const handleSingleFarmerReroute = (tokenNumber: string, targetGate: number) => {
    reassignBookingGate(tokenNumber, targetGate);
  };

  return (
    <div className={`space-y-6 ${standalone ? 'p-6 bg-neutral-50 min-h-screen' : ''}`}>
      
      {/* 1. Header Banner & Auto-Pilot Mode */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-neutral-900 text-white rounded-2xl shadow-sm border border-emerald-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Shuffle className="w-4 h-4 text-emerald-400" />
            <span>Mandi Yard Traffic Intelligence</span>
            <span>·</span>
            <span>Safety Threshold & Congestion Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Dynamic Slot & Gate Redistribution</span>
            {congestedGates.length > 0 && (
              <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {congestedGates.length} Gate Overload Alert
              </span>
            )}
          </h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Automatically monitors queue density across all entrance boom barriers. When a gate exceeds safety capacity limits, incoming farmers are dynamically re-routed to clear road bottlenecks.
          </p>
        </div>

        {/* Auto-Pilot Toggle & Threshold Sensitivity Setting */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 p-2 bg-neutral-900/80 rounded-xl border border-neutral-700 text-xs">
            <span className="text-neutral-400 font-medium">Auto-Pilot:</span>
            <button
              onClick={() => {
                setIsAutoPilotEnabled(!isAutoPilotEnabled);
                if (!isAutoPilotEnabled) {
                  audioChime.playSuccessChime();
                  speechVoice.speak('Auto-pilot slot redistribution activated. Gate thresholds actively balanced.', 'en-IN');
                }
              }}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                isAutoPilotEnabled 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAutoPilotEnabled ? 'Active (Auto-Balance)' : 'Manual Mode'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 p-2 bg-neutral-900/80 rounded-xl border border-neutral-700 text-xs font-mono">
            <span className="text-neutral-400 font-sans">Threshold:</span>
            <span className="font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              {safetyThreshold} Vehicles / Gate
            </span>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Gate Capacity & Overload Alert Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gateStats.map((gate) => {
          const isSelectedSource = selectedSourceGate === gate.gateNumber;
          const isSelectedTarget = selectedTargetGate === gate.gateNumber;

          return (
            <div 
              key={gate.gateNumber}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                gate.isExceeded 
                  ? 'bg-rose-50/90 border-rose-300 shadow-xs' 
                  : gate.activeQueue < safetyThreshold * 0.6 
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-xs' 
                    : 'bg-white border-neutral-200 shadow-xs'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-neutral-900 flex items-center gap-1">
                  <span>Gate #{gate.gateNumber}</span>
                  {gate.isExceeded && (
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  )}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  gate.isExceeded 
                    ? 'bg-rose-200 text-rose-900' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {gate.isExceeded ? `+${gate.excessCount} OVER THRESHOLD` : 'CAPACITY SAFE'}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 truncate mb-3">
                {gate.gateName}
              </p>

              {/* Queue Depth Metric */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black font-mono ${gate.isExceeded ? 'text-rose-950' : 'text-neutral-900'}`}>
                    {gate.activeQueue}
                  </span>
                  <span className="text-xs text-neutral-500">/ {safetyThreshold} max</span>
                </div>
                <span className="text-xs font-mono font-semibold text-neutral-600">
                  ~{gate.avgWaitMins}m wait
                </span>
              </div>

              {/* Lane Capacity Progress Bar with Threshold Marker Line */}
              <div className="w-full bg-neutral-200 rounded-full h-2.5 relative overflow-hidden mb-3">
                <div 
                  className={`h-2.5 rounded-full transition-all ${
                    gate.isExceeded ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, (gate.activeQueue / (safetyThreshold * 1.5)) * 100)}%` }}
                />
              </div>

              {/* Action Buttons to set as Source or Target */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200/60">
                <button
                  onClick={() => setSelectedSourceGate(gate.gateNumber)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    isSelectedSource 
                      ? 'bg-rose-700 text-white' 
                      : 'text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {isSelectedSource ? 'Source (Reroute From)' : 'Set as Source'}
                </button>

                <button
                  onClick={() => setSelectedTargetGate(gate.gateNumber)}
                  disabled={isSelectedSource}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    isSelectedTarget 
                      ? 'bg-emerald-700 text-white' 
                      : 'text-neutral-600 hover:bg-neutral-200 disabled:opacity-30'
                  }`}
                >
                  {isSelectedTarget ? 'Target (Send To)' : 'Set as Target'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. Algorithmic Re-routing Recommendation Card */}
      {mostCongestedGate.isExceeded && (
        <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    High Congestion Safety Trigger Detected
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Gate #{mostCongestedGate.gateNumber} Exceeded Limit
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mt-0.5">
                  Automated Recommendation: Re-route {vehiclesToReroute} incoming vehicles from Gate #{selectedSourceGate} ➔ Gate #{selectedTargetGate}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExecuteRedistribution}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                <Shuffle className="w-4 h-4" />
                <span>Execute Dynamic Re-Routing Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Impact Projection Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase block">
                Source Gate #{selectedSourceGate} Queue Impact
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-rose-700 font-mono">
                  {mostCongestedGate.activeQueue} ➔ {Math.max(0, mostCongestedGate.activeQueue - vehiclesToReroute)}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                  -28% Congestion
                </span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Prevents vehicle queue from spilling over onto the GT Road highway shoulder.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase block">
                Target Gate #{selectedTargetGate} Acceptance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-emerald-800 font-mono">
                  {gateStats[selectedTargetGate - 1]?.activeQueue || 3} ➔ {(gateStats[selectedTargetGate - 1]?.activeQueue || 3) + vehiclesToReroute}
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  Well Within Safe Limit
                </span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Fast-track weighbridge lane has available throughput for immediate intake.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase block">
                Farmer Wait-Time Slashed
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-emerald-800 font-mono">
                  14.5m ➔ 5.2m
                </span>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                  -64% Faster
                </span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Automated SMS alert dispatched to farmers with re-routed gate directions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Interactive Simulation & Controls Desk */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-neutral-900">
              Redistribution Parameter Configuration
            </h3>
          </div>
          <span className="text-xs text-neutral-500">
            Real-time APMC Traffic Re-balancing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          
          {/* Source & Target Gates */}
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-neutral-700 block">
              Congested Source Gate:
            </label>
            <select
              value={selectedSourceGate}
              onChange={(e) => setSelectedSourceGate(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white"
            >
              {gateStats.map(g => (
                <option key={g.gateNumber} value={g.gateNumber}>
                  Gate #{g.gateNumber} ({g.activeQueue} vehicles queued - {g.isExceeded ? 'OVERLOAD' : 'NORMAL'})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-400">
              Vehicles will be transferred away from this gate.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-neutral-700 block">
              Recipient Target Gate:
            </label>
            <select
              value={selectedTargetGate}
              onChange={(e) => setSelectedTargetGate(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white"
            >
              {gateStats.filter(g => g.gateNumber !== selectedSourceGate).map(g => (
                <option key={g.gateNumber} value={g.gateNumber}>
                  Gate #{g.gateNumber} ({g.activeQueue} queued - {safetyThreshold - g.activeQueue} slots open)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-neutral-400">
              Under-utilized lane with fast throughput.
            </p>
          </div>

          {/* Number of vehicles to re-route */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-semibold text-neutral-700">
              <span>Vehicles to Re-route:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {vehiclesToReroute} Vehicles
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={vehiclesToReroute}
              onChange={(e) => setVehiclesToReroute(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
              <span>1 (Minor Relief)</span>
              <span>4 (Recommended)</span>
              <span>8 (Maximum Flush)</span>
            </div>
          </div>

        </div>

        {/* Safety Threshold Sensitivity Slider */}
        <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-700 whitespace-nowrap">
              Safety Trigger Threshold:
            </span>
            <input
              type="range"
              min={5}
              max={18}
              value={safetyThreshold}
              onChange={(e) => setSafetyThreshold(Number(e.target.value))}
              className="w-36 accent-amber-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              {safetyThreshold} max vehicles
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteRedistribution}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Apply Redistribution Plan ({vehiclesToReroute} Vehicles)</span>
            </button>
          </div>
        </div>

      </div>

      {/* 5. Last Execution Toast / Audit Report Banner */}
      {lastExecutionReport && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">
                  Redistribution Dispatched Successfully
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  {lastExecutionReport.timestamp}
                </span>
              </div>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Re-routed <strong>{lastExecutionReport.count} incoming vehicles</strong> from <strong>Gate #{lastExecutionReport.sourceGate}</strong> to <strong>Gate #{lastExecutionReport.targetGate}</strong>. DLT-registered SMS notifications sent to farmer mobile phones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-900 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 shrink-0">
            <span>TOKENS: {lastExecutionReport.tokens.join(', ')}</span>
          </div>
        </div>
      )}

      {/* 6. Live Incoming Farmer Roster at Congested Gate (With Individual Reassignment) */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span>Incoming Queue Roster for Gate #{selectedSourceGate}</span>
              <span className="text-xs font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                {incomingEligibleFarmers.length} Scheduled
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Officers can re-route the entire batch above or individually divert specific farmers to less congested gates.
            </p>
          </div>

          <button
            onClick={() => handleExecuteRedistribution()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Shuffle className="w-3 h-3 text-emerald-400" />
            <span>Re-Route Next {vehiclesToReroute} Vehicles</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Token & Time Slot</th>
                <th className="py-2.5 px-3">Farmer & Phone</th>
                <th className="py-2.5 px-3">Crop & Volume</th>
                <th className="py-2.5 px-3">Vehicle Details</th>
                <th className="py-2.5 px-3">Current Gate</th>
                <th className="py-2.5 px-3 text-right">Individual Re-Route Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {incomingEligibleFarmers.map((farmer, idx) => {
                return (
                  <tr key={farmer.tokenNumber} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-emerald-950 block">
                        {farmer.tokenNumber}
                      </span>
                      <span className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{farmer.timeSlot}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-neutral-900 block">{farmer.farmerName}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{farmer.farmerPhone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-neutral-800 font-semibold block">{farmer.cropName}</span>
                      <span className="text-[10px] text-neutral-500">{farmer.estimatedWeightQtl} Quintals (~{farmer.bagsCount} Bags)</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-neutral-800 block">{farmer.vehicleNumber}</span>
                      <span className="text-[10px] text-neutral-500">{farmer.vehicleType}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        Gate #{farmer.gateNumber || selectedSourceGate}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSingleFarmerReroute(farmer.tokenNumber, 3)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-bold transition-all shadow-2xs"
                          title="Re-route this farmer to Gate 3"
                        >
                          ➔ Gate 3 (Light)
                        </button>

                        <button
                          onClick={() => handleSingleFarmerReroute(farmer.tokenNumber, 1)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-[11px] font-bold transition-all shadow-2xs"
                          title="Re-route this farmer to Gate 1"
                        >
                          ➔ Gate 1
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
