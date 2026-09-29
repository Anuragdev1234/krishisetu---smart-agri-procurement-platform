import React, { useState } from 'react';
import { 
  Building2, 
  ScanLine, 
  Users, 
  Scale, 
  Warehouse, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Truck, 
  ArrowRight, 
  Search, 
  FileText,
  Camera,
  Play,
  Share2,
  RefreshCw,
  ExternalLink,
  BarChart3,
  TrendingUp,
  DollarSign,
  Timer,
  Video,
  Shuffle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking, QualityGrade, UserRole } from '../../types/procurement';
import { ReceiptModal } from '../common/ReceiptModal';
import { OfficerAnalytics } from './OfficerAnalytics';
import { EconomicImpactWidget } from './EconomicImpactWidget';
import { GateLiveView } from './GateLiveView';
import { DynamicSlotRedistribution } from './DynamicSlotRedistribution';
import { AISupplyMatcher } from './AISupplyMatcher';

interface OfficerDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onSwitchRole?: (role: UserRole, tab?: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ currentTab, onSelectTab, onSwitchRole }) => {
  const { 
    selectedCenter, 
    bookings, 
    checkInFarmer, 
    callNextToken, 
    submitGradingAndWeighing, 
    divertToMarketplace,
    advanceQueueSimulated,
    audioEnabled,
    toggleAudio 
  } = useProcurement();

  // Tab filter for daily roster: 'all' | 'expected' | 'in_yard' | 'completed'
  const [rosterTab, setRosterTab] = useState<'all' | 'expected' | 'in_yard' | 'completed'>('in_yard');
  const [searchQuery, setSearchQuery] = useState('');

  // QR Scanner Desk State
  const [scannedInput, setScannedInput] = useState('');
  const [assignedGateInput, setAssignedGateInput] = useState<number>(2);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(true);

  // Inspection Modal State
  const [activeInspectionBooking, setActiveInspectionBooking] = useState<SlotBooking | null>(null);
  const [moistureInput, setMoistureInput] = useState<number>(11.4);
  const [foreignMatterInput, setForeignMatterInput] = useState<number>(0.8);
  const [fleetRequested, setFleetRequested] = useState<boolean>(false);

  // Sync sidebar tab selection with officer view
  React.useEffect(() => {
    if (currentTab === 'inspection_form') {
      const pending = bookings.find(b => b.status === 'in_yard' || b.status === 'grading') || bookings[0];
      if (pending) {
        openInspection(pending);
      }
    }
  }, [currentTab]);
  const [gradeInput, setGradeInput] = useState<QualityGrade>('Grade A (FAQ)');
  const [grossWeightInput, setGrossWeightInput] = useState<number>(24500);
  const [tareWeightInput, setTareWeightInput] = useState<number>(8100);
  const [askingPriceForDiversion, setAskingPriceForDiversion] = useState<number>(2150);

  // Document Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<SlotBooking | null>(null);

  // Silo capacity metrics
  const capacityUsedPercent = Math.round((selectedCenter.currentIntakeMT / selectedCenter.capacityMT) * 100);
  const remainingStorageMT = selectedCenter.capacityMT - selectedCenter.currentIntakeMT;
  const trucksNeededForEvacuation = Math.max(1, Math.round(selectedCenter.activeTrucks * 0.3));

  // Filter bookings for the selected center
  const centerBookings = bookings.filter(b => b.centerId === selectedCenter.id || true);

  const filteredRoster = centerBookings.filter(b => {
    const matchesSearch = 
      b.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (rosterTab === 'expected') return b.status === 'booked';
    if (rosterTab === 'in_yard') return b.status === 'in_yard' || b.status === 'grading' || b.status === 'weighed';
    if (rosterTab === 'completed') return b.status === 'grn_issued' || b.status === 'dbt_settled' || b.status === 'diverted_marketplace';
    return true;
  });

  const expectedCount = centerBookings.filter(b => b.status === 'booked').length;
  const inYardCount = centerBookings.filter(b => b.status === 'in_yard' || b.status === 'grading' || b.status === 'weighed').length;
  const completedCount = centerBookings.filter(b => b.status === 'grn_issued' || b.status === 'dbt_settled' || b.status === 'diverted_marketplace').length;

  const handleScanSubmit = (tokenToScan?: string) => {
    const token = tokenToScan || scannedInput.trim();
    if (!token) return;

    const success = checkInFarmer(token, assignedGateInput);
    if (success) {
      setScanSuccessMsg(`Token #${token} checked in successfully at Gate #${assignedGateInput}`);
      setScannedInput('');
      setTimeout(() => setScanSuccessMsg(null), 4000);
    } else {
      setScanSuccessMsg(`Error: Token #${token} not found in procurement roster`);
      setTimeout(() => setScanSuccessMsg(null), 4000);
    }
  };

