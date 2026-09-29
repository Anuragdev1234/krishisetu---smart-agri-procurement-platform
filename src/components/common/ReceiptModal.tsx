import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Download, Share2 } from 'lucide-react';
import { SlotBooking } from '../../types/procurement';
import { QRCodeDisplay } from './QRCodeDisplay';

interface ReceiptModalProps {
  booking: SlotBooking | null;
  isOpen: boolean;
  onClose: () => void;
  type?: 'grn' | 'pass';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  booking,
  isOpen,
  onClose,
  type = 'grn'
}) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isGrn = type === 'grn';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden print-container">
        
        {/* Header Actions (hidden on print) */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>{isGrn ? 'Official Goods Receipt Note (E-Pauti)' : 'Digital Gate Pass Slip'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 bg-white text-neutral-900 font-sans">
          
          {/* Official Gov Header */}
          <div className="border-b-2 border-emerald-950 pb-4 mb-6 text-center">
            <div className="inline-block p-1 px-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded text-[10px] font-bold uppercase tracking-wider mb-2">
              Government of India · Dept of Consumer Affairs (DoCA) & FCI
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-neutral-900">
              {isGrn ? 'Electronic Pauti / Goods Receipt Note (GRN)' : 'Mandi Digital Queue Access Token'}
            </h1>
            <p className="text-xs text-neutral-600 mt-1 font-mono">
              Center: {booking.centerName}
            </p>
          </div>

          {/* Quick Meta Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Token Number</span>
              <p className="font-mono font-bold text-emerald-950 text-sm">{booking.tokenNumber}</p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Appointment Gate</span>
              <p className="font-bold text-neutral-900 text-sm">Gate #{booking.gateNumber}</p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Slot Window</span>
              <p className="font-semibold text-neutral-800 text-[11px]">{booking.timeSlot}</p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Vehicle Plate</span>
              <p className="font-mono font-bold text-neutral-800 text-xs">{booking.vehicleNumber}</p>
            </div>
          </div>

          {/* Core Content */}
          {isGrn ? (
            <div className="space-y-4">
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-semibold text-xs text-neutral-800">
                  Farmer & Crop Procurement Details
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-neutral-500">Farmer Name:</span>
                    <p className="font-bold text-neutral-900">{booking.farmerName}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Kisan Mobile / Aadhaar:</span>
                    <p className="font-mono text-neutral-800">{booking.farmerPhone} (Aadhaar: ****{booking.aadhaarLast4})</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Crop Commodity:</span>
                    <p className="font-bold text-neutral-900">{booking.cropName}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Official Quality Grade:</span>
                    <p className="font-bold text-emerald-800">{booking.qualityGrade || 'Grade A (FAQ)'}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Moisture Content:</span>
                    <p className="font-mono font-semibold text-neutral-800">{booking.moisturePercent || 11.2}% (Threshold: 12%)</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Foreign Matter:</span>
                    <p className="font-mono text-neutral-800">{booking.foreignMatterPercent || 0.8}%</p>
                  </div>
                </div>
              </div>

              {/* Weighbridge Breakdown */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-semibold text-xs text-neutral-800 flex justify-between">
                  <span>Weighbridge Measurement</span>
                  <span className="font-mono text-[11px] text-neutral-600">Tare & Gross Certified</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3 text-center border-b border-neutral-200 text-xs">
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-500 text-[10px]">Gross Weight</span>
                    <p className="font-mono font-bold text-neutral-900 text-sm mt-0.5">
                      {booking.grossWeightKg?.toLocaleString('en-IN') || '24,200'} kg
                    </p>
                  </div>
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <span className="text-neutral-500 text-[10px]">Tare Weight</span>
                    <p className="font-mono font-bold text-neutral-700 text-sm mt-0.5">
                      {booking.tareWeightKg?.toLocaleString('en-IN') || '8,200'} kg
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-emerald-800 font-bold text-[10px]">Net Accepted</span>
                    <p className="font-mono font-extrabold text-emerald-950 text-sm mt-0.5">
                      {booking.netWeightQtl || booking.estimatedWeightQtl} Quintals
                    </p>
                  </div>
                </div>

                {/* Financial Payout */}
                <div className="p-4 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-900 font-medium">MSP Rate Guaranteed</span>
                    <p className="font-mono font-semibold text-xs text-emerald-800">
                      ₹{booking.mspRate.toLocaleString('en-IN')} / Quintal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-600 font-medium">Direct Benefit Transfer (DBT)</span>
                    <p className="font-mono font-extrabold text-lg text-emerald-950">
                      ₹{(booking.totalPayout || (booking.estimatedWeightQtl * booking.mspRate)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* DBT Reference & Bank Stamp */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">PFMS Reference</span>
                  <p className="font-mono font-semibold text-neutral-800">{booking.dbtRefNumber || 'PFMS-DOCA-99281741'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">Status</span>
                  <p className="font-semibold text-emerald-700 flex items-center gap-1 justify-end">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Settled to Bank A/C ****{booking.bankAccountLast4 || '4192'}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Digital Gate Pass View
            <div className="flex flex-col items-center text-center space-y-4">
              <QRCodeDisplay
                value={`DOCA-GATEPASS:${booking.tokenNumber}:${booking.centerId}:${booking.gateNumber}`}
                size={200}
                label={booking.tokenNumber}
                sublabel={`Show at Gate #${booking.gateNumber} entry scanner`}
              />

              <div className="w-full text-left p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Farmer:</span>
                  <span className="font-bold text-neutral-900">{booking.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Crop & Estimated Qtl:</span>
                  <span className="font-bold text-neutral-900">{booking.cropName} ({booking.estimatedWeightQtl} Qtl)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Scheduled Date:</span>
                  <span className="font-semibold text-neutral-800">{booking.bookingDate} ({booking.timeSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Allocated Gate:</span>
                  <span className="font-bold text-emerald-800">Gate Number {booking.gateNumber}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] text-left">
                ⚠️ <strong>Farmer Instruction:</strong> Please arrive 15 minutes before your time slot. Maintain this QR code on your phone screen or carry the printed slip for automated boom barrier scan.
              </div>
            </div>
          )}

          {/* Footer Signature Box */}
          <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
            <div>
              <p>Digitally signed by APMC Procurement Officer</p>
              <p className="font-mono text-[10px]">DoCA Automated Weighbridge System</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-neutral-800">STAMP: VERIFIED</p>
              <p className="text-[10px]">Food Corporation of India</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
