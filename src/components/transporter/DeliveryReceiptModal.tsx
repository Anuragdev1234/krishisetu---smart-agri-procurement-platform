import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, FileCheck, Truck } from 'lucide-react';
import { DispatchTrip } from '../../types/procurement';

interface DeliveryReceiptModalProps {
  trip: DispatchTrip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryReceiptModal: React.FC<DeliveryReceiptModalProps> = ({ trip, isOpen, onClose }) => {
  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden print-container">
        
        {/* Header */}
        <div className="p-4 bg-blue-950 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>FCI Official Consignment Handover Certificate (Proof of Delivery)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-blue-900 text-blue-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 sm:p-8 bg-white text-neutral-900 font-sans text-xs space-y-5">
          
          <div className="border-b-2 border-blue-950 pb-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Food Corporation of India · Ministry of Consumer Affairs, Food & Public Distribution
            </span>
            <h1 className="text-lg font-extrabold uppercase tracking-tight text-neutral-950 mt-1">
              Certificate of Safe Transit & Warehouse Intake
            </h1>
            <p className="text-[11px] font-mono text-neutral-600 mt-1">
              Consignment E-Challan: <strong>{trip.eChallanNumber}</strong> · Trip ID: {trip.tripId}
            </p>
          </div>

          {/* Delivery Verified Banner */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block">4-Digit Security OTP Verified</span>
                <span className="text-[11px] text-emerald-800">
                  Cargo physical handover accepted at receiving weighbridge.
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
              OTP: {trip.otpCode}
            </span>
          </div>

          {/* Details Grid */}
          <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Origin Mandi</span>
              <p className="font-bold text-neutral-900">{trip.fromCenterName}</p>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Destination Silo</span>
              <p className="font-bold text-neutral-900">{trip.toWarehouseName}</p>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Truck & Driver</span>
              <p className="font-mono font-bold text-neutral-900">{trip.truckNumber} ({trip.driverName})</p>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Corridor Transit</span>
              <p className="font-semibold text-neutral-800">{trip.distanceKm} km via NH-44 Expressway</p>
            </div>
          </div>

          {/* Load Reconciliation */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-bold text-neutral-800 flex justify-between">
              <span>Cargo Verification & Weighbridge Re-Check</span>
              <span className="font-mono text-emerald-800 text-[11px]">Zero Transit Loss (0.00%)</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-neutral-50 rounded-lg">
                <span className="text-[10px] text-neutral-500 block">Commodity</span>
                <span className="font-bold text-neutral-900 text-xs mt-0.5 block">{trip.cropName}</span>
              </div>
              <div className="p-2 bg-neutral-50 rounded-lg">
                <span className="text-[10px] text-neutral-500 block">Jute Bag Count</span>
                <span className="font-mono font-bold text-neutral-900 text-xs mt-0.5 block">{trip.totalBags} Bags</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">Gross Net Weight</span>
                <span className="font-mono font-extrabold text-emerald-950 text-xs mt-0.5 block">{trip.netWeightMT} MT</span>
              </div>
            </div>
          </div>

          {/* Freight Settlement */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 text-[10px] uppercase font-semibold block">Transporter Freight Bill</span>
              <span className="font-mono font-bold text-neutral-900">₹14,750 (42 km @ ₹350/MT)</span>
            </div>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Direct Bank Transfer Released</span>
            </span>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500">
            <div>
              <p>Receiving Superintendent: Shri R.K. Singhal</p>
              <p className="font-mono">FCI Depot Kurukshetra</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-neutral-800 font-mono">STATUS: RECORDED ON CENTRAL LEDGER</p>
              <p>DoCA Integrated Transit Protocol</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
