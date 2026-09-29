import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  FileCheck,
  Smartphone
} from 'lucide-react';
import { SlotBooking } from '../../types/procurement';
import { generateGatePassPdf } from '../../utils/generateGatePassPdf';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { audioChime } from '../../utils/audioChime';
import { speechVoice } from '../../utils/speechVoice';

interface GatePassPdfModalProps {
  booking: SlotBooking;
  isOpen: boolean;
  onClose: () => void;
}

export const GatePassPdfModal: React.FC<GatePassPdfModalProps> = ({
  booking,
  isOpen,
  onClose
}) => {
  const [paperFormat, setPaperFormat] = useState<'a4' | 'thermal_80mm'>('a4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = generateGatePassPdf(booking, {
        paperSize: paperFormat,
        centerCode: 'APMC-KRN-04',
        operatorName: 'Gurmeet Singh',
        operatorId: 'CSC-HR-KRN-104'
      });

      const filename = `GatePass_${booking.tokenNumber}_${booking.farmerName.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);

      audioChime.playSuccessChime();
      speechVoice.speak('Official Mandi Gate Pass PDF generated and downloaded.', 'en-IN');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerPrint = () => {
    // Generate PDF blob and open print or trigger window.print
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <FileCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                  DoCA Official E-Pauti & Pass
                </span>
                <span className="text-xs font-mono text-emerald-200">
                  {booking.tokenNumber}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Downloadable Hard-Copy Gate Pass Slip
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Format Switcher & Action Bar */}
        <div className="p-4 bg-neutral-100 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 font-semibold">Print Format:</span>
            <div className="p-1 bg-white rounded-xl border border-neutral-300 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setPaperFormat('a4')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paperFormat === 'a4'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Standard A4 Official Slip
              </button>
              <button
                onClick={() => setPaperFormat('thermal_80mm')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paperFormat === 'thermal_80mm'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                80mm Thermal POS Receipt
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-bold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-neutral-600" />
              <span>Print Hard Copy</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Receipt'}</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {downloadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>PDF Generated Successfully:</strong> Download started for <code>GatePass_{booking.tokenNumber}.pdf</code>. Print ready for farmer delivery.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
              A4 VECTOR PDF
            </span>
          </div>
        )}

        {/* Document Visual Preview Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-4 bg-neutral-200/50">
          
          {/* A4 Paper Viewport */}
          {paperFormat === 'a4' ? (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md border-2 border-neutral-800 space-y-4 text-neutral-900 text-xs">
              
              {/* Header Strip */}
              <div className="text-center border-b-2 border-neutral-900 pb-3">
                <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-600 block">
                  GOVERNMENT OF INDIA · DEPARTMENT OF CONSUMER AFFAIRS
                </span>
                <span className="text-[8px] font-semibold uppercase text-neutral-500 block">
                  Food Corporation of India (FCI) · APMC Central Division
                </span>
                <h2 className="text-base font-black uppercase text-neutral-900 mt-1">
                  Official Mandi Vehicle Entry Pass & Token
                </h2>
                <p className="text-xs font-bold text-emerald-900">
                  {booking.centerName}
                </p>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                  Center Code: APMC-KRN-04 · Date: {booking.bookingDate} · Station: Taraori Rural CSC Kiosk
                </p>
              </div>

              {/* Highlight Hero Card */}
              <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-300 grid grid-cols-3 gap-2 text-center">
                <div className="border-r border-neutral-300 pr-2">
                  <span className="text-[9px] text-neutral-500 font-bold block uppercase">Token Number</span>
                  <span className="text-base font-black text-emerald-900 font-mono">{booking.tokenNumber}</span>
                  <span className="text-[9px] text-neutral-500 block">UID: ...{booking.aadhaarLast4}</span>
                </div>
                <div className="border-r border-neutral-300 pr-2">
                  <span className="text-[9px] text-neutral-500 font-bold block uppercase">Designated Gate</span>
                  <span className="text-base font-black text-amber-800 font-mono">GATE #{booking.gateNumber}</span>
                  <span className="text-[9px] text-neutral-600 block font-semibold">Tractor Lane</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 font-bold block uppercase">Reporting Window</span>
                  <span className="text-xs font-bold text-neutral-900 block mt-1">{booking.timeSlot}</span>
                  <span className="text-[9px] text-rose-700 font-bold block">Arrive 15m Prior</span>
                </div>
              </div>

              {/* QR and Table Split */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-1">
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-xl border border-neutral-300 text-center">
                  <QRCodeDisplay
                    value={`DOCA-PASS:${booking.tokenNumber}:${booking.gateNumber}:${booking.vehicleNumber}`}
                    size={140}
                    label={booking.tokenNumber}
                    sublabel="OPTICAL ENTRY PASS"
                  />
                  <span className="text-[9px] text-neutral-500 font-mono mt-1">
                    Present to Boom Barrier Laser
                  </span>
                </div>

                <div className="sm:col-span-7 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500 font-sans">Farmer:</span>
                    <span className="font-bold text-neutral-900 font-sans">{booking.farmerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500 font-sans">Mobile:</span>
                    <span className="font-bold text-neutral-900">{booking.farmerPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500 font-sans">Vehicle:</span>
                    <span className="font-bold text-neutral-900">{booking.vehicleNumber} ({booking.vehicleType})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500 font-sans">Commodity:</span>
                    <span className="font-bold text-neutral-900 font-sans">{booking.cropName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span className="text-neutral-500 font-sans">Volume:</span>
                    <span className="font-bold text-neutral-900">{booking.estimatedWeightQtl} Qtl (~{booking.bagsCount} Bags)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500 font-sans">MSP Rate:</span>
                    <span className="font-bold text-emerald-800">Rs. {booking.mspRate.toLocaleString('en-IN')} / Qtl</span>
                  </div>
                </div>
              </div>

              {/* Bilingual Instructions Box */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5">⚠️ किसान निर्देश (Bilingual Notice):</span>
                1. कृपया समय से 15 मिनट पूर्व गेट नंबर {booking.gateNumber} पर पहुंचे और बूम बैरियर पर यह कोड दिखाएं।
                <br />
                2. धर्मकांटा वजन व नमी परीक्षण के बाद PFMS सीधा बैंक खाता भुगतान जारी करेगा।
              </div>

              {/* Sign-off Boxes */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-neutral-600 font-mono border-t border-neutral-200">
                <div className="p-2 border border-neutral-300 rounded-lg">
                  <span className="font-bold block text-neutral-800 font-sans">CSC Operator Stamp:</span>
                  <span>Gurmeet Singh (CSC-HR-104)</span>
                  <br />
                  <span className="text-[9px] text-emerald-700 font-bold">[VERIFIED - ZERO FEE]</span>
                </div>
                <div className="p-2 border border-neutral-300 rounded-lg">
                  <span className="font-bold block text-neutral-800 font-sans">Mandi Gate Security:</span>
                  <span>Physical Sign: ________________</span>
                  <br />
                  <span className="text-[9px] text-neutral-500">[SEAL AT WEIGHBRIDGE]</span>
                </div>
              </div>

            </div>
          ) : (
            /* 80mm Thermal Receipt Viewport */
            <div className="max-w-xs mx-auto bg-white p-5 rounded-2xl shadow-md border-2 border-dashed border-neutral-800 space-y-3 text-neutral-900 text-xs font-mono">
              <div className="text-center border-b border-dashed border-neutral-400 pb-2">
                <p className="text-[10px] font-bold">DEPT OF CONSUMER AFFAIRS</p>
                <p className="text-xs font-black">KRISHISETU MANDI PASS</p>
                <p className="text-[10px] text-neutral-600">{booking.centerName}</p>
                <p className="text-[9px] text-neutral-500">{booking.bookingDate}</p>
              </div>

              <div className="text-center py-1">
                <p className="text-sm font-black text-emerald-950">{booking.tokenNumber}</p>
                <p className="text-xs font-bold text-amber-800">GATE #{booking.gateNumber}</p>
                <p className="text-[10px]">{booking.timeSlot}</p>
              </div>

              <div className="flex justify-center py-2">
                <QRCodeDisplay
                  value={`DOCA-PASS:${booking.tokenNumber}:${booking.gateNumber}`}
                  size={120}
                  label={booking.tokenNumber}
                />
              </div>

              <div className="space-y-1 text-[11px] border-y border-dashed border-neutral-400 py-2">
                <div className="flex justify-between">
                  <span>Farmer:</span>
                  <span className="font-bold">{booking.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle:</span>
                  <span className="font-bold">{booking.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commodity:</span>
                  <span className="font-bold">{booking.cropName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-bold">{booking.estimatedWeightQtl} Qtl</span>
                </div>
                <div className="flex justify-between">
                  <span>MSP Rate:</span>
                  <span className="font-bold">Rs. {booking.mspRate}</span>
                </div>
              </div>

              <div className="text-[9px] text-center text-neutral-600 leading-tight">
                कृपया समय से 15 मिनट पूर्व गेट पर पहुंचे।<br />
                Aadhaar Direct DBT via PFMS<br />
                CSC Kiosk: CSC-HR-KRN-104 · Toll Free: 1800-180-DOCA
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Official Government E-Pauti document with SHA-256 encrypted optical barcode.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold transition-colors"
            >
              Close Preview
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF ({paperFormat === 'a4' ? 'A4' : 'Thermal'})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
