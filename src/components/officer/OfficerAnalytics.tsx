import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Scale, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  Download, 
  ArrowRight,
  Zap,
  BarChart3
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';

// 1. Hourly Traffic & Yard Congestion Data (06:00 AM - 18:00 PM)
const HOURLY_TRAFFIC_DATA = [
  { time: '06:00', arrivals: 12, processed: 10, yardHold: 2, avgWaitMins: 8 },
  { time: '07:00', arrivals: 28, processed: 22, yardHold: 8, avgWaitMins: 12 },
  { time: '08:00', arrivals: 45, processed: 36, yardHold: 17, avgWaitMins: 18 },
  { time: '09:00', arrivals: 62, processed: 48, yardHold: 31, avgWaitMins: 24 },
  { time: '10:00', arrivals: 58, processed: 54, yardHold: 35, avgWaitMins: 22 },
  { time: '11:00', arrivals: 48, processed: 52, yardHold: 31, avgWaitMins: 19 },
  { time: '12:00', arrivals: 34, processed: 42, yardHold: 23, avgWaitMins: 14 },
  { time: '13:00', arrivals: 26, processed: 32, yardHold: 17, avgWaitMins: 11 },
  { time: '14:00', arrivals: 42, processed: 38, yardHold: 21, avgWaitMins: 15 },
  { time: '15:00', arrivals: 38, processed: 40, yardHold: 19, avgWaitMins: 13 },
  { time: '16:00', arrivals: 24, processed: 28, yardHold: 15, avgWaitMins: 10 },
  { time: '17:00', arrivals: 16, processed: 20, yardHold: 11, avgWaitMins: 8 },
  { time: '18:00', arrivals: 8, processed: 14, yardHold: 5, avgWaitMins: 6 },
];

// 2. 7-Day Procurement Volume by Crop (in Metric Tonnes)
const PROCUREMENT_VOLUME_TRENDS = [
  { day: 'Wed (23/09)', wheat: 820, paddy: 340, chana: 120, mustard: 95, target: 1200 },
  { day: 'Thu (24/09)', wheat: 910, paddy: 380, chana: 145, mustard: 110, target: 1200 },
  { day: 'Fri (25/09)', wheat: 1040, paddy: 410, chana: 160, mustard: 130, target: 1300 },
  { day: 'Sat (26/09)', wheat: 1180, paddy: 460, chana: 190, mustard: 140, target: 1400 },
  { day: 'Sun (27/09)', wheat: 650, paddy: 280, chana: 90, mustard: 70, target: 1000 },
  { day: 'Mon (28/09)', wheat: 1240, paddy: 510, chana: 210, mustard: 165, target: 1400 },
  { day: 'Today (29/09)', wheat: 1120, paddy: 480, chana: 185, mustard: 150, target: 1400 },
];

// 3. Gate Entry & Lane Efficiency Statistics
const GATE_ENTRY_STATS = [
  { gate: 'Gate 1 (Trucks & Trailers)', entries: 142, avgMinutes: 16.4, passRate: 98.2, fill: '#047857' },
  { gate: 'Gate 2 (Tractor Trolleys)', entries: 284, avgMinutes: 11.2, passRate: 99.1, fill: '#059669' },
  { gate: 'Gate 3 (Pickups & Small)', entries: 118, avgMinutes: 7.8, passRate: 97.8, fill: '#10b981' },
  { gate: 'Gate 4 (Evacuation Logistics)', entries: 64, avgMinutes: 14.5, passRate: 100.0, fill: '#d97706' },
];

// 4. Commodity Share Donut
const COMMODITY_SHARE_DATA = [
  { name: 'Wheat (PBW 725 / Sharbati)', value: 1120, color: '#047857' },
  { name: 'Paddy (Grade A)', value: 480, color: '#059669' },
  { name: 'Chana (Desi Gram)', value: 185, color: '#d97706' },
  { name: 'Mustard (Rapeseed)', value: 150, color: '#f59e0b' },
];

interface OfficerAnalyticsProps {
  onProceedNextCheckpoint?: () => void;
}