  const openInspection = (booking: SlotBooking) => {
    setActiveInspectionBooking(booking);
    setMoistureInput(booking.moisturePercent || 11.4);
    setForeignMatterInput(booking.foreignMatterPercent || 0.8);
    setGradeInput(booking.qualityGrade || 'Grade A (FAQ)');
    setGrossWeightInput(booking.grossWeightKg || 24800);
    setTareWeightInput(booking.tareWeightKg || 8200);
    setAskingPriceForDiversion(booking.mspRate - 125);
  };

  const handleSaveInspection = () => {
    if (!activeInspectionBooking) return;

    if (gradeInput === 'Sub-Standard / Diverted') {
      divertToMarketplace(activeInspectionBooking.tokenNumber, askingPriceForDiversion);
    } else {
      submitGradingAndWeighing(activeInspectionBooking.tokenNumber, {
        moisturePercent: moistureInput,
        foreignMatterPercent: foreignMatterInput,
        qualityGrade: gradeInput,
        grossWeightKg: grossWeightInput,
        tareWeightKg: tareWeightInput
      });
    }

    setActiveInspectionBooking(null);
  };

  // Moisture evaluation
  const isMoistureOptimal = moistureInput <= 12.0;
  const isMoistureAcceptable = moistureInput > 12.0 && moistureInput <= 14.0;
  const isMoistureExceeded = moistureInput > 14.0;

  const calculatedNetKg = Math.max(0, grossWeightInput - tareWeightInput);
  const calculatedNetQtl = (calculatedNetKg / 100).toFixed(2);
  const calculatedPayout = Math.round(Number(calculatedNetQtl) * (activeInspectionBooking?.mspRate || 2275));

  const handleProceedNextCheckpoint = () => {
    if (onSwitchRole) {
      onSwitchRole('transporter', 'cockpit');
    } else if (onSelectTab) {
      onSelectTab('daily_roster');
    }
  };

  // Dedicated Analytics Tab View
  if (currentTab === 'analytics') {
    return (
      <div className="space-y-6">
        <OfficerAnalytics onProceedNextCheckpoint={handleProceedNextCheckpoint} />
      </div>
    );
  }

  // Dedicated Economic Impact Tab View
  if (currentTab === 'economic_impact') {
    return (
      <div className="space-y-6">
        <EconomicImpactWidget onProceedNextCheckpoint={handleProceedNextCheckpoint} />
      </div>
    );
  }

  // Dedicated Gate CCTV Live View Tab
  if (currentTab === 'gate_live_view') {
    return (
      <div className="space-y-6">
        <GateLiveView onCheckInToken={(token, gate) => handleScanSubmit(token)} />
      </div>
    );
  }

  // Dedicated Dynamic Slot Redistribution Tab View
  if (currentTab === 'slot_redistribution') {
    return (
      <div className="space-y-6">
        <DynamicSlotRedistribution onProceedNextCheckpoint={handleProceedNextCheckpoint} />
      </div>
    );
  }

  // Dedicated AI Supply Matcher Tab View
  if (currentTab === 'ai_supply_matcher') {
    return (
      <div className="space-y-6">
        <AISupplyMatcher />
      </div>
    );
  }

