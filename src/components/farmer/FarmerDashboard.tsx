import React, { useState } from 'react';
import { 
  CalendarPlus, 
  Clock, 
  QrCode, 
  Receipt, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowRight,
  AlertCircle, 
  Share2, 
  Printer, 
  FastForward,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Mic,
  Volume2
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { SlotBookingModal } from './SlotBookingModal';
import { VoiceBookingAssistant } from './VoiceBookingAssistant';
import { ReceiptModal } from '../common/ReceiptModal';
import { SlotBooking, QueueStep } from '../../types/procurement';

interface FarmerDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ currentTab, onSelectTab }) => {
  const { 
    bookings, 
    activeFarmerToken, 
    currentFarmerBooking, 
    setActiveFarmerToken,
    advanceQueueSimulated 
  } = useProcurement();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVoiceBookingOpen, setIsVoiceBookingOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SlotBooking | null>(null);
  const [receiptType, setReceiptType] = useState<'grn' | 'pass'>('pass');
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync sidebar tab selection with dashboard modals or focus
  React.useEffect(() => {
    if (currentTab === 'book_slot') {
      setIsBookingOpen(true);
    } else if (currentTab === 'voice_booking') {
      setIsVoiceBookingOpen(true);
    }
  }, [currentTab]);

  const activeBooking = currentFarmerBooking || bookings[0];

  // Calculate totals
  const totalQuintals = bookings
    .filter(b => b.netWeightQtl || b.status === 'dbt_settled' || b.status === 'weighed')
    .reduce((acc, b) => acc + (b.netWeightQtl || b.estimatedWeightQtl), 0);

  const totalDbtEarnings = bookings
    .filter(b => b.totalPayout)
    .reduce((acc, b) => acc + (b.totalPayout || 0), 0);

  const queueSteps: { key: QueueStep; label: string; sub: string }[] = [
    { key: 'booked', label: 'Slot Confirmed', sub: 'Pass generated' },
    { key: 'in_yard', label: 'Gate Check-in', sub: 'Boom barrier passed' },
    { key: 'grading', label: 'Quality Testing', sub: 'Moisture & purity lab' },
    { key: 'weighed', label: 'Weighbridge', sub: 'Gross & tare record' },
    { key: 'grn_issued', label: 'E-Pauti (GRN)', sub: 'Official receipt' },
    { key: 'dbt_settled', label: 'DBT Initiated', sub: 'PFMS direct transfer' },
  ];

  const getStepIndex = (status: QueueStep) => {
    const map: Record<QueueStep, number> = {
      'booked': 0,
      'in_yard': 1,
      'grading': 2,
      'weighed': 3,
      'grn_issued': 4,
      'dbt_settled': 5,
      'diverted_marketplace': 2
    };
    return map[status] ?? 0;
  };

  const currentStepIndex = getStepIndex(activeBooking?.status || 'booked');