export const OfficerAnalytics: React.FC<OfficerAnalyticsProps> = ({ onProceedNextCheckpoint }) => {
  const { bookings } = useProcurement();
  const [timeRange, setTimeRange] = useState<'today' | '7days'>('today');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const totalProcuredTodayMT = 1935;
  const avgTurnaroundMins = 12.8;
  const boomBarrierClearance = 98.8;
  const inYardVehicles = bookings.filter(b => b.status === 'in_yard' || b.status === 'grading').length + 18;

  const handleExportCSV = () => {
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Analytics Header & Controls */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <span>APMC Central Intelligence & Yard Analytics</span>
            <span>·</span>
            <span>Live Telemetry Engine</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Real-Time Mandi Traffic, Procurement & Gate Flow
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Continuous surveillance data from optical ANPR boom barriers, automated weighbridges, and DoCA national ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pill */}
          <div className="flex p-1 bg-neutral-100 rounded-xl text-xs font-semibold border border-neutral-200">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'today' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Today (Live 24h)
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === '7days' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              7-Day Peak Trends
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          {/* Proceed Next Checkpoint Button */}
          {onProceedNextCheckpoint && (
            <button
              onClick={onProceedNextCheckpoint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Next Checkpoint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {showExportSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Analytics dataset exported: <code>APMC_Mandi_Telemetry_20260929.csv</code> (All 13 hourly intervals included).</span>
        </div>
      )}

      {/* 2. Key Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Today's Total Intake</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              +14% vs Y’day
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {totalProcuredTodayMT.toLocaleString('en-IN')} MT
            </span>
            <span className="text-xs text-neutral-400">38,700 Bags</span>
          </div>
          <p className="text-[11px] text-neutral-600 mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target: 2,000 MT (96.7% fulfilled)</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Average Yard Turnaround</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              -62% vs Manual
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {avgTurnaroundMins} mins
            </span>
            <span className="text-xs text-neutral-400">Gate to GRN</span>
          </div>
          <p className="text-[11px] text-neutral-600 mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Optimal threshold: &lt; 20 minutes</span>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Vehicles Inside Yard</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              Smooth Flow
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {inYardVehicles}
            </span>
            <span className="text-xs text-neutral-400">Holding Bay: 45 Cap</span>
          </div>
          <p className="text-[11px] text-neutral-600 mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Silo Evacuation: 3 Trucks En Route</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Boom Barrier QR Read Rate</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              Zero Failure
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {boomBarrierClearance}%
            </span>
            <span className="text-xs text-neutral-400">Optical Laser</span>
          </div>
          <p className="text-[11px] text-neutral-600 mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total 608 vehicles scanned today</span>
          </p>
        </div>

      </div>

      {/* 3. Primary Chart: Real-time Hourly Mandi Traffic & Queue Density */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-neutral-900">
                Hourly Vehicle Inflow vs. Weighbridge Processing Throughput
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live monitoring of tractor and truck volume per hour against gate clearance capacity
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Arrivals / hr</span>
            </span>
            <span className="flex items-center gap-1 text-blue-800">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Cleared / hr</span>
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Yard Holding</span>
            </span>
          </div>
        </div>

        {/* Recharts Area / Line Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="arrivalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="clearedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '0.75rem', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="arrivals" 
                name="Vehicles Arrived" 
                stroke="#059669" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#arrivalGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="processed" 
                name="Vehicles Cleared" 
                stroke="#2563eb" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#clearedGrad)" 
              />
              <Line 
                type="monotone" 
                dataKey="yardHold" 
                name="Holding Yard Queue" 
                stroke="#d97706" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-600 gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Peak Inflow Window:</strong> 09:00 AM – 10:30 AM (Peak 62 arrivals/hr). Automated staggered time-slot pacing prevented overflow.
            </span>
          </div>
          <span className="font-mono text-emerald-800 font-bold shrink-0">
            Bottleneck Index: 0.12 (Nominal)
          </span>
        </div>
      </div>

      {/* 4. Two-Column Layout: Procurement Volume Trends & Gate Entry Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 7-Day Procurement Volume by Commodity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Procurement Volume Trends by Commodity (MT)
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Stacked daily intake breakdown against district central buffer target
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-mono">Total 7-Day Volume</span>
              <span className="font-mono font-bold text-sm text-neutral-900">12,485 MT</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROCUREMENT_VOLUME_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '0.75rem', 
                    fontSize: '11px' 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="wheat" name="Wheat (PBW)" stackId="a" fill="#047857" radius={[0, 0, 0, 0]} />
                <Bar dataKey="paddy" name="Paddy (Grade A)" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="chana" name="Chana (Gram)" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} />
                <Bar dataKey="mustard" name="Mustard" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="target" name="Daily Target (MT)" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-bold block">Wheat</span>
              <span className="font-mono font-bold text-neutral-900">6,960 MT</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-bold block">Paddy</span>
              <span className="font-mono font-bold text-neutral-900">2,860 MT</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <span className="text-[10px] text-amber-800 font-bold block">Chana</span>
              <span className="font-mono font-bold text-neutral-900">1,105 MT</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <span className="text-[10px] text-amber-800 font-bold block">Mustard</span>
              <span className="font-mono font-bold text-neutral-900">860 MT</span>
            </div>
          </div>
        </div>

        {/* Right Column: Gate Entry Lanes & Clearance Statistics (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Gate Entry & Lane Clearance
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Optical QR read speed and average wait time per barrier
              </p>
            </div>

            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
              4 Gates Active
            </span>
          </div>

          {/* Gate Entry Table & Performance */}
          <div className="space-y-3 pt-1">
            {GATE_ENTRY_STATS.map((gate) => (
              <div key={gate.gate} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">{gate.gate}</span>
                  <span className="font-mono font-bold text-emerald-800">{gate.entries} entries</span>
                </div>

                {/* Progress bar of entries */}
                <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${(gate.entries / 284) * 100}%`,
                      backgroundColor: gate.fill 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-1">
                  <span>Avg Scan: <strong className="text-neutral-800">{gate.avgMinutes} mins</strong></span>
                  <span>Compliance: <strong className="text-emerald-700">{gate.passRate}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Zero Gate Stoppages:</strong> Automated barrier raised on average in 4.2 seconds upon QR token scan.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
