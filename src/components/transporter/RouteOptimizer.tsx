import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Truck, 
  Clock, 
  MapPin, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Gauge, 
  Radio, 
  ChevronRight,
  TrendingDown,
  DollarSign,
  Fuel,
  Sliders,
  Check
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { DispatchTrip } from '../../types/procurement';
import { speechVoice } from '../../utils/speechVoice';
import { audioChime } from '../../utils/audioChime';

export interface GateCongestionData {
  gateId: string;
  name: string;
  targetVehicleTypes: string;
  queueCount: number;
  avgScanSeconds: number;
  estimatedWaitMinutes: number;
  status: 'optimal' | 'moderate' | 'congested';
  boomBarrierStatus: 'Active Auto' | 'Manual Override';
  intakeBay: string;
}

export interface CandidateRoute {
  id: string;
  name: string;
  code: string;
  targetGateId: string;
  targetGateName: string;
  distanceKm: number;
  roadType: string;
  avgSpeedKmh: number;
  baseDriveMinutes: number;
  gateDelayMinutes: number;
  totalJourneyMinutes: number;
  tollCostInr: number;
  fuelEstimatedInr: number;
  fuelSavedInr: number;
  isRecommended: boolean;
  congestionTag: string;
  description: string;
  waypoints: { name: string; km: number; condition: string }[];
}

interface RouteOptimizerProps {
  trip?: DispatchTrip;
  onApplyRoute?: (route: CandidateRoute) => void;
  onBackToCockpit?: () => void;
}

