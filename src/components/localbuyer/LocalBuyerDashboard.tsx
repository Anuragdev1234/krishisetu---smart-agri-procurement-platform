import React, { useState } from 'react';
import { 
  Store, 
  Gavel, 
  FileSpreadsheet, 
  Receipt, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  ArrowUpRight,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { MarketplaceLot } from '../../types/procurement';
import { InvoiceModal } from './InvoiceModal';

interface LocalBuyerDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const LocalBuyerDashboard: React.FC<LocalBuyerDashboardProps> = ({ currentTab, onSelectTab }) => {
  const { marketplaceLots, placeMarketBid, acceptAskingPrice } = useProcurement();

  const [selectedLot, setSelectedLot] = useState<MarketplaceLot>(marketplaceLots[0]);
  const [bidAmountInput, setBidAmountInput] = useState<number>(2200);
  const [bidSuccessMsg, setBidSuccessMsg] = useState<string | null>(null);
  const [buyerName] = useState('Garg Roller Flour Mills (Karnal)');
  const [searchFilter, setSearchFilter] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  React.useEffect(() => {
    if (currentTab === 'invoices') {
      setIsInvoiceOpen(true);
    }
  }, [currentTab]);

  const activeLot = selectedLot || marketplaceLots[0];

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLot || bidAmountInput <= 0) return;

    placeMarketBid(activeLot.id, bidAmountInput, buyerName);
    setBidSuccessMsg(`Offer of ₹${bidAmountInput}/Qtl placed successfully on Lot ${activeLot.id}!`);
    setTimeout(() => setBidSuccessMsg(null), 3500);
  };

  const handleInstantBuy = () => {
    if (!activeLot) return;
    acceptAskingPrice(activeLot.id, buyerName);
    setBidSuccessMsg(`Purchased Lot ${activeLot.id} at asking price of ₹${activeLot.askingPricePerQtl}/Qtl! Invoice generated.`);
    setTimeout(() => setBidSuccessMsg(null), 4000);
  };

  const filteredLots = marketplaceLots.filter(l => 
    l.cropName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.farmerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.centerName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 text-white rounded-2xl shadow-sm border border-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Local Licensed Merchant Exchange</span>
            <span>·</span>
            <span>Secondary Mandi Bidding Desk</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Open Grain Trading & Commercial Milling Board
          </h1>
          <p className="text-xs text-amber-200 mt-0.5">
            Licensed APMC Merchant: Garg Roller Flour Mills · GSTIN: 06AAACG1928K1Z2 · Direct Mandi Settlements
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-xs font-semibold text-amber-200">
            Open Market Lots: {marketplaceLots.filter(l => l.status === 'open').length} Active
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Available Open Lots</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {marketplaceLots.filter(l => l.status === 'open').length}
            </span>
            <span className="text-xs text-neutral-500 font-mono">130 Quintals Total</span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-100">
            Immediate yard pickup available
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Average Bidding Discount</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-emerald-700">
              -4.8%
            </span>
            <span className="text-xs text-neutral-500">vs MSP Benchmark</span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-100">
            High commercial milling value
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Verified Mandi Quality Seals</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>100% Inspected</span>
            </span>
            <span className="text-xs text-neutral-400">DoCA Lab</span>
          </div>
          <p className="text-xs text-neutral-600 mt-2 pt-2 border-t border-neutral-100">
            Certified moisture & purity parameters
          </p>
        </div>
      </div>

      {/* 3. Main Grid: Open Market Board & Bidding Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Open Market Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-neutral-900">
                Live Secondary Market Feed
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-500">
              REAL-TIME APMC
            </span>
          </div>

          <div className="space-y-3">
            {filteredLots.map((lot) => {
              const isSelected = activeLot.id === lot.id;
              const isSold = lot.status === 'sold';
              return (
                <div
                  key={lot.id}
                  onClick={() => {
                    setSelectedLot(lot);
                    setBidAmountInput(lot.highestBidPerQtl + 20);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-neutral-900">{lot.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isSold ? 'bg-neutral-200 text-neutral-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isSold ? 'Sold to Buyer' : 'Open for Bidding'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900">
                    {lot.cropName} · {lot.quantityQtl} Quintals
                  </h4>

                  <div className="text-[11px] text-neutral-600 mt-1 flex items-center justify-between">
                    <span>Farmer: {lot.farmerName}</span>
                    <span className="font-mono text-neutral-500">Moisture: {lot.moisturePercent}%</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Asking Price:</span>
                      <span className="font-mono font-semibold text-neutral-700">₹{lot.askingPricePerQtl}/Qtl</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Top Offer:</span>
                      <span className="font-mono font-extrabold text-amber-900 text-sm">
                        ₹{lot.highestBidPerQtl}/Qtl
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Quality Report & Bidding Desk (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ACTIVE LOT: {activeLot.id}
              </span>
              <h3 className="text-base font-bold text-neutral-900 mt-1">
                {activeLot.cropName} ({activeLot.quantityQtl} Quintals)
              </h3>
              <p className="text-xs text-neutral-500">
                Location: {activeLot.centerName} · Listed at {activeLot.listedAt}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-400 block">Total Lot Value (Asking):</span>
              <span className="text-lg font-mono font-extrabold text-emerald-950">
                ₹{(activeLot.quantityQtl * activeLot.askingPricePerQtl).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Official Quality Report Card */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Mandi Quality Inspector Lab Report</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                ✓ CERTIFIED QUALITY SEAL
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-500 text-[10px] block">Moisture %</span>
                <span className="font-mono font-bold text-sm text-amber-800 mt-0.5 block">
                  {activeLot.moisturePercent}%
                </span>
                <span className="text-[9px] text-neutral-400">Commercial grade</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-500 text-[10px] block">Grain Purity</span>
                <span className="font-mono font-bold text-sm text-emerald-800 mt-0.5 block">
                  97.4%
                </span>
                <span className="text-[9px] text-neutral-400">Chaff &lt; 2.6%</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-neutral-200">
                <span className="text-neutral-500 text-[10px] block">Test Weight</span>
                <span className="font-mono font-bold text-sm text-neutral-800 mt-0.5 block">
                  78.2 kg/hL
                </span>
                <span className="text-[9px] text-neutral-400">Plump kernels</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200 leading-relaxed">
              <strong>Inspector Remarks:</strong> {activeLot.qualityNotes}
            </p>
          </div>

          {/* Interactive Bidding & Instant Purchase Desk */}
          {activeLot.status === 'open' ? (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase">
                  <Gavel className="w-4 h-4 text-amber-800" />
                  <span>Bidding & Direct Offer Desk</span>
                </div>
                <span className="text-xs text-neutral-600">
                  Top Bidder: <strong>{activeLot.highestBidder || 'None'}</strong>
                </span>
              </div>

              {/* Bidding Form */}
              <form onSubmit={handlePlaceBid} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="font-semibold text-neutral-700">
                      Submit Your Price Offer (₹ per Quintal)
                    </label>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{bidAmountInput}/Qtl · Total: ₹{(bidAmountInput * activeLot.quantityQtl).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="10"
                      min={activeLot.highestBidPerQtl + 5}
                      value={bidAmountInput}
                      onChange={(e) => setBidAmountInput(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
                    >
                      Place Counter-Bid
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-amber-200/80">
                  <span className="text-xs text-amber-900">
                    Skip auction and lock lot instantly?
                  </span>
                  <button
                    type="button"
                    onClick={handleInstantBuy}
                    className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Accept Asking Price (₹{activeLot.askingPricePerQtl}/Qtl)</span>
                  </button>
                </div>
              </form>

              {bidSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-950 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{bidSuccessMsg}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-100 rounded-xl border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-sm">Lot Purchased & Finalized</span>
                  <p className="text-emerald-800 mt-0.5">
                    Purchased by <strong>{activeLot.highestBidder}</strong> for ₹{activeLot.highestBidPerQtl}/Qtl. Mandi Gate release pass active.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(true)}
                className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs whitespace-nowrap"
              >
                View APMC Tax Invoice
              </button>
            </div>
          )}

          {/* Bid History Table */}
          <div>
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Recent Live Bids on this Lot
            </span>
            <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 text-neutral-500 text-[10px] uppercase font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="py-2 px-3">Merchant Buyer</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3 text-right">Offer / Qtl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {activeLot.bids.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-neutral-400">
                        No previous bids on this lot. Be the first to place an offer!
                      </td>
                    </tr>
                  ) : (
                    activeLot.bids.map((b, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">
                          {b.buyerName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500 text-[11px]">
                          {b.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-900 text-right">
                          ₹{b.amountPerQtl}/Qtl
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        lot={activeLot}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

    </div>
  );
};