  const handleSharePass = () => {
    if (!activeBooking) return;
    navigator.clipboard?.writeText(
      `KrishiSetu Gate Pass: Token #${activeBooking.tokenNumber} for ${activeBooking.cropName} at Gate ${activeBooking.gateNumber}. Arrival: ${activeBooking.bookingDate} (${activeBooking.timeSlot}).`
    );
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Sub-Navigation Bar for Farmers
  const renderFarmerTabBar = () => (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-xl border border-neutral-200 shadow-2xs text-xs mb-4">
      <button
        onClick={() => onSelectTab && onSelectTab('overview')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
          (!currentTab || currentTab === 'overview')
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        Dashboard Overview
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('queue_tracker')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'queue_tracker'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Clock className="w-3.5 h-3.5 text-emerald-600" />
        <span>Live Queue Tracker</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('qr_pass')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'qr_pass'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
        <span>Digital QR Pass</span>
      </button>

      <button
        onClick={() => onSelectTab && onSelectTab('dbt_history')}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
          currentTab === 'dbt_history'
            ? 'bg-emerald-800 text-white shadow-xs'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
        <span>Procurement & DBT</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setIsVoiceBookingOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition-all shadow-2xs text-[11px]"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span>Voice Booking</span>
        </button>
        <button
          onClick={() => setIsBookingOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all shadow-2xs text-[11px]"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>+ Book Slot</span>
        </button>
      </div>
    </div>
  );

  // DEDICATED VIEW: Live Queue Tracker
  if (currentTab === 'queue_tracker') {
    return (
      <div className="space-y-6">
        {renderFarmerTabBar()}

        {/* Big Live Tracker Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-neutral-900 to-emerald-950 text-white rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Mandi Yard Queue Position</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white">
              Live Queue Tracker · Token #{activeBooking?.tokenNumber}
            </h2>
            <p className="text-xs text-emerald-200 mt-1">
              Vehicle: <strong className="text-white font-mono">{activeBooking?.vehicleNumber}</strong> ({activeBooking?.vehicleType}) · Mandi Gate #{activeBooking?.gateNumber} · Fast-Track Intake
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-700 text-center min-w-[110px]">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Queue Rank</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                #{activeBooking?.queuePosition || 1}
              </span>
              <span className="text-[10px] text-neutral-400 block">in Gate #{activeBooking?.gateNumber} line</span>
            </div>

            <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-700 text-center min-w-[110px]">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Est. Wait</span>
              <span className="text-2xl font-black text-amber-300 font-mono">
                ~{activeBooking?.estimatedWaitMinutes || 8}m
              </span>
              <span className="text-[10px] text-neutral-400 block">to Weighbridge</span>
            </div>

            {activeBooking?.status !== 'dbt_settled' && (
              <button
                onClick={() => advanceQueueSimulated(activeBooking.tokenNumber)}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95 shrink-0"
              >
                <FastForward className="w-4 h-4" />
                <span>Simulate Next Checkpoint</span>
              </button>
            )}
          </div>
        </div>

        {/* Token Switcher if multiple exist */}
        {bookings.length > 1 && (
          <div className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-semibold">Select Active Lot:</span>
            <div className="flex flex-wrap gap-1.5">
              {bookings.map((b) => (
                <button
                  key={b.tokenNumber}
                  onClick={() => setActiveFarmerToken(b.tokenNumber)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                    activeBooking.tokenNumber === b.tokenNumber
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {b.tokenNumber} ({b.cropName.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Mandi Stage Detailed Card */}
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Active Procurement Stage
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {activeBooking?.status === 'booked' && 'Scheduled: Awaiting Arrival at Mandi Gate'}
                  {activeBooking?.status === 'in_yard' && 'In Yard Queue: Vehicle Admitted & Staged in Bay'}
                  {activeBooking?.status === 'grading' && 'Laboratory Testing: Moisture & Grain Purity Assessment'}
                  {activeBooking?.status === 'weighed' && 'Weighbridge Finalized: Gross & Tare Weights Logged'}
                  {activeBooking?.status === 'grn_issued' && 'E-Pauti (GRN) Issued: Sent to PFMS Direct Settlement'}
                  {activeBooking?.status === 'dbt_settled' && 'Procurement Finalized: DBT Bank Credit Settled'}
                  {activeBooking?.status === 'diverted_marketplace' && 'Commercial Off-Take: Secondary Market Transfer'}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
              STATUS: {activeBooking?.status.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            {activeBooking?.status === 'booked' && `Your slot is confirmed for Gate #${activeBooking.gateNumber} on ${activeBooking.bookingDate} (${activeBooking.timeSlot}). Bring vehicle ${activeBooking.vehicleNumber} and present your Digital QR Pass at the boom barrier.`}
            {activeBooking?.status === 'in_yard' && `Vehicle ${activeBooking.vehicleNumber} has passed Gate #${activeBooking.gateNumber} ANPR camera. Current queue position is #${activeBooking.queuePosition}. Stand by for chime call.`}
            {activeBooking?.status === 'grading' && `Inspector is testing ${activeBooking.cropName} moisture with digital lab probe. Target standard moisture: 12.0%.`}
            {activeBooking?.status === 'weighed' && `Net weight recorded: ${activeBooking.netWeightQtl || activeBooking.estimatedWeightQtl} Quintals. Total payout generated: ₹${(activeBooking.totalPayout || (activeBooking.estimatedWeightQtl * activeBooking.mspRate)).toLocaleString('en-IN')}.`}
            {activeBooking?.status === 'dbt_settled' && `Full payment of ₹${activeBooking.totalPayout?.toLocaleString('en-IN')} has been credited directly to Bank Account ending in ${activeBooking.bankAccountLast4 || '4192'} via PFMS.`}
          </p>

          {/* Step Timeline */}
          <div className="pt-4">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-4">
              Procurement Milestones & Live Progression
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {queueSteps.map((step, idx) => {
                const isDone = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div 
                    key={step.key}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      isCurrent 
                        ? 'bg-emerald-900 text-white border-emerald-950 shadow-md ring-2 ring-emerald-400' 
                        : isDone 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                          : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold mb-1">
                      {isDone ? '✓ DONE' : isCurrent ? '● IN PROGRESS' : `STEP ${idx + 1}`}
                    </div>
                    <span className="text-xs font-bold block">{step.label}</span>
                    <span className={`text-[10px] block mt-0.5 ${isCurrent ? 'text-emerald-200' : 'text-neutral-500'}`}>
                      {step.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal containers */}
        <SlotBookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
        <VoiceBookingAssistant isOpen={isVoiceBookingOpen} onClose={() => setIsVoiceBookingOpen(false)} />
        <ReceiptModal isOpen={!!selectedReceipt} booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} type={receiptType} />
      </div>
    );
  }

  // DEDICATED VIEW: Digital QR Pass
  if (currentTab === 'qr_pass') {
    return (
      <div className="space-y-6">
        {renderFarmerTabBar()}

        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-neutral-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-800" />
                <h2 className="text-lg font-bold text-neutral-900">
                  Digital Mandi Gate Pass
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Official DoCA & FCI Authorized Entry Document
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              TOKEN #{activeBooking?.tokenNumber}
            </span>
          </div>

          {/* High Resolution Vector QR Display */}
          <div className="flex flex-col items-center py-4 bg-neutral-50 rounded-2xl border border-neutral-200">
            <QRCodeDisplay
              value={`DOCA-PASS:${activeBooking?.tokenNumber}:${activeBooking?.vehicleNumber}`}
              size={220}
              label={activeBooking?.tokenNumber}
              sublabel={`Assigned Gate #${activeBooking?.gateNumber || 2} · Fast-Track Boom Barrier`}
            />
            <p className="text-[11px] text-neutral-500 mt-2 font-mono">
              Scan at Gate Boom Barrier Camera or Security Terminal
            </p>
          </div>

          {/* Pass Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <span className="text-neutral-500 text-[10px] block">Farmer Name</span>
              <span className="font-bold text-neutral-900 text-sm">{activeBooking?.farmerName}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Phone / Aadhaar</span>
              <span className="font-mono font-bold text-neutral-900">{activeBooking?.farmerPhone} (****{activeBooking?.aadhaarLast4})</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Commodity & Variety</span>
              <span className="font-bold text-emerald-900">{activeBooking?.cropName}</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Declared Quantity</span>
              <span className="font-mono font-bold text-neutral-900">{activeBooking?.estimatedWeightQtl} Qtl (~{activeBooking?.bagsCount} bags)</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Arrival Window</span>
              <span className="font-semibold text-neutral-800">{activeBooking?.bookingDate} ({activeBooking?.timeSlot})</span>
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Registered Vehicle</span>
              <span className="font-mono font-bold text-neutral-900 uppercase">{activeBooking?.vehicleNumber} ({activeBooking?.vehicleType})</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedReceipt(activeBooking);
                setReceiptType('pass');
              }}
              className="py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF Pass</span>
            </button>

            <button
              onClick={handleSharePass}
              className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all border border-neutral-200 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-neutral-600" />
              <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Pass (SMS / WhatsApp)'}</span>
            </button>
          </div>
        </div>

        {/* Modal containers */}
        <SlotBookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
        <VoiceBookingAssistant isOpen={isVoiceBookingOpen} onClose={() => setIsVoiceBookingOpen(false)} />
        <ReceiptModal isOpen={!!selectedReceipt} booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} type={receiptType} />
      </div>
    );
  }

  // DEDICATED VIEW: Procurement & DBT Settlement History
  if (currentTab === 'dbt_history') {
    return (
      <div className="space-y-6">
        {renderFarmerTabBar()}

        {/* Financial Header Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-neutral-900 text-white rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Direct Benefit Transfer (PFMS)</span>
              <span>·</span>
              <span>Zero-Intermediary MSP Settlement</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Procurement Records & DBT Bank Credits
            </h2>
            <p className="text-xs text-emerald-200 mt-1">
              Verified weight tickets, moisture certificates, and direct Aadhaar-linked PFMS banking credits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-700 text-center min-w-[130px]">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Total DBT Credited</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ₹{totalDbtEarnings.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-300 block">100% PFMS Cleared</span>
            </div>

            <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-700 text-center min-w-[130px]">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Total Grain Sold</span>
              <span className="text-xl font-black text-white font-mono">
                {totalQuintals.toFixed(1)} Qtl
              </span>
              <span className="text-[10px] text-neutral-400 block">Official FCI Intake</span>
            </div>
          </div>
        </div>

        {/* DBT Transactions Table */}
        <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900">
              Historical Procurement & PFMS Banking Statement
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              {bookings.length} Registered Lots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600 uppercase text-[10px] font-semibold border-y border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">Token & Date</th>
                  <th className="py-2.5 px-3">Commodity</th>
                  <th className="py-2.5 px-3 text-right">Net Weight</th>
                  <th className="py-2.5 px-3">Quality & Moisture</th>
                  <th className="py-2.5 px-3 text-right">MSP Payout</th>
                  <th className="py-2.5 px-3">DBT / PFMS Status</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bookings.map((row) => (
                  <tr key={row.tokenNumber} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setActiveFarmerToken(row.tokenNumber)}
                        className="font-mono font-bold text-emerald-900 hover:underline block text-left"
                      >
                        {row.tokenNumber}
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {row.bookingDate}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-neutral-900">{row.cropName}</span>
                      <span className="text-[11px] text-neutral-500 block">{row.centerName.split('-')[0]}</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {row.netWeightQtl ? `${row.netWeightQtl} Qtl` : `${row.estimatedWeightQtl} Qtl (Est)`}
                    </td>

                    <td className="py-3 px-3">
                      {row.moisturePercent ? (
                        <div>
                          <span className="font-mono font-bold text-neutral-900">
                            {row.moisturePercent}%
                          </span>
                          <span className="ml-1 text-[10px] text-emerald-800 font-semibold">
                            ({row.qualityGrade || 'Grade A'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Pending inspection</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {row.totalPayout ? (
                        <span className="font-mono font-bold text-emerald-900 text-sm">
                          ₹{row.totalPayout.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="font-mono text-neutral-500">
                          ₹{(row.estimatedWeightQtl * row.mspRate).toLocaleString('en-IN')} (Est)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded w-fit ${
                          row.status === 'dbt_settled'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {row.status === 'dbt_settled' ? '✓ Credited via PFMS' : 'In Processing'}
                        </span>
                        {row.dbtRefNumber && (
                          <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                            Ref: {row.dbtRefNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedReceipt(row);
                          setReceiptType('grn');
                        }}
                        className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition-colors"
                      >
                        E-Pauti
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal containers */}
        <SlotBookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
        <VoiceBookingAssistant isOpen={isVoiceBookingOpen} onClose={() => setIsVoiceBookingOpen(false)} />
        <ReceiptModal isOpen={!!selectedReceipt} booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} type={receiptType} />
      </div>
    );
  }

  // DEFAULT VIEW: Overview Dashboard

  return (
    <div className="space-y-6">
      {renderFarmerTabBar()}
      
      {/* 1. Personalized Welcome Banner & Quick Actions */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl shadow-sm border border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
            <span>Kisan Suvidha Portal</span>
            <span>·</span>
            <span>Rabi & Kharif Buffer Procurement</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Namaste, {activeBooking?.farmerName || 'Rameshwar Singh Yadav'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1 max-w-xl">
            Aadhaar: ****{activeBooking?.aadhaarLast4 || '7184'} · Bank Linked: State Bank of India (PFMS Enabled) · Mandi: {activeBooking?.centerName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsVoiceBookingOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Mic className="w-4 h-4 text-neutral-950 animate-pulse" />
            <span>बोलकर बुक करें (Voice Booking)</span>
            <span className="text-[9px] bg-neutral-950/20 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
              Regional
            </span>
          </button>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-950 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <CalendarPlus className="w-4 h-4 text-emerald-800" />
            <span>+ Book Procurement Slot</span>
          </button>

          {activeBooking?.status !== 'dbt_settled' && activeBooking?.status !== 'diverted_marketplace' && (
            <button
              onClick={() => advanceQueueSimulated(activeBooking.tokenNumber)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-800/90 text-emerald-100 text-xs font-semibold hover:bg-emerald-700 hover:text-white transition-colors border border-emerald-600/60 whitespace-nowrap"
              title="Fast-forward simulation to next processing step"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Simulate Next Step</span>
            </button>
          )}
        </div>
      </div>

      {/* 1b. Regional Voice Assistant Accessibility Banner for Non-Literate / Elderly Farmers */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-sm">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950 text-sm">
                सुगम किसान आवाज़ सेवा (Voice-to-Text Regional Assistant)
              </span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                हिन्दी · ਪੰਜਾਬੀ · मराठी · తెలుగు · English
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 mt-0.5">
              बुजुर्ग व कम पढ़े-लिखे किसानों के लिए: बिना टाइप किए केवल अपनी क्षेत्रीय भाषा में बोलकर मंडी गेट पास बुक करें।
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsVoiceBookingOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>बोलकर बुक करें (Start Voice Booking)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Four Key KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Active Token */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Active Pass Token</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-mono font-bold text-neutral-900 truncate">
              {activeBooking?.tokenNumber || 'None'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Gate #{activeBooking?.gateNumber || 2}
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>Queue Position:</span>
            <span className="font-mono font-bold text-emerald-800">
              {activeBooking?.queuePosition ? `#${activeBooking.queuePosition} in line` : 'Processing'}
            </span>
          </div>
        </div>

        {/* Metric 2: Slots Booked */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Total Bookings</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {bookings.length}
            </span>
            <span className="text-xs text-neutral-400">This Season</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>Completed Intakes:</span>
            <span className="font-mono font-semibold text-neutral-900">
              {bookings.filter(b => b.status === 'dbt_settled').length} Lots
            </span>
          </div>
        </div>

        {/* Metric 3: Quintals Procured */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Volume Procured</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900 tabular-nums">
              {totalQuintals.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Quintals</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>Government Standard:</span>
            <span className="font-semibold text-emerald-700">FAQ Grade A</span>
          </div>
        </div>

        {/* Metric 4: DBT Payout */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">DBT Direct Transfer</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-emerald-950 tabular-nums">
              ₹{totalDbtEarnings.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              PFMS
            </span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>Zero Intermediaries:</span>
            <span className="font-semibold text-emerald-800">100% Direct to A/C</span>
          </div>
        </div>

      </div>

      {/* 3. Main Grid: Digital QR Pass & Real-Time Queue Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Digital Scannable QR Pass (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-neutral-900">
                Digital Mandi Entry Pass
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              TOKEN: {activeBooking?.tokenNumber}
            </span>
          </div>

          {/* QR Component */}
          <div className="flex flex-col items-center py-2">
            <QRCodeDisplay
              value={`DOCA-PASS:${activeBooking?.tokenNumber}:${activeBooking?.vehicleNumber}`}
              size={180}
              label={activeBooking?.tokenNumber}
              sublabel={`Assigned Gate #${activeBooking?.gateNumber || 2} · Fast-Track Lane`}
            />
          </div>

          {/* Pass Details Card */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2 font-sans">
            <div className="flex justify-between">
              <span className="text-neutral-500">Commodity:</span>
              <span className="font-bold text-neutral-900">{activeBooking?.cropName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Declared Quantity:</span>
              <span className="font-mono font-bold text-neutral-900">
                {activeBooking?.estimatedWeightQtl} Qtl (~{activeBooking?.bagsCount} bags)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Arrival Window:</span>
              <span className="font-semibold text-neutral-800">{activeBooking?.bookingDate} ({activeBooking?.timeSlot})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Vehicle Registered:</span>
              <span className="font-mono font-bold text-neutral-900 uppercase">
                {activeBooking?.vehicleNumber} ({activeBooking?.vehicleType})
              </span>
            </div>
          </div>

          {/* Pass Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setSelectedReceipt(activeBooking);
                setReceiptType('pass');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleSharePass}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors border border-emerald-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied Link!' : 'Share Pass'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Queue & Waiting Time Tracker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Live Yard Queue & Wait-Time Tracker
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Real-time automated status at {activeBooking?.centerName}
                  </p>
                </div>
              </div>

              {activeBooking?.status !== 'dbt_settled' ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Est. Gate Wait</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-800">
                      ~{activeBooking?.estimatedWaitMinutes || 15} mins
                    </span>
                  </div>
                  <button
                    onClick={() => advanceQueueSimulated(activeBooking.tokenNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    title="Simulate advance to next milestone checkpoint"
                  >
                    <span>Proceed Next Checkpoint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>DBT Transfer Complete</span>
                </div>
              )}
            </div>

            {/* Current Yard Status Box */}
            <div className="mt-4 p-4 rounded-xl border bg-emerald-50/60 border-emerald-200 flex items-start gap-3">
              <div className="p-2 bg-emerald-700 text-white rounded-lg mt-0.5 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]">
                  Current Mandi Stage
                </span>
                <h4 className="text-sm font-bold text-neutral-900 mt-0.5">
                  {activeBooking?.status === 'booked' && 'Scheduled: Awaiting Gate Arrival'}
                  {activeBooking?.status === 'in_yard' && 'In Yard Queue: Vehicle Registered at Gate #2'}
                  {activeBooking?.status === 'grading' && 'Active Testing: Grain Moisture & Purity Inspection at Bay 2'}
                  {activeBooking?.status === 'weighed' && 'Weighbridge Complete: Net Weight Recorded'}
                  {activeBooking?.status === 'grn_issued' && 'E-Pauti Issued: Awaiting PFMS Banking Settlement'}
                  {activeBooking?.status === 'dbt_settled' && 'Procurement Completed & DBT Funds Transferred'}
                  {activeBooking?.status === 'diverted_marketplace' && 'Transferred to Local Secondary Buyer Market'}
                </h4>
                <p className="text-neutral-600 mt-1">
                  {activeBooking?.status === 'in_yard' && `Position #${activeBooking.queuePosition} in line. Turn expected in ~${activeBooking.estimatedWaitMinutes} mins. Automated announcement will sound at Gate #${activeBooking.gateNumber}.`}
                  {activeBooking?.status === 'grading' && 'Laboratory analyst is testing kernel moisture with calibrated digital meter. Standard threshold is 12.0%.'}
                  {activeBooking?.status === 'dbt_settled' && `Transfer of ₹${activeBooking.totalPayout?.toLocaleString('en-IN')} credited to Bank Account ending in ${activeBooking.bankAccountLast4 || '4192'}.`}
                </p>
              </div>
            </div>

            {/* 6-Step Visual Timeline (Matches the video's step tracker) */}
            <div className="mt-6 space-y-4">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Procurement Milestones
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {queueSteps.map((s, idx) => {
                  const isDone = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={s.key} className="relative flex items-start gap-3">
                      {/* Node Dot */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-700 text-white'
                            : isCurrent
                            ? 'bg-emerald-900 text-white ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-white border-2 border-neutral-300 text-neutral-400'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isCurrent ? 'text-emerald-950 font-extrabold text-sm' : isDone ? 'text-neutral-900' : 'text-neutral-400'}`}>
                            {s.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isCurrent ? 'text-neutral-700' : 'text-neutral-400'}`}>
                          {s.sub}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Receipt View Button */}
          {activeBooking?.grnNumber && (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500">Official Document Generated:</span>
                <p className="font-mono font-bold text-neutral-900">{activeBooking.grnNumber}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedReceipt(activeBooking);
                  setReceiptType('grn');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                <span>View E-Pauti Slip</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* 4. AI Congestion & Wait-Time Forecast Widget */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-neutral-900">
                AI Mandi Congestion & Gate Wait-Time Predictor
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Trained on 4 years of historical mandi arrivals, truck throughput, and weighbridge turnaround times
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Optimal Arrival Window:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              08:00 AM - 09:30 AM (Green Fast Track)
            </span>
          </div>
        </div>

        {/* Forecast Bars */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {[
            { hour: '07:00 AM', wait: 10, level: 'low' },
            { hour: '08:30 AM', wait: 15, level: 'low', recommended: true },
            { hour: '10:00 AM', wait: 48, level: 'high' },
            { hour: '11:30 AM', wait: 70, level: 'peak' },
            { hour: '01:00 PM', wait: 55, level: 'high' },
            { hour: '02:30 PM', wait: 28, level: 'moderate' },
            { hour: '04:00 PM', wait: 16, level: 'low' },
          ].map((item) => {
            const barHeight = Math.round((item.wait / 70) * 80);
            const colorClass = 
              item.level === 'low' ? 'bg-emerald-600' :
              item.level === 'moderate' ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <div key={item.hour} className="flex flex-col items-center">
                <span className="text-[10px] font-mono font-bold text-neutral-700 mb-1">
                  {item.wait}m
                </span>
                <div className="w-full bg-neutral-100 rounded-t-lg h-24 flex items-end p-1">
                  <div 
                    className={`w-full rounded-t-md transition-all ${colorClass} ${item.recommended ? 'ring-2 ring-emerald-900 ring-offset-1' : ''}`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-2 font-mono whitespace-nowrap">
                  {item.hour.split(' ')[0]}
                </span>
                {item.recommended && (
                  <span className="mt-1 text-[9px] font-bold text-emerald-800 uppercase">
                    Best Slot
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Procurement & Direct Benefit Transfer (DBT) History Table */}
      <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Procurement & DBT Settlement Ledger
            </h3>
            <p className="text-xs text-neutral-500">
              Complete historical record of delivered lots, verified moisture %, and PFMS bank credits
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 uppercase text-[10px] font-semibold border-y border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Token & Date</th>
                <th className="py-2.5 px-3">Commodity</th>
                <th className="py-2.5 px-3 text-right">Net Weight</th>
                <th className="py-2.5 px-3">Quality & Moisture</th>
                <th className="py-2.5 px-3 text-right">MSP Payout</th>
                <th className="py-2.5 px-3">DBT / PFMS Status</th>
                <th className="py-2.5 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((row) => (
                <tr key={row.tokenNumber} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <button
                      onClick={() => setActiveFarmerToken(row.tokenNumber)}
                      className="font-mono font-bold text-emerald-900 hover:underline block text-left"
                    >
                      {row.tokenNumber}
                    </button>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {row.bookingDate}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-neutral-900">{row.cropName}</span>
                    <span className="text-[11px] text-neutral-500 block">{row.centerName.split('-')[0]}</span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                    {row.netWeightQtl ? `${row.netWeightQtl} Qtl` : `${row.estimatedWeightQtl} Qtl (Est)`}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`inline-block font-semibold ${row.qualityGrade?.includes('A') ? 'text-emerald-800' : 'text-neutral-700'}`}>
                      {row.qualityGrade || 'Pending Grading'}
                    </span>
                    {row.moisturePercent && (
                      <span className="text-[11px] text-neutral-500 font-mono block">
                        Moisture: {row.moisturePercent}%
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                    {row.totalPayout ? `₹${row.totalPayout.toLocaleString('en-IN')}` : `₹${(row.estimatedWeightQtl * row.mspRate).toLocaleString('en-IN')} (Est)`}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                      row.dbtStatus === 'Settled via PFMS' ? 'text-emerald-700' :
                      row.dbtStatus === 'Processing' ? 'text-amber-700' : 'text-neutral-500'
                    }`}>
                      {row.dbtStatus === 'Settled via PFMS' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{row.dbtStatus || (row.status === 'diverted_marketplace' ? 'Market Bidding' : 'Pending Intake')}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedReceipt(row);
                        setReceiptType(row.grnNumber ? 'grn' : 'pass');
                      }}
                      className="p-1.5 text-neutral-600 hover:text-emerald-900 hover:bg-neutral-100 rounded-lg transition-colors"
                      title={row.grnNumber ? 'View Official E-Pauti' : 'View Gate Pass'}
                    >
                      <Receipt className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Wizard Modal */}
      <SlotBookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          if (onSelectTab && currentTab === 'book_slot') {
            onSelectTab('overview');
          }
        }}
      />

      {/* Regional Language Voice-to-Text Booking Assistant */}
      <VoiceBookingAssistant
        isOpen={isVoiceBookingOpen}
        onClose={() => {
          setIsVoiceBookingOpen(false);
          if (onSelectTab && currentTab === 'voice_booking') {
            onSelectTab('overview');
          }
        }}
      />

      {/* Printable Receipt / Pass Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        booking={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        type={receiptType}
      />

    </div>
  );
};