export const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ 
  trip, 
  onApplyRoute, 
  onBackToCockpit 
}) => {
  const { dispatches, updateTripCheckpoint } = useProcurement();
  const activeTrip = trip || dispatches[0];

  // Live Gate Congestion State (Simulatable)
  const [gates, setGates] = useState<GateCongestionData[]>([
    {
      gateId: 'G1',
      name: 'Gate 1 (NH-44 Heavy Trailer Dock)',
      targetVehicleTypes: 'Trailers & Multi-Axle Trucks (>20 MT)',
      queueCount: 16,
      avgScanSeconds: 65,
      estimatedWaitMinutes: 24,
      status: 'congested',
      boomBarrierStatus: 'Active Auto',
      intakeBay: 'Bulk Silo Hopper A'
    },
    {
      gateId: 'G2',
      name: 'Gate 2 (Central Mandi Yard Gate)',
      targetVehicleTypes: 'Tractor Trolleys & Small Trucks',
      queueCount: 9,
      avgScanSeconds: 45,
      estimatedWaitMinutes: 12,
      status: 'moderate',
      boomBarrierStatus: 'Active Auto',
      intakeBay: 'Covered Shed Intake B'
    },
    {
      gateId: 'G3',
      name: 'Gate 3 (Express Sample & Inspection Bay)',
      targetVehicleTypes: 'Medium Commercial Vehicles (LCV)',
      queueCount: 4,
      avgScanSeconds: 35,
      estimatedWaitMinutes: 6,
      status: 'optimal',
      boomBarrierStatus: 'Active Auto',
      intakeBay: 'Rapid Weighbridge 3'
    },
    {
      gateId: 'G4',
      name: 'Gate 4 (Western Bypass Rail-Head Logistics)',
      targetVehicleTypes: 'Buffer Stock Evacuation & Direct Railhead',
      queueCount: 2,
      avgScanSeconds: 28,
      estimatedWaitMinutes: 3,
      status: 'optimal',
      boomBarrierStatus: 'Active Auto',
      intakeBay: 'Dedicated FCI Silo Rail-Bay 4'
    }
  ]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>('route_bypass_g4');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [lastRerouteReason, setLastRerouteReason] = useState<string | null>(
    'AI Optimizer auto-diverted vehicle away from Gate 1 queue: 21 mins saved via Gate 4 Western Bypass'
  );

  // Dynamic candidate routes based on current gate congestion
  const getCandidateRoutes = (): CandidateRoute[] => {
    const g1Wait = gates.find(g => g.gateId === 'G1')?.estimatedWaitMinutes || 24;
    const g2Wait = gates.find(g => g.gateId === 'G2')?.estimatedWaitMinutes || 12;
    const g4Wait = gates.find(g => g.gateId === 'G4')?.estimatedWaitMinutes || 3;

    // Route 1: Direct Highway (via Gate 1)
    const r1Distance = 38.5;
    const r1DriveMins = 44;
    const r1Total = r1DriveMins + g1Wait;

    // Route 2: Western Agro Bypass (via Gate 4 Logistics Bypass)
    const r2Distance = 41.2;
    const r2DriveMins = 42; // Higher corridor speed (60 km/h)
    const r2Total = r2DriveMins + g4Wait;

    // Route 3: State Highway 11 Rural Link (via Gate 2)
    const r3Distance = 45.0;
    const r3DriveMins = 55;
    const r3Total = r3DriveMins + g2Wait;

    // Determine the optimal route by minimum Total Journey Time
    const minTotalTime = Math.min(r1Total, r2Total, r3Total);

    return [
      {
        id: 'route_bypass_g4',
        name: 'Western Agro Bypass & Gate 4 Corridor',
        code: 'ALT-WEST-G4',
        targetGateId: 'G4',
        targetGateName: 'Gate 4 (Logistics Rail-Head)',
        distanceKm: r2Distance,
        roadType: '4-Lane Express Agro-Corridor (Speed: 60 km/h)',
        avgSpeedKmh: 58.5,
        baseDriveMinutes: r2DriveMins,
        gateDelayMinutes: g4Wait,
        totalJourneyMinutes: r2Total,
        tollCostInr: 90,
        fuelEstimatedInr: 1180,
        fuelSavedInr: Math.max(0, 1420 - 1180),
        isRecommended: r2Total === minTotalTime,
        congestionTag: 'Lowest Yard Congestion (3 min wait)',
        description: 'Bypasses city centre and NH-44 toll bottlenecks. Feeds directly into Gate 4 automated optical green channel.',
        waypoints: [
          { name: 'Karnal Mandi Loading Dock', km: 0, condition: 'Clear' },
          { name: 'Western Outer Ring Road Interchange', km: 12.4, condition: 'Flowing (65 km/h)' },
          { name: 'Samalkha Agro Logistics Link', km: 26.8, condition: 'Paved Agro Corridor' },
          { name: 'Gate 4 Rail-Head Entrance', km: 41.2, condition: 'Zero Queue (2 Trucks)' }
        ]
      },
      {
        id: 'route_nh44_g1',
        name: 'Standard National Highway (NH-44 Corridor)',
        code: 'STD-NH44-G1',
        targetGateId: 'G1',
        targetGateName: 'Gate 1 (Heavy Dock)',
        distanceKm: r1Distance,
        roadType: '6-Lane National Expressway (Speed: 52 km/h)',
        avgSpeedKmh: 52.0,
        baseDriveMinutes: r1DriveMins,
        gateDelayMinutes: g1Wait,
        totalJourneyMinutes: r1Total,
        tollCostInr: 140,
        fuelEstimatedInr: 1420,
        fuelSavedInr: 0,
        isRecommended: r1Total === minTotalTime,
        congestionTag: g1Wait > 20 ? 'Gate 1 Backlog (+24m)' : 'Standard Flow',
        description: 'Shortest linear distance, but high risk of entry bottleneck due to multi-axle trailer queue at Gate 1.',
        waypoints: [
          { name: 'Karnal Mandi Loading Dock', km: 0, condition: 'Clear' },
          { name: 'Taraori Toll Plaza', km: 14.0, condition: 'FASTag Active' },
          { name: 'Kurukshetra Industrial Bypass', km: 32.5, condition: 'Moderate Traffic' },
          { name: 'Gate 1 Intake Weighbridge', km: 38.5, condition: `Backlogged (${g1Wait} mins queue)` }
        ]
      },
      {
        id: 'route_sh11_g2',
        name: 'State Highway 11 & Rural Link',
        code: 'RUR-SH11-G2',
        targetGateId: 'G2',
        targetGateName: 'Gate 2 (Central Mandi)',
        distanceKm: r3Distance,
        roadType: '2-Lane State Road (Speed: 42 km/h)',
        avgSpeedKmh: 42.0,
        baseDriveMinutes: r3DriveMins,
        gateDelayMinutes: g2Wait,
        totalJourneyMinutes: r3Total,
        tollCostInr: 0,
        fuelEstimatedInr: 1390,
        fuelSavedInr: 30,
        isRecommended: r3Total === minTotalTime,
        congestionTag: 'Toll-Free Route (Slower Pacing)',
        description: 'Zero toll plazas, but encounters village crossings and speed humps. Suitable for off-peak daylight hours.',
        waypoints: [
          { name: 'Karnal Mandi Loading Dock', km: 0, condition: 'Clear' },
          { name: 'Nisang Rural Agro Crossing', km: 18.2, condition: 'Village Slow-Zone' },
          { name: 'Jyotisar Canal Link', km: 34.0, condition: 'Narrow 2-Lane' },
          { name: 'Gate 2 Tractor Entrance', km: 45.0, condition: `Queue: ${g2Wait} mins` }
        ]
      }
    ];
  };

  const routes = getCandidateRoutes();
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const recommendedRoute = routes.find(r => r.isRecommended) || routes[0];

  // Handler: Apply Route to Active GPS Telemetry
  const handleApplyRoute = (route: CandidateRoute) => {
    setSelectedRouteId(route.id);
    
    // Update active trip checkpoints & distance in ProcurementContext
    const newEta = `${route.totalJourneyMinutes} mins (${Math.round(route.distanceKm)} km)`;
    updateTripCheckpoint(
      activeTrip.tripId, 
      `En route via ${route.name} ➔ Target: ${route.targetGateName}`,
      Math.min(activeTrip.completedKm, route.distanceKm - 5),
      activeTrip.status === 'delivered' ? 'delivered' : 'in_transit'
    );

    audioChime.playGateCallChime();
    speechVoice.speak(
      `Route optimized. Navigating via ${route.name} targeting ${route.targetGateName}. Estimated arrival in ${route.totalJourneyMinutes} minutes.`,
      'en-IN'
    );

    setAppliedNotice(`✓ Telemetry synchronized: ${route.name} applied to onboard GPS. Target gate: ${route.targetGateName}.`);
    setTimeout(() => setAppliedNotice(null), 4500);

    if (onApplyRoute) {
      onApplyRoute(route);
    }
  };

  // Handler: Simulate Live Gate Congestion Spike at Gate 1
  const handleToggleCongestionSpike = () => {
    if (!isSimulatingSpike) {
      setIsSimulatingSpike(true);
      setGates(prev => prev.map(g => {
        if (g.gateId === 'G1') {
          return {
            ...g,
            queueCount: 29,
            estimatedWaitMinutes: 44,
            status: 'congested'
          };
        }
        return g;
      }));
      setLastRerouteReason('⚠️ LIVE ALERT: Heavy 29-truck gridlock detected at Gate 1 (+44 mins delay). System recommends auto-switch to Western Agro Bypass.');
      audioChime.playGateCallChime();
      speechVoice.speak('Traffic alert. Severe congestion detected at Gate 1. Auto rerouting to Gate 4 Bypass.', 'en-IN');
    } else {
      setIsSimulatingSpike(false);
      setGates(prev => prev.map(g => {
        if (g.gateId === 'G1') {
          return {
            ...g,
            queueCount: 16,
            estimatedWaitMinutes: 24,
            status: 'congested'
          };
        }
        return g;
      }));
      setLastRerouteReason('Gate 1 cleared back to standard 24-minute queue.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>AI Dynamic Corridor Routing</span>
            <span>·</span>
            <span>Live Gate-Congestion Telemetry</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Smart Transporter Route & Gate Optimization
          </h1>
          <p className="text-xs text-blue-200 mt-0.5">
            Calculates the shortest and fastest path by combining highway driving speeds with real-time intake weighbridge queues
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Congestion Spike Simulator Button */}
          <button
            onClick={handleToggleCongestionSpike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isSimulatingSpike 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSimulatingSpike ? 'Reset Gate 1 Surge' : 'Simulate Gate 1 Surge (+44m)'}</span>
          </button>

          {onBackToCockpit && (
            <button
              onClick={onBackToCockpit}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Back to Cockpit
            </button>
          )}
        </div>
      </div>

      {appliedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{appliedNotice}</span>
          </div>
          <span className="font-mono text-emerald-900 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
            GPS SYNCHRONIZED
          </span>
        </div>
      )}

      {/* 2. Live Mandi Gate Congestion Status Strip */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
            <h3 className="text-sm font-bold text-neutral-900">
              Live Mandi Gate Congestion & Boom Barrier Telemetry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Auto-refreshed every 15s via APMC Laser Counters
          </span>
        </div>

        {/* Gate Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {gates.map((g) => {
            const isTarget = selectedRoute.targetGateId === g.gateId;
            return (
              <div 
                key={g.gateId}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTarget 
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs' 
                    : 'border-neutral-200 bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{g.gateId}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    g.status === 'optimal' ? 'bg-emerald-100 text-emerald-800' :
                    g.status === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800 font-extrabold animate-pulse'
                  }`}>
                    {g.status}
                  </span>
                </div>

                <p className="text-xs font-semibold text-neutral-800 mt-1 truncate">
                  {g.name.split('(')[1]?.replace(')', '') || g.name}
                </p>

                <div className="mt-2.5 pt-2 border-t border-neutral-200/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Queue Delay</span>
                    <span className={`font-mono text-sm font-extrabold ${
                      g.status === 'congested' ? 'text-rose-700' :
                      g.status === 'moderate' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      +{g.estimatedWaitMinutes} mins
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block">Waiting</span>
                    <span className="font-mono text-xs font-bold text-neutral-800">
                      {g.queueCount} trucks
                    </span>
                  </div>
                </div>

                {isTarget && (
                  <div className="mt-2 pt-1 text-[10px] font-bold text-blue-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-blue-700" />
                    <span>Selected Destination Gate</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {lastRerouteReason && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{lastRerouteReason}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded shrink-0">
              ALGORITHMIC DISPATCH
            </span>
          </div>
        )}
      </div>

      {/* 3. Interactive Route Comparison & Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Candidate Route Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Calculated Corridor Options
              </h3>
              <p className="text-xs text-neutral-500">
                Sorted by Total Effective Journey Time (Road Transit + Gate Intake Queue)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-1 rounded-lg">
              Truck: {activeTrip.truckNumber} (25 MT)
            </span>
          </div>

          {/* Route Cards */}
          <div className="space-y-3">
            {routes.map((route) => {
              const isSelected = selectedRoute.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                        {route.code}
                      </span>
                      <h4 className="font-bold text-sm text-neutral-900">
                        {route.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {route.isRecommended && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3" />
                          <span>Shortest & Fastest</span>
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-neutral-700">
                        {route.distanceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-neutral-100 text-center">
                    <div className="p-2 bg-neutral-50 rounded-xl">
                      <span className="text-[10px] text-neutral-500 block">Highway Driving</span>
                      <span className="font-mono font-bold text-xs text-neutral-800">
                        {route.baseDriveMinutes} mins
                      </span>
                    </div>

                    <div className="p-2 bg-neutral-50 rounded-xl">
                      <span className="text-[10px] text-neutral-500 block">Gate Queue Delay</span>
                      <span className={`font-mono font-bold text-xs ${
                        route.gateDelayMinutes > 15 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        +{route.gateDelayMinutes} mins
                      </span>
                    </div>

                    <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200">
                      <span className="text-[10px] text-blue-800 font-bold block">Total Effective Time</span>
                      <span className="font-mono font-extrabold text-sm text-blue-950">
                        {route.totalJourneyMinutes} mins
                      </span>
                    </div>

                    <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-800 font-bold block">Fuel & Toll Savings</span>
                      <span className="font-mono font-bold text-xs text-emerald-950">
                        {route.fuelSavedInr > 0 ? `Save ₹${route.fuelSavedInr}` : 'Baseline Cost'}
                      </span>
                    </div>
                  </div>

                  {/* Route Details & Action */}
                  <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div className="text-neutral-600 text-[11px]">
                      <span>Target: <strong className="text-neutral-900">{route.targetGateName}</strong></span>
                      <span className="mx-1.5">·</span>
                      <span className="text-neutral-500">{route.roadType}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyRoute(route);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-blue-800 text-white hover:bg-blue-700' 
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                      >
                        <span>Apply & Sync GPS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Visual Corridor Diagram & Turn-by-Turn Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Visual Route Corridor Map (SVG Diagram) */}
          <div className="bg-neutral-900 text-white rounded-2xl p-5 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span className="font-bold tracking-wide">Dynamic Corridor Topology</span>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">
                {selectedRoute.code}
              </span>
            </div>

            {/* SVG Corridor Schematic */}
            <div className="relative bg-neutral-950 rounded-xl p-4 border border-neutral-800 overflow-hidden">
              <svg viewBox="0 0 400 240" className="w-full h-auto">
                <defs>
                  <linearGradient id="optGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="20" y1="60" x2="380" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="380" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="20" y1="180" x2="380" y2="180" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Path 1: NH-44 Highway (Top) */}
                <path 
                  d="M 50 120 C 120 60, 260 60, 330 60" 
                  fill="none" 
                  stroke={selectedRoute.id === 'route_nh44_g1' ? '#3b82f6' : '#475569'} 
                  strokeWidth={selectedRoute.id === 'route_nh44_g1' ? 4 : 2}
                  strokeDasharray={selectedRoute.id === 'route_nh44_g1' ? 'none' : '4 4'}
                />

                {/* Path 2: Western Bypass (Middle / Optimal) */}
                <path 
                  d="M 50 120 C 130 120, 240 120, 330 180" 
                  fill="none" 
                  stroke={selectedRoute.id === 'route_bypass_g4' ? '#10b981' : '#475569'} 
                  strokeWidth={selectedRoute.id === 'route_bypass_g4' ? 4 : 2}
                />

                {/* Path 3: Rural Link (Bottom) */}
                <path 
                  d="M 50 120 C 100 180, 220 200, 330 120" 
                  fill="none" 
                  stroke={selectedRoute.id === 'route_sh11_g2' ? '#f59e0b' : '#334155'} 
                  strokeWidth={selectedRoute.id === 'route_sh11_g2' ? 4 : 2}
                  strokeDasharray="3 3"
                />

                {/* Origin Node: Loading Dock */}
                <circle cx="50" cy="120" r="8" fill="#3b82f6" />
                <text x="25" y="145" fill="#94a3b8" fontSize="10" fontWeight="bold">Mandi Depot (Origin)</text>

                {/* Target Gates */}
                {/* Gate 1 (Top) */}
                <circle cx="330" cy="60" r="7" fill={gates[0].status === 'congested' ? '#ef4444' : '#10b981'} />
                <text x="345" y="64" fill={gates[0].status === 'congested' ? '#f87171' : '#cbd5e1'} fontSize="10" fontWeight="bold">
                  Gate 1 (+{gates[0].estimatedWaitMinutes}m)
                </text>

                {/* Gate 2 (Middle) */}
                <circle cx="330" cy="120" r="6" fill="#f59e0b" />
                <text x="345" y="124" fill="#cbd5e1" fontSize="10">Gate 2 (+{gates[1].estimatedWaitMinutes}m)</text>

                {/* Gate 4 (Bottom) */}
                <circle cx="330" cy="180" r="8" fill="#10b981" />
                <text x="345" y="184" fill="#34d399" fontSize="10" fontWeight="bold">
                  Gate 4 (+{gates[3].estimatedWaitMinutes}m) ★
                </text>

                {/* Active Vehicle Marker */}
                <circle cx="160" cy="120" r="5" fill="#38bdf8" className="animate-ping" />
                <circle cx="160" cy="120" r="4" fill="#ffffff" />
                <text x="140" y="105" fill="#38bdf8" fontSize="9" fontWeight="bold">UP 32 BN 4410</text>
              </svg>

              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-800">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Optimal Green Channel</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Gate 1 Bottleneck</span>
                </span>
                <span className="font-mono text-neutral-300">
                  Target: {selectedRoute.targetGateName.split('(')[0]}
                </span>
              </div>
            </div>

            {/* Selected Route Waypoints Timeline */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
                Turn-by-Turn Waypoints: {selectedRoute.name}
              </span>
              <div className="space-y-2">
                {selectedRoute.waypoints.map((wp, idx) => (
                  <div key={wp.name} className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">{wp.name}</span>
                        <span className="font-mono text-neutral-400 text-[11px]">{wp.km} km</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block">{wp.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated Trip Economics */}
            <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700/80 text-xs space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Estimated Diesel Consumption:</span>
                <span className="font-mono font-bold text-white">~13.2 Litres (₹{selectedRoute.fuelEstimatedInr})</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>FASTag Toll Tariff:</span>
                <span className="font-mono font-bold text-white">₹{selectedRoute.tollCostInr}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-neutral-700">
                <span>Net Idling Cost Savings:</span>
                <span className="font-mono">₹{selectedRoute.fuelSavedInr} saved</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
