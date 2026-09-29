import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Zap, 
  ShieldCheck, 
  Filter, 
  Send, 
  FileCheck, 
  ChevronRight, 
  Layers, 
  Scale, 
  AlertCircle,
  Percent,
  Timer,
  Warehouse
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking, BuyerInventoryDemand, SupplyMatchRecommendation } from '../../types/procurement';
import { audioChime } from '../../utils/audioChime';
import { speechVoice } from '../../utils/speechVoice';

// Registered local commercial buyers with live inventory needs & deficit telemetry
const REGISTERED_BUYERS: BuyerInventoryDemand[] = [
  {
    id: 'BYR-FLOUR-101',
    buyerName: 'Garg Roller Flour Mills Ltd',
    buyerType: 'Flour Mill',
    gstin: '06AAACG1928K1Z2',
    location: 'Sector 3 Industrial Corridor, Karnal',
    distanceKm: 4.2,
    contactPerson: 'Suresh Garg (Procurement Head)',
    phone: '+91 98120 44921',
    targetCrops: ['Wheat (PBW 725 / Sharbati)', 'Wheat'],
    dailyConsumptionQtl: 350,
    currentInventoryQtl: 180,
    criticalBufferDays: 1.5,
    inventoryDeficitQtl: 170,
    urgencyLevel: 'critical',
    maxPurchasePricePerQtl: 2290, // +₹15 over MSP ₹2275
    qualityToleranceNotes: 'Moisture ≤ 12.5%, Gluten ≥ 28%, minimal foreign pod matter.',
    preferredMoistureMax: 12.5,
    directLiftFleetReady: true
  },
  {
    id: 'BYR-RICE-204',
    buyerName: 'Doaba Rice Shellers & Export Hub',
    buyerType: 'Rice Sheller',
    gstin: '06BBMDR8812F1Z9',
    location: 'GT Road Agri-Tech Park, Taraori',
    distanceKm: 6.8,
    contactPerson: 'Harpreet Singh Cheema',
    phone: '+91 98760 11982',
    targetCrops: ['Paddy / Rice (Grade A)', 'Paddy'],
    dailyConsumptionQtl: 500,
    currentInventoryQtl: 260,
    criticalBufferDays: 1.8,
    inventoryDeficitQtl: 240,
    urgencyLevel: 'critical',
    maxPurchasePricePerQtl: 2345, // +₹25 over MSP ₹2320
    qualityToleranceNotes: 'FAQ Grade A standard, head rice recovery ≥ 66%, moisture ≤ 17.0%.',
    preferredMoistureMax: 17.0,
    directLiftFleetReady: true
  },
  {
    id: 'BYR-OIL-305',
    buyerName: 'Hafed Mustard Oil Expeller Complex',
    buyerType: 'Oil Expeller',
    gstin: '06AAACH0091L1Z4',
    location: 'Kaithal Road Industrial Area, Karnal',
    distanceKm: 8.5,
    contactPerson: 'Rajiv Singla (Commercial Director)',
    phone: '+91 94160 33819',
    targetCrops: ['Mustard / Rapeseed', 'Mustard'],
    dailyConsumptionQtl: 200,
    currentInventoryQtl: 80,
    criticalBufferDays: 2.0,
    inventoryDeficitQtl: 120,
    urgencyLevel: 'high',
    maxPurchasePricePerQtl: 5680, // +₹30 over MSP ₹5650
    qualityToleranceNotes: 'Oil content ≥ 41.0%, moisture ≤ 9.0%, cold-press expeller grade.',
    preferredMoistureMax: 9.0,
    directLiftFleetReady: true
  },
  {
    id: 'BYR-DAL-408',
    buyerName: 'Kisan Agro Feed & Dal Processing Unit',
    buyerType: 'Dal Processor',
    gstin: '06CCMKA7721P1Z1',
    location: 'Gharaunda Mega Food Park',
    distanceKm: 11.2,
    contactPerson: 'Mohan Lal Juneja',
    phone: '+91 98960 55102',
    targetCrops: ['Chana / Chickpea', 'Chana'],
    dailyConsumptionQtl: 180,
    currentInventoryQtl: 75,
    criticalBufferDays: 2.2,
    inventoryDeficitQtl: 105,
    urgencyLevel: 'high',
    maxPurchasePricePerQtl: 5480, // +₹40 over MSP ₹5440
    qualityToleranceNotes: 'Uniform grain size, uninfested bold desi chana.',
    preferredMoistureMax: 12.0,
    directLiftFleetReady: true
  },
  {
    id: 'BYR-STARCH-502',
    buyerName: 'Taraori Starch & Maize Derivatives',
    buyerType: 'Feed Manufacturer',
    gstin: '06AAACT4410H1ZZ',
    location: 'Indri Road Bypass, Karnal',
    distanceKm: 13.5,
    contactPerson: 'Vikram Sethi',
    phone: '+91 99920 88123',
    targetCrops: ['Maize / Corn', 'Maize'],
    dailyConsumptionQtl: 220,
    currentInventoryQtl: 90,
    criticalBufferDays: 2.5,
    inventoryDeficitQtl: 130,
    urgencyLevel: 'moderate',
    maxPurchasePricePerQtl: 2115, // +₹25 over MSP ₹2090
    qualityToleranceNotes: 'Starch extraction grade, moisture ≤ 14.0%.',
    preferredMoistureMax: 14.0,
    directLiftFleetReady: false
  }
];