  // Officer Sub-Tab Bar
  const renderOfficerTabBar = () => (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-xl border border-neutral-200 shadow-2xs text-xs mb-2">
      <button
        onClick={() => onSelectTab && onSelectTab('yard_command')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
          (!currentTab || currentTab === 'yard_command')
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        Command Overview
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('daily_roster')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'daily_roster'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Users className="w-3.5 h-3.5 text-emerald-600" />
        <span>Daily Queue Roster</span>
        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
          {inYardCount}
        </span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('capacity_storage')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'capacity_storage'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
        <span>Silo Capacity & Fleet</span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('qr_scanner')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'qr_scanner'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
        <span>Gate QR Scanner</span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('inspection_form')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'inspection_form'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Scale className="w-3.5 h-3.5 text-emerald-600" />
        <span>Grading & Weighing</span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('ai_supply_matcher')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'ai_supply_matcher'
            ? 'bg-purple-800 text-white shadow-xs'
            : 'text-purple-900 bg-purple-50 hover:bg-purple-100'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span>AI Supply Matcher</span>
        <span className="text-[9px] bg-purple-200 text-purple-900 font-mono px-1 py-0.2 rounded font-bold">
          JIT
        </span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('slot_redistribution')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'slot_redistribution'
            ? 'bg-amber-800 text-white shadow-xs'
            : 'text-amber-900 bg-amber-50 hover:bg-amber-100'
        }`}
      >
        <Shuffle className="w-3.5 h-3.5 text-amber-600" />
        <span>Slot Redistribution</span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('gate_live_view')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'gate_live_view'
            ? 'bg-rose-800 text-white shadow-xs'
            : 'text-rose-900 bg-rose-50 hover:bg-rose-100'
        }`}
      >
        <Video className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>Gate CCTV Live</span>
      </button>
    </div>
  );

  // DEDICATED VIEW: Daily Queue Roster
  if (currentTab === 'daily_roster') {
    return (
      <div className="space-y-6">
        {renderOfficerTabBar()}

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-800" />
                <h2 className="text-lg font-bold text-neutral-900">
                  Daily Intake Queue Roster
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time queue tracking across all Mandi boom barriers, inspection bays, and weighbridges.
              </p>
            </div>

            {/* Quick Roster Stats */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                Waiting in Yard: <strong className="font-mono text-emerald-950 font-bold">{inYardCount}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-semibold">
                Expected Today: <strong className="font-mono text-neutral-950 font-bold">{expectedCount}</strong>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <button
                onClick={() => setRosterTab('in_yard')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  rosterTab === 'in_yard' ? 'bg-white text-emerald-950 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Waiting in Yard ({inYardCount})
              </button>
              <button
                onClick={() => setRosterTab('expected')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  rosterTab === 'expected' ? 'bg-white text-emerald-950 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Expected Today ({expectedCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search token, farmer, plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-64 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Roster Table */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 text-neutral-600 uppercase text-[10px] font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">Token & Arrival</th>
                  <th className="py-2.5 px-3">Farmer & Phone</th>
                  <th className="py-2.5 px-3">Vehicle Details</th>
                  <th className="py-2.5 px-3">Crop & Quantity</th>
                  <th className="py-2.5 px-3">Gate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No vehicles found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedBookings.map((item) => (
                    <tr key={item.tokenNumber} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-neutral-900 block">{item.tokenNumber}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{item.timeSlot}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-neutral-900 block">{item.farmerName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{item.farmerPhone}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-neutral-800 uppercase block">{item.vehicleNumber}</span>
                        <span className="text-[10px] text-neutral-500">{item.vehicleType}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-neutral-900 block">{item.cropName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {item.netWeightQtl ? `${item.netWeightQtl} Qtl (Net)` : `${item.estimatedWeightQtl} Qtl (Est)`}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-neutral-100 text-neutral-800 text-[11px]">
                          Gate #{item.gateNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded ${
                          item.status === 'in_yard' ? 'bg-amber-100 text-amber-900' :
                          item.status === 'grading' ? 'bg-blue-100 text-blue-900' :
                          item.status === 'weighed' ? 'bg-purple-100 text-purple-900' :
                          item.status === 'grn_issued' || item.status === 'dbt_settled' ? 'bg-emerald-100 text-emerald-900' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1.5">
                        {item.status === 'in_yard' && (
                          <button
                            onClick={() => callNextToken(item.tokenNumber, item.gateNumber)}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold hover:bg-amber-500 transition-colors shadow-xs inline-flex items-center gap-1"
                            title="Play gate chime & call farmer to inspection bay"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Call Bay</span>
                          </button>
                        )}

                        {(item.status === 'in_yard' || item.status === 'grading') && (
                          <button
                            onClick={() => openInspection(item)}
                            className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs inline-flex items-center gap-1"
                          >
                            <Scale className="w-3 h-3" />
                            <span>Grade & Weigh</span>
                          </button>
                        )}

                        {item.grnNumber && (
                          <button
                            onClick={() => setViewingReceipt(item)}
                            className="px-2.5 py-1 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>E-Pauti</span>
                          </button>
                        )}

                        {item.status === 'booked' && (
                          <button
                            onClick={() => handleScanSubmit(item.tokenNumber)}
                            className="px-2.5 py-1 bg-neutral-100 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-900 rounded text-[11px] font-semibold transition-colors"
                          >
                            Check-in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal containers */}
        {activeInspectionBooking && renderInspectionModal()}
        {viewingReceipt && (
          <ReceiptModal isOpen={!!viewingReceipt} booking={viewingReceipt} onClose={() => setViewingReceipt(null)} type="grn" />
        )}
      </div>
    );
  }

  // DEDICATED VIEW: Silo Capacity & Fleet Logistics
  if (currentTab === 'capacity_storage') {
    return (
      <div className="space-y-6">
        {renderOfficerTabBar()}

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-800" />
                <h2 className="text-lg font-bold text-neutral-900">
                  Grain Silo Storage Complex & Fleet Evacuation
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automated temperature probes, aeration blowers, and evacuation truck fleet logistics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFleetRequested(true)}
                disabled={fleetRequested}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                  fleetRequested 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{fleetRequested ? '✓ 3 Evacuation Trucks Dispatched' : 'Request 3 Evacuation Trucks'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Total Storage Capacity</span>
              <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">5,000 MT</span>
              <span className="text-[10px] text-neutral-400">4 hermetic steel silo bins</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Current Stored Volume</span>
              <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">3,800 MT</span>
              <span className="text-[10px] text-emerald-700 font-semibold">{capacityUsedPercent}% Capacity Utilized</span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-xs text-neutral-500 block">Remaining Buffer Capacity</span>
              <span className="text-xl font-bold font-mono text-amber-900 mt-1 block">{remainingStorageMT} MT</span>
              <span className="text-[10px] text-amber-700 font-semibold">Intake buffer available</span>
            </div>
          </div>

          {/* 4 Silo Bins Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'Bin 01', crop: 'Wheat (PBW 725)', filledMT: 1820, totalMT: 2000, temp: '18.4°C', fan: 'Active', color: 'emerald' },
              { id: 'Bin 02', crop: 'Wheat (Sharbati)', filledMT: 950, totalMT: 1500, temp: '17.8°C', fan: 'Standby', color: 'emerald' },
              { id: 'Bin 03', crop: 'Chana (Gram)', filledMT: 650, totalMT: 1000, temp: '19.1°C', fan: 'Active', color: 'amber' },
              { id: 'Bin 04', crop: 'Mustard (Rapeseed)', filledMT: 380, totalMT: 500, temp: '18.0°C', fan: 'Standby', color: 'amber' },
            ].map((bin) => {
              const pct = Math.round((bin.filledMT / bin.totalMT) * 100);
              return (
                <div key={bin.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-neutral-900">{bin.id}</span>
                    <span className="font-mono font-bold text-emerald-900 text-[11px]">{pct}% Full</span>
                  </div>

                  {/* Silo Cylinder Visual */}
                  <div className="h-28 bg-neutral-200/80 rounded-lg overflow-hidden flex flex-col justify-end p-1 relative border border-neutral-300">
                    <div 
                      className={`w-full rounded-md transition-all ${pct > 85 ? 'bg-amber-600' : 'bg-emerald-700'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-mono font-bold text-neutral-900 bg-white/90 px-2 py-0.5 rounded shadow-xs">
                        {bin.filledMT} / {bin.totalMT} MT
                      </span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-neutral-900 truncate">
                    {bin.crop}
                  </h5>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200 font-mono text-neutral-600">
                    <span>Temp: {bin.temp}</span>
                    <span className={bin.fan === 'Active' ? 'text-emerald-700 font-bold' : 'text-neutral-400'}>
                      Fan: {bin.fan}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {fleetRequested && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <strong className="block text-sm">Contractor Evacuation Fleet Active:</strong>
                <span>3 Tata Signa 2823 commercial multi-axle trailers from Kisan Express Logistics are en route to Karnal Mandi Loading Dock 4. 75 Metric Tonnes of grain will be evacuated to Central FCI Warehouse.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEDICATED VIEW: Gate QR Scanner
  if (currentTab === 'qr_scanner') {
    return (
      <div className="space-y-6">
        {renderOfficerTabBar()}

        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-neutral-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-emerald-800" />
                <h2 className="text-lg font-bold text-neutral-900">
                  Gate QR Scanner & Digital Check-In Desk
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Scan arrival gate passes, validate ANPR vehicle plates, and authorize boom barrier entry.
              </p>
            </div>
          </div>

          {/* Scanner Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-900 text-white p-6 h-64 flex flex-col justify-between border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ANPR CAMERA 02 · GATE 2 ACTIVE
              </span>
              <span>1080P 60FPS</span>
            </div>

            <div className="my-auto mx-auto w-40 h-40 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center relative">
              <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_12px_#34d399] absolute top-1/2 -translate-y-1/2 animate-pulse" />
              <Camera className="w-8 h-8 text-emerald-400/50" />
            </div>

            <div className="text-center text-xs text-neutral-400">
              Point camera at Farmer QR Pass or enter token manually
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualScan} className="space-y-3">
            <label className="text-xs font-semibold text-neutral-700 block">
              Manual Token / Pass Code Lookup
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. DOCA-WHT-8492"
                value={scanTokenInput}
                onChange={(e) => setScanTokenInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-neutral-300 rounded-xl font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Admit Vehicle
              </button>
            </div>
          </form>

          {/* Quick Expected List */}
          <div className="pt-2 border-t border-neutral-200">
            <span className="text-xs font-bold text-neutral-700 block mb-2">
              Expected Today for Quick 1-Click Check-In:
            </span>
            <div className="space-y-2">
              {bookings.filter(b => b.status === 'booked').slice(0, 3).map((item) => (
                <div
                  key={item.tokenNumber}
                  className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-neutral-900 block">{item.tokenNumber}</span>
                    <span className="text-neutral-500 text-[11px]">{item.farmerName} · {item.vehicleNumber} ({item.cropName})</span>
                  </div>
                  <button
                    onClick={() => handleScanSubmit(item.tokenNumber)}
                    className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    Check-in
                  </button>
                </div>
              ))}
            </div>
          </div>

          {scanSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{scanSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEDICATED VIEW: Grading & Weighing Form
  if (currentTab === 'inspection_form') {
    return (
      <div className="space-y-6">
        {renderOfficerTabBar()}

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-800" />
                <h2 className="text-lg font-bold text-neutral-900">
                  Digital Grading Lab & Weighbridge E-Pauti Station
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Calibrated digital moisture testing, weighbridge tare deduction, and PFMS E-Pauti generation.
              </p>
            </div>
          </div>

          {/* Select Waiting Vehicle */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-700 block">
              Select Vehicle Staged in Yard for Inspection:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bookings.filter(b => b.status === 'in_yard' || b.status === 'grading').map((b) => (
                <div
                  key={b.tokenNumber}
                  onClick={() => openInspection(b)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeInspectionBooking?.tokenNumber === b.tokenNumber
                      ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-neutral-900">{b.tokenNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Gate #{b.gateNumber}
                    </span>
                  </div>
                  <span className="font-bold text-neutral-900 text-xs block">{b.farmerName}</span>
                  <span className="text-[11px] text-neutral-500">{b.cropName} · {b.vehicleNumber}</span>
                </div>
              ))}
            </div>
          </div>

          {activeInspectionBooking && renderInspectionModal()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderOfficerTabBar()}
      
      {/* 1. Header & Center Operations Status */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>APMC Procurement Command Center</span>
            <span>·</span>
            <span>Gate Operations & Weighbridge</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            {selectedCenter.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Operating Hours: {selectedCenter.operatingHours} · {selectedCenter.totalGates} Active Boom Barrier Gates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab && onSelectTab('ai_supply_matcher')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-950 transition-colors shadow-xs"
            title="AI Supply Matcher & Storage Duration Minimizer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span>AI Supply Matcher</span>
            <span className="text-[10px] bg-purple-200 text-purple-900 font-mono px-1.5 py-0.5 rounded font-bold">
              JIT
            </span>
          </button>

          <button
            onClick={() => onSelectTab && onSelectTab('slot_redistribution')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-950 transition-colors shadow-xs"
            title="Dynamic Slot & Gate Redistribution (Traffic Re-balancing)"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-700" />
            <span>Redistribute Slots</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 font-mono px-1.5 py-0.5 rounded font-bold">
              Auto-Pilot
            </span>
          </button>

          <button
            onClick={() => onSelectTab && onSelectTab('gate_live_view')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-950 transition-colors shadow-xs"
            title="Open Filtered Low-Latency Live Video Surveillance of Entry Gates"
          >
            <Video className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            <span>Gate Live View</span>
            <span className="text-[10px] bg-red-600 text-white font-mono px-1.5 py-0.5 rounded font-bold animate-pulse">
              LIVE
            </span>
          </button>

          <button
            onClick={() => onSelectTab && onSelectTab('economic_impact')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-950 transition-colors shadow-xs"
            title="View Daily Procurement ROI, Silo Savings & Wait-Time Reduction"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Economic Impact</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-1.5 py-0.5 rounded font-bold">
              +595% ROI
            </span>
          </button>

          <button
            onClick={() => onSelectTab && onSelectTab('analytics')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors shadow-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Live Analytics</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Yard Throughput: Normal</span>
          </div>

          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              audioEnabled 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{audioEnabled ? 'Chime Active' : 'Chime Muted'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Slot Redistribution Safety Alert Strip */}
      <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
            <Shuffle className="w-5 h-5 text-amber-700 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Dynamic Slot Redistribution Recommended
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded">
                Gate 2 Exceeded Safety Threshold (18/10 Queued)
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-0.5">
              Tractor queue at Gate 2 exceeds safe road approach limits (14.5m wait). Automatically divert 4 incoming farmers to Gate 3 to restore optimal flow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab && onSelectTab('slot_redistribution')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Open Slot Redistribution Desk ➔</span>
          </button>
        </div>
      </div>

      {/* AI Supply Matcher JIT Storage Minimization Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-950 via-neutral-900 to-purple-950 text-white rounded-2xl shadow-xs border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900 text-purple-200 border border-purple-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                AI Supply Matcher · Real-Time Arrival Telemetry
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                -214 Silo Hours Reclaimed
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Incoming mandi arrival logs automatically cross-referenced with local mill inventory deficits. Bypass multi-day silo holding with instant direct off-take agreements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab && onSelectTab('ai_supply_matcher')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open AI Supply Matcher ➔</span>
          </button>
        </div>
      </div>

      {/* 2. Centre Capacity Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Silo Capacity Gauge */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span>Storage Silo Capacity</span>
            <span className="font-mono font-bold text-neutral-900">{capacityUsedPercent}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all ${capacityUsedPercent > 85 ? 'bg-rose-600' : capacityUsedPercent > 65 ? 'bg-amber-500' : 'bg-emerald-600'}`}
              style={{ width: `${capacityUsedPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-neutral-100">
            <span className="text-neutral-500">Remaining Space:</span>
            <span className="font-mono font-bold text-emerald-900">{remainingStorageMT} MT</span>
          </div>
        </div>

        {/* Metric 2: Daily Intake vs Target */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Today's Intake Volume</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-neutral-900">
              420.5 <span className="text-xs font-normal text-neutral-500">/ 500 MT</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              84% of Target
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 mt-2 border-t border-neutral-100">
            <span className="text-neutral-500">Average Turnaround:</span>
            <span className="font-mono font-semibold text-neutral-800">22 mins</span>
          </div>
        </div>

        {/* Metric 3: Active Vehicles in Yard */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">Active Yard Vehicles</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {inYardCount + 8}
            </span>
            <span className="text-xs text-neutral-400">Tractors & Trucks</span>
          </div>
          <div className="flex justify-between text-xs pt-2 mt-2 border-t border-neutral-100">
            <span className="text-neutral-500">Weighbridge Lane 1 & 2:</span>
            <span className="font-semibold text-emerald-700">Clear</span>
          </div>
        </div>

        {/* Metric 4: Transporter Evacuation Alert */}
        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
            <span>Evacuation Backlog</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-amber-950">
              {trucksNeededForEvacuation} Trucks
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
              Dispatch Reqd
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 mt-2 border-t border-amber-200/60 text-amber-900/80">
            <span>To State FCI Silo:</span>
            <span className="font-semibold">Kurukshetra</span>
          </div>
        </div>

      </div>

      {/* 2a. Economic Impact & Fiscal ROI Headline Strip */}
      <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl shadow-xs border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Daily Economic Impact & Fiscal ROI
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                Live Center Telemetry
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Today's Mandi Operations: <strong>+595.6% Procurement ROI</strong> · <strong>₹3.99L</strong> storage cost savings · <strong>-272.2 mins (-95.5%)</strong> average wait-time reduction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab && onSelectTab('economic_impact')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-950 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs whitespace-nowrap"
          >
            <span>Open Economic Impact Widget</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-800" />
          </button>
        </div>
      </div>

      {/* 2b. Grain Storage Silo Bins & Transporter Fleet Dispatcher Station */}
      {(currentTab === 'capacity_storage' || currentTab === 'yard_command') && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Grain Silo Storage Complex & Aeration Telemetry
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automated temperature probes, aeration blowers, and evacuation logistics
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFleetRequested(true)}
                disabled={fleetRequested}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                  fleetRequested 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{fleetRequested ? '✓ 3 Trucks Dispatched (ETA 20m)' : 'Request 3 Evacuation Trucks'}</span>
              </button>
            </div>
          </div>

          {/* 4 Silo Bins Visualizer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {[
              { id: 'Bin 01', crop: 'Wheat (PBW 725)', filledMT: 1820, totalMT: 2000, temp: '18.4°C', fan: 'Active', color: 'emerald' },
              { id: 'Bin 02', crop: 'Wheat (Sharbati)', filledMT: 950, totalMT: 1500, temp: '17.8°C', fan: 'Standby', color: 'emerald' },
              { id: 'Bin 03', crop: 'Chana (Gram)', filledMT: 650, totalMT: 1000, temp: '19.1°C', fan: 'Active', color: 'amber' },
              { id: 'Bin 04', crop: 'Mustard (Rapeseed)', filledMT: 380, totalMT: 500, temp: '18.0°C', fan: 'Standby', color: 'amber' },
            ].map((bin) => {
              const pct = Math.round((bin.filledMT / bin.totalMT) * 100);
              return (
                <div key={bin.id} className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-neutral-900">{bin.id}</span>
                    <span className="font-mono font-bold text-emerald-900 text-[11px]">{pct}% Full</span>
                  </div>

                  {/* Silo Cylinder Visual */}
                  <div className="h-20 bg-neutral-200/80 rounded-lg overflow-hidden flex flex-col justify-end p-1 relative border border-neutral-300">
                    <div 
                      className={`w-full rounded-md transition-all ${pct > 85 ? 'bg-amber-600' : 'bg-emerald-700'}`}
                      style={{ height: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-neutral-900 bg-white/80 px-1.5 py-0.5 rounded shadow-xs">
                        {bin.filledMT} MT
                      </span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-neutral-900 truncate">
                    {bin.crop}
                  </h5>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-neutral-200 font-mono text-neutral-600">
                    <span>Temp: {bin.temp}</span>
                    <span className={bin.fan === 'Active' ? 'text-emerald-700 font-bold' : 'text-neutral-400'}>
                      Fan: {bin.fan}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {fleetRequested && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Contractor Dispatch Confirmed:</strong> 3 commercial trucks (Tata Signa 2823) from Kisan Express Logistics are en route to Karnal Mandi Loading Dock 4. Silo space will increase by 75 Metric Tonnes upon departure.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Middle Section: QR Scanner Desk & Live Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: QR Scanner / Digital Gate Check-in Desk (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-neutral-900">
                Gate QR Scanner & Check-in Desk
              </h3>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('gate_live_view')}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold border border-red-200 transition-colors"
              title="Open full camera feed for Gate 1-4 with ANPR and congestion filters"
            >
              <Video className="w-3 h-3 text-red-600 animate-pulse" />
              <span>Gate Live View ➔</span>
            </button>
          </div>

          {/* Interactive Simulated Viewfinder */}
          <div className="relative rounded-xl overflow-hidden bg-neutral-900 text-white p-4 h-48 flex flex-col justify-between border border-neutral-800">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                OPTICAL BARCODE SENSOR ACTIVE
              </span>
              <span>1080p @ 60fps</span>
            </div>

            {/* Target Reticle */}
            <div className="relative mx-auto w-32 h-32 border-2 border-dashed border-emerald-400/80 rounded-lg flex items-center justify-center">
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>

            <div className="text-center text-[11px] text-neutral-400">
              Align Farmer Digital QR Pass or Paper Slip in center
            </div>
          </div>

          {/* Fast Token Scan Input / Demo Buttons */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Scan Pass Token or Enter ID Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedInput}
                  onChange={(e) => setScannedInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DOCA-MST-9018"
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  onClick={() => handleScanSubmit()}
                  className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors whitespace-nowrap"
                >
                  Verify & Check-in
                </button>
              </div>
            </div>

            {/* Gate Assignment */}
            <div className="flex items-center justify-between text-xs p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-neutral-600 font-medium">Allot Boom Barrier Lane:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(gateNum => (
                  <button
                    key={gateNum}
                    onClick={() => setAssignedGateInput(gateNum)}
                    className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                      assignedGateInput === gateNum 
                        ? 'bg-emerald-800 text-white shadow-xs' 
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {gateNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Demo Scan Buttons for Expected Farmers */}
            <div className="pt-2 border-t border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                Quick 1-Click Scan for Arrived Farmers:
              </span>
              <div className="space-y-1.5">
                {bookings.filter(b => b.status === 'booked').slice(0, 2).map((item) => (
                  <div
                    key={item.tokenNumber}
                    className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-neutral-900">{item.tokenNumber}</span>
                      <span className="text-neutral-500 text-[11px] block">{item.farmerName} · {item.vehicleNumber}</span>
                    </div>
                    <button
                      onClick={() => handleScanSubmit(item.tokenNumber)}
                      className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Scan Check-in
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback alert */}
            {scanSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{scanSuccessMsg}</span>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Daily Roster Management Station (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Daily Intake Roster & Live Queue Station
                </h3>
                <p className="text-xs text-neutral-500">
                  Monitor expected arrivals, call vehicles to inspection bay, and issue E-Pauti
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search token, farmer, plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 pt-3 border-b border-neutral-200 text-xs">
              <button
                onClick={() => setRosterTab('in_yard')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  rosterTab === 'in_yard' 
                    ? 'border-emerald-800 text-emerald-950 font-bold' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>Waiting in Yard</span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                  {inYardCount}
                </span>
              </button>

              <button
                onClick={() => setRosterTab('expected')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  rosterTab === 'expected' 
                    ? 'border-emerald-800 text-emerald-950 font-bold' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>Expected Today</span>
                <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded-full font-bold">
                  {expectedCount}
                </span>
              </button>

              <button
                onClick={() => setRosterTab('completed')}
                className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  rosterTab === 'completed' 
                    ? 'border-emerald-800 text-emerald-950 font-bold' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>Completed / GRN</span>
                <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded-full font-bold">
                  {completedCount}
                </span>
              </button>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-600 text-[10px] uppercase font-semibold border-y border-neutral-200">
                  <tr>
                    <th className="py-2 px-2.5">Token #</th>
                    <th className="py-2 px-2.5">Farmer & Vehicle</th>
                    <th className="py-2 px-2.5">Commodity</th>
                    <th className="py-2 px-2.5">Gate / Status</th>
                    <th className="py-2 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRoster.map((item) => (
                    <tr key={item.tokenNumber} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-2.5">
                        <span className="font-mono font-bold text-neutral-900 block">
                          {item.tokenNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {item.timeSlot}
                        </span>
                      </td>

                      <td className="py-3 px-2.5">
                        <span className="font-semibold text-neutral-900 block">
                          {item.farmerName}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {item.vehicleNumber} ({item.vehicleType.split(' ')[0]})
                        </span>
                      </td>

                      <td className="py-3 px-2.5">
                        <span className="font-semibold text-neutral-800 block">
                          {item.cropName.split('(')[0]}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {item.estimatedWeightQtl} Qtl (~{item.bagsCount} bags)
                        </span>
                      </td>

                      <td className="py-3 px-2.5">
                        <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200 inline-block mb-1">
                          Gate #{item.gateNumber}
                        </span>
                        <span className="text-[10px] text-neutral-500 capitalize block">
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-2.5 text-right space-x-1.5">
                        {/* Call to Gate Button */}
                        {item.status === 'in_yard' && (
                          <button
                            onClick={() => callNextToken(item.tokenNumber, item.gateNumber)}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-semibold hover:bg-amber-500 transition-colors shadow-xs inline-flex items-center gap-1"
                            title="Play gate chime & call farmer to inspection bay"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Call Bay</span>
                          </button>
                        )}

                        {/* Grading & Weighing Action */}
                        {(item.status === 'in_yard' || item.status === 'grading') && (
                          <button
                            onClick={() => openInspection(item)}
                            className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs inline-flex items-center gap-1"
                          >
                            <Scale className="w-3 h-3" />
                            <span>Grade & Weigh</span>
                          </button>
                        )}

                        {/* View GRN Button */}
                        {item.grnNumber && (
                          <button
                            onClick={() => setViewingReceipt(item)}
                            className="px-2.5 py-1 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 rounded text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>E-Pauti</span>
                          </button>
                        )}

                        {item.status === 'booked' && (
                          <button
                            onClick={() => handleScanSubmit(item.tokenNumber)}
                            className="px-2.5 py-1 bg-neutral-100 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-900 rounded text-[11px] font-semibold transition-colors"
                          >
                            Check-in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
            <span>Total Registered in Today's Batch: {centerBookings.length} Vehicles</span>
            <span className="font-mono text-[11px]">System Status: Online · PFMS Gateway Linked</span>
          </div>

        </div>

      </div>

      {/* 4. Digital Quality Grading & Weighbridge Modal Form */}
      {activeInspectionBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-6 bg-emerald-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>Quality Lab & Digital Weighbridge Station</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Grading Lot: {activeInspectionBooking.tokenNumber}
                </h3>
                <p className="text-xs text-neutral-300">
                  Farmer: {activeInspectionBooking.farmerName} · {activeInspectionBooking.cropName}
                </p>
              </div>

              <button
                onClick={() => setActiveInspectionBooking(null)}
                className="p-1.5 rounded-lg bg-emerald-900 text-neutral-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Moisture & Quality Controls */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  1. Laboratory Moisture & FAQ Purity Inspection
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-neutral-700">
                        Moisture Content (%)
                      </label>
                      <span className={`font-mono font-bold text-xs ${isMoistureOptimal ? 'text-emerald-700' : isMoistureAcceptable ? 'text-amber-700' : 'text-rose-700'}`}>
                        {moistureInput}%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="8"
                      max="22"
                      value={moistureInput}
                      onChange={(e) => setMoistureInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Government FAQ threshold: &le; 12.0%
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-neutral-700">
                        Foreign Matter (%)
                      </label>
                      <span className="font-mono font-bold text-xs text-neutral-800">
                        {foreignMatterInput}%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={foreignMatterInput}
                      onChange={(e) => setForeignMatterInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Max allowable chaff: 2.0%
                    </span>
                  </div>
                </div>

                {/* Grade Classification */}
                <div className="pt-2">
                  <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                    Official Quality Classification
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Grade A (FAQ)', 'Grade B (FAQ)', 'Sub-Standard / Diverted'] as QualityGrade[]).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setGradeInput(grade)}
                        className={`p-2 rounded-lg border text-left text-xs transition-all ${
                          gradeInput === grade
                            ? grade === 'Sub-Standard / Diverted'
                              ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400/20'
                              : 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                            : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="leading-tight">{grade.split(' ')[0]}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 truncate">
                          {grade === 'Sub-Standard / Diverted' ? 'Marketplace' : 'FCI Buffer'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diversion Warning if moisture exceeds */}
                {isMoistureExceeded && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>High Moisture Warning ({moistureInput}% &gt; 12.0%):</strong> Produce cannot enter central long-term buffer stock without drying. We recommend selecting <strong>Sub-Standard / Diverted</strong> to transfer this lot to the Local Merchant Marketplace so the farmer can receive immediate private bids!
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Weighbridge Tare & Gross Weight Entry */}
              {gradeInput !== 'Sub-Standard / Diverted' ? (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    2. Certified Weighbridge Load Cells
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-neutral-600 block mb-1">
                        Gross Weight (Vehicle + Grain)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="10"
                          value={grossWeightInput}
                          onChange={(e) => setGrossWeightInput(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold text-neutral-900 text-sm"
                        />
                        <span className="ml-2 font-mono text-neutral-500 text-xs">kg</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-neutral-600 block mb-1">
                        Tare Weight (Empty Vehicle)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="10"
                          value={tareWeightInput}
                          onChange={(e) => setTareWeightInput(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold text-neutral-900 text-sm"
                        />
                        <span className="ml-2 font-mono text-neutral-500 text-xs">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Payout Summary */}
                  <div className="p-3 bg-emerald-900 text-white rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-300 text-[10px] uppercase font-bold block">
                        Net Accepted Weight
                      </span>
                      <span className="text-base font-mono font-extrabold text-white">
                        {calculatedNetQtl} Quintals
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-300 text-[10px] uppercase font-bold block">
                        Auto-Computed MSP Payout
                      </span>
                      <span className="text-lg font-mono font-extrabold text-emerald-400">
                        ₹{calculatedPayout.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Diversion to Marketplace Option */
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    2. Secondary Market Listing Setup
                  </h4>
                  <p className="text-xs text-amber-900">
                    This lot will immediately populate the <strong>Local Buyer Dashboard</strong> for direct private merchant bidding.
                  </p>
                  <div>
                    <label className="text-xs font-medium text-amber-900 block mb-1">
                      Farmer Agreed Minimum Asking Price (₹/Quintal)
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={askingPriceForDiversion}
                      onChange={(e) => setAskingPriceForDiversion(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg font-mono font-bold text-neutral-900 text-sm"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveInspectionBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveInspection}
                className="px-6 py-2.5 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>
                  {gradeInput === 'Sub-Standard / Diverted'
                    ? 'Publish to Secondary Marketplace'
                    : 'Approve Quality & Issue E-Pauti (GRN)'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!viewingReceipt}
        booking={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        type="grn"
      />

    </div>
  );
};