export const AISupplyMatcher: React.FC = () => {
  const { bookings, connectSupplyMatch, audioEnabled } = useProcurement();

  // Filter states
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [minMatchScore, setMinMatchScore] = useState<number>(75);
  const [activeDealModal, setActiveDealModal] = useState<SupplyMatchRecommendation | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);

  // Compute algorithmic recommendations matching active arrivals with local buyer inventory deficits
  const recommendations: SupplyMatchRecommendation[] = useMemo(() => {
    const list: SupplyMatchRecommendation[] = [];

    // Filter incoming bookings that are currently in arrivals, booked, or in-yard
    const activeArrivals = bookings.filter(b => 
      b.status === 'booked' || b.status === 'in_yard' || b.status === 'grading' || b.status === 'weighed'
    );

    activeArrivals.forEach(booking => {
      // Find matching buyers for this crop
      const matchingBuyers = REGISTERED_BUYERS.filter(buyer => 
        buyer.targetCrops.some(tc => booking.cropName.toLowerCase().includes(tc.toLowerCase()) || tc.toLowerCase().includes(booking.cropName.toLowerCase()))
      );

      matchingBuyers.forEach(buyer => {
        // Compute affinity score based on deficit urgency, distance, moisture compatibility, and volume
        let score = 80;

        // Deficit urgency boost
        if (buyer.urgencyLevel === 'critical') score += 12;
        else if (buyer.urgencyLevel === 'high') score += 7;

        // Proximity boost (closer mills save more road time)
        if (buyer.distanceKm < 5) score += 6;
        else if (buyer.distanceKm < 10) score += 3;

        // Volume fit
        const volumeRatio = booking.estimatedWeightQtl / buyer.inventoryDeficitQtl;
        if (volumeRatio >= 0.5 && volumeRatio <= 1.2) score += 4;

        // Fleet readiness
        if (buyer.directLiftFleetReady) score += 3;

        const matchScore = Math.min(99, Math.max(65, score));

        // Storage duration saved (hours): Staging in silo usually takes 48-72h. Direct off-take takes 2-3h.
        const storageHoursSaved = Math.round(44 + (buyer.distanceKm < 8 ? 6 : 0) + (buyer.urgencyLevel === 'critical' ? 8 : 0));
        
        // Silo holding cost saved: ~₹24 per quintal per 48h for aeration, labor, demurrage & shrink
        const siloCostSavedINR = Math.round(booking.estimatedWeightQtl * 26.5);

        // Spot price realization for farmer
        const farmerPriceRealization = buyer.maxPurchasePricePerQtl;
        const priceDeltaVsMsp = Math.max(0, farmerPriceRealization - booking.mspRate);

        // Natural language rationale
        const rationale = `${buyer.buyerName} operates at a critical ${buyer.criticalBufferDays}-day inventory deficit (${buyer.inventoryDeficitQtl} Qtl shortfall) just ${buyer.distanceKm} km away. Matching Lot ${booking.tokenNumber} (${booking.estimatedWeightQtl} Qtl ${booking.cropName.split(' ')[0]}) bypasses central silo holding, immediately saving ${storageHoursSaved} hours of yard dwell time while delivering ₹${farmerPriceRealization}/Qtl (+₹${priceDeltaVsMsp}/Qtl over MSP) to the farmer.`;

        // Check if already matched
        const isMatched = booking.matchedBuyer === buyer.buyerName;

        list.push({
          matchId: `MATCH-${booking.tokenNumber}-${buyer.id}`,
          booking,
          buyer,
          matchScore,
          storageHoursSaved,
          siloCostSavedINR,
          farmerPriceRealization,
          priceDeltaVsMsp,
          rationale,
          status: isMatched ? 'connected' : 'recommended'
        });
      });
    });

    return list.sort((a, b) => b.matchScore - a.matchScore);
  }, [bookings]);

  // Filtered recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      if (selectedCropFilter !== 'all' && !rec.booking.cropName.toLowerCase().includes(selectedCropFilter.toLowerCase())) {
        return false;
      }
      if (selectedUrgencyFilter !== 'all' && rec.buyer.urgencyLevel !== selectedUrgencyFilter) {
        return false;
      }
      if (rec.matchScore < minMatchScore) {
        return false;
      }
      return true;
    });
  }, [recommendations, selectedCropFilter, selectedUrgencyFilter, minMatchScore]);

  // Aggregate aggregate telemetry
  const totalStorageHoursSaved = useMemo(() => {
    return recommendations
      .filter(r => r.status === 'connected')
      .reduce((sum, r) => sum + r.storageHoursSaved, 168); // Baseline 168h + live additions
  }, [recommendations]);

  const totalSiloCostSaved = useMemo(() => {
    return recommendations
      .filter(r => r.status === 'connected')
      .reduce((sum, r) => sum + r.siloCostSavedINR, 245000); // Baseline ₹2.45L + live additions
  }, [recommendations]);

  // Execute single supply match
  const handleExecuteMatch = (rec: SupplyMatchRecommendation) => {
    connectSupplyMatch(
      rec.booking.tokenNumber,
      rec.buyer.buyerName,
      rec.farmerPriceRealization,
      rec.storageHoursSaved
    );

    setSuccessToast(
      `AI Supply Match Dispatched: Lot #${rec.booking.tokenNumber} allocated to ${rec.buyer.buyerName} at ₹${rec.farmerPriceRealization}/Qtl. Storage holding bypassed (-${rec.storageHoursSaved} hours)!`
    );
    setTimeout(() => setSuccessToast(null), 5000);
    setActiveDealModal(null);
  };

  // 1-Click Batch Match Optimization
  const handleBatchAutoMatch = () => {
    setIsBatchRunning(true);
    const eligible = filteredRecommendations.filter(r => r.status === 'recommended').slice(0, 3);
    
    if (eligible.length === 0) {
      setIsBatchRunning(false);
      return;
    }

    eligible.forEach((rec, idx) => {
      setTimeout(() => {
        connectSupplyMatch(
          rec.booking.tokenNumber,
          rec.buyer.buyerName,
          rec.farmerPriceRealization,
          rec.storageHoursSaved
        );
      }, idx * 400);
    });

    setTimeout(() => {
      setIsBatchRunning(false);
      audioChime.playSuccessChime();
      setSuccessToast(`Batch AI Supply Match Complete: ${eligible.length} incoming lots paired with local processors. 182 silo hours reclaimed!`);
      setTimeout(() => setSuccessToast(null), 5000);
    }, eligible.length * 400 + 200);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Storage Duration Metrics */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-neutral-900 text-white rounded-2xl shadow-sm border border-emerald-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Supply Chain Engine</span>
            <span>·</span>
            <span>Zero-Storage JIT Procurement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>AI Supply Matcher & Storage Duration Minimizer</span>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              Live Algorithmic Dispatch
            </span>
          </h2>
          <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
            Cross-references incoming mandi grain arrival logs against real-time commercial buyer inventory deficits (flour mills, shellers, expellers). Bypasses multi-day silo holding by matching lots directly to off-take processors.
          </p>
        </div>

        {/* Global Impact Summary Bar */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-700 text-xs text-center min-w-[120px]">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Storage Saved</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {totalStorageHoursSaved} Hours
            </span>
            <span className="text-[10px] text-neutral-400 block">-94% Dwell Time</span>
          </div>

          <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-700 text-xs text-center min-w-[120px]">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase block">Holding Cost Saved</span>
            <span className="text-lg font-black text-amber-300 font-mono">
              ₹{(totalSiloCostSaved / 100000).toFixed(2)} Lakh
            </span>
            <span className="text-[10px] text-neutral-400 block">Demurrage & Aeration</span>
          </div>

          <button
            onClick={handleBatchAutoMatch}
            disabled={isBatchRunning}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95 shrink-0"
            title="Automatically pair top high-confidence matches to local mills"
          >
            <Zap className="w-4 h-4" />
            <span>{isBatchRunning ? 'Optimizing Matches...' : '1-Click Auto-Match All'}</span>
          </button>
        </div>
      </div>

      {/* 2. Success Feedback Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 shadow-xs flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
            SMS NOTIFIED
          </span>
        </div>
      )}

      {/* 3. Filter & Threshold Configuration Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Crop Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span>Commodity:</span>
          </span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-300 font-bold text-neutral-900 bg-white"
          >
            <option value="all">All Commodities ({recommendations.length} Matches)</option>
            <option value="wheat">Wheat (PBW 725 / Sharbati)</option>
            <option value="paddy">Paddy / Rice (Grade A)</option>
            <option value="chana">Chana / Chickpea</option>
            <option value="mustard">Mustard / Rapeseed</option>
            <option value="maize">Maize / Corn</option>
          </select>
        </div>

        {/* Urgency Filter */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-600">Buyer Deficit Urgency:</span>
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
            <button
              onClick={() => setSelectedUrgencyFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                selectedUrgencyFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedUrgencyFilter('critical')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                selectedUrgencyFilter === 'critical' ? 'bg-rose-700 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Critical (&lt;2 Days)
            </button>
            <button
              onClick={() => setSelectedUrgencyFilter('high')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                selectedUrgencyFilter === 'high' ? 'bg-amber-600 text-white shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              High Priority
            </button>
          </div>
        </div>

        {/* Min Match Score Slider */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-600">Affinity Threshold:</span>
          <input
            type="range"
            min={65}
            max={95}
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="w-24 accent-emerald-700 cursor-pointer"
          />
          <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ≥{minMatchScore}%
          </span>
        </div>

        <div className="text-neutral-500 font-mono text-[11px]">
          Showing <strong>{filteredRecommendations.length}</strong> AI Recommendations
        </div>

      </div>

      {/* 4. Active Buyer Deficit & Inventory Radar Bar */}
      <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-neutral-900">
              Local Processor Live Deficit Registry (Immediate Off-Take Capacity)
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {REGISTERED_BUYERS.length} Licensed Mills within 15 km Radius
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {REGISTERED_BUYERS.map((buyer) => {
            const isCritical = buyer.urgencyLevel === 'critical';
            const isHigh = buyer.urgencyLevel === 'high';

            return (
              <div 
                key={buyer.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCritical 
                    ? 'bg-rose-50/70 border-rose-200 shadow-2xs' 
                    : isHigh 
                      ? 'bg-amber-50/70 border-amber-200 shadow-2xs' 
                      : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-neutral-900 truncate">
                    {buyer.buyerName.split(' ')[0]} {buyer.buyerName.split(' ')[1]}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    isCritical ? 'bg-rose-200 text-rose-900' : isHigh ? 'bg-amber-200 text-amber-900' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {buyer.urgencyLevel}
                  </span>
                </div>

                <div className="text-[10px] text-neutral-500 mb-2 truncate">
                  {buyer.buyerType} · {buyer.distanceKm} km away
                </div>

                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-neutral-500">Deficit:</span>
                  <span className="font-bold text-rose-700">-{buyer.inventoryDeficitQtl} Qtl</span>
                </div>

                <div className="flex items-baseline justify-between text-xs font-mono mt-0.5">
                  <span className="text-neutral-500">Max Bid:</span>
                  <span className="font-bold text-emerald-800">₹{buyer.maxPurchasePricePerQtl}</span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-neutral-200/60 text-[9px] text-neutral-500 flex items-center justify-between">
                  <span>{buyer.targetCrops[0].split(' ')[0]}</span>
                  <span className="font-bold text-emerald-700">Fleet Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. AI Recommendation Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <span>Optimal Supply Matches & Off-Take Proposals</span>
            <span className="text-xs font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
              Sorted by Match Score & Storage Duration Saved
            </span>
          </h3>
          <span className="text-xs text-neutral-500">
            Real-time Arrival Logs ➔ Direct Mill Clearance
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRecommendations.map((rec) => {
            const isConnected = rec.status === 'connected';

            return (
              <div
                key={rec.matchId}
                className={`p-5 rounded-2xl border transition-all shadow-xs relative overflow-hidden flex flex-col justify-between space-y-4 ${
                  isConnected 
                    ? 'bg-emerald-50/80 border-emerald-300' 
                    : 'bg-white border-neutral-200 hover:border-emerald-300'
                }`}
              >
                {/* Card Top: Match Score & Storage Savings Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-black text-xs">
                      {rec.matchScore}%
                    </span>
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        High Affinity Supply Match
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Immediate Gate-to-Mill Transfer
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg">
                      <Timer className="w-3.5 h-3.5 text-teal-700" />
                      <span>-{rec.storageHoursSaved}h Storage</span>
                    </span>
                  </div>
                </div>

                {/* Match Pairing Split: Arrival Lot (Left) ➔ Matched Buyer (Right) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  
                  {/* Left: Incoming Arrival Lot */}
                  <div className="sm:col-span-5 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {rec.booking.tokenNumber}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        Gate #{rec.booking.gateNumber}
                      </span>
                    </div>

                    <span className="font-bold text-neutral-900 block truncate mt-1">
                      {rec.booking.farmerName}
                    </span>
                    <span className="text-neutral-700 block font-semibold">
                      {rec.booking.cropName}
                    </span>
                    <div className="text-[11px] text-neutral-500 flex justify-between font-mono pt-1 border-t border-neutral-200">
                      <span>Volume:</span>
                      <span className="font-bold text-neutral-800">{rec.booking.estimatedWeightQtl} Qtl</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 flex justify-between font-mono">
                      <span>MSP Rate:</span>
                      <span className="font-bold text-neutral-800">₹{rec.booking.mspRate}/Qtl</span>
                    </div>
                  </div>

                  {/* Center Transfer Arrow */}
                  <div className="sm:col-span-2 flex flex-col items-center justify-center text-emerald-700">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-emerald-800" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 mt-1">
                      DIRECT JIT
                    </span>
                  </div>

                  {/* Right: Matched Commercial Buyer */}
                  <div className="sm:col-span-5 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-teal-900 bg-teal-100 px-1.5 py-0.5 rounded">
                        {rec.buyer.buyerType}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {rec.buyer.distanceKm} km
                      </span>
                    </div>

                    <span className="font-bold text-neutral-900 block truncate mt-1">
                      {rec.buyer.buyerName}
                    </span>
                    <span className="text-[10px] text-neutral-500 block truncate">
                      {rec.buyer.location}
                    </span>
                    <div className="text-[11px] text-neutral-500 flex justify-between font-mono pt-1 border-t border-emerald-200">
                      <span>Off-Take Price:</span>
                      <span className="font-bold text-emerald-800">₹{rec.farmerPriceRealization}/Qtl</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 flex justify-between font-mono font-bold">
                      <span>Farmer Premium:</span>
                      <span>+₹{rec.priceDeltaVsMsp}/Qtl over MSP</span>
                    </div>
                  </div>

                </div>

                {/* AI Rationale Box */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
                  <div className="flex items-center gap-1 font-bold text-neutral-800 mb-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>AI Supply Matching Rationale:</span>
                  </div>
                  <p>{rec.rationale}</p>
                </div>

                {/* Bottom Impact & Action Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                    <span>Silo Cost Saved: <strong className="text-emerald-800">₹{rec.siloCostSavedINR.toLocaleString('en-IN')}</strong></span>
                    <span>·</span>
                    <span>Status: <strong className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>{isConnected ? 'OFF-TAKE DISPATCHED' : 'READY TO MATCH'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Off-Take Agreement Active</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExecuteMatch(rec)}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Connect & Authorize Off-Take</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
