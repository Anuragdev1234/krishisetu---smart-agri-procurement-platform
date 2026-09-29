import React, { useState } from 'react';
import { 
  Printer, 
  Smartphone, 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  Search, 
  Volume2, 
  QrCode, 
  CalendarPlus,
  Send,
  HelpCircle,
  FileText,
  ScanLine,
  Camera,
  Download,
  FileCheck,
  Sparkles,
  Eye
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { SlotBooking } from '../../types/procurement';
import { speechVoice } from '../../utils/speechVoice';
import { audioChime } from '../../utils/audioChime';
import { generateGatePassPdf } from '../../utils/generateGatePassPdf';
import { GatePassPdfModal } from './GatePassPdfModal';
import { KioskQRScanner } from './KioskQRScanner';

export type KioskTab = 'scan_validate' | 'assisted_booking' | 'paper_slip' | 'ivr_simulator';

interface KioskDashboardProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const KioskDashboard: React.FC<KioskDashboardProps> = ({ currentTab, onSelectTab }) => {
  const { crops, centers, bookSlot, bookings, sendSms } = useProcurement();

  // Mode: 'scan_validate' | 'assisted_booking' | 'paper_slip' | 'ivr_simulator'
  const [activeTab, setActiveTab] = useState<KioskTab>(
    (currentTab as KioskTab) || 'scan_validate'
  );

  React.useEffect(() => {
    if (currentTab && ['scan_validate', 'assisted_booking', 'paper_slip', 'ivr_simulator'].includes(currentTab)) {
      setActiveTab(currentTab as KioskTab);
    }
  }, [currentTab]);

  const handleTabChange = (tab: KioskTab) => {
    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  // Kiosk Assisted Booking Form State
  const [farmerAadhaarInput, setFarmerAadhaarInput] = useState('7184 9012 3341');
  const [farmerNameInput, setFarmerNameInput] = useState('Sohan Lal Sharma');
  const [farmerPhoneInput, setFarmerPhoneInput] = useState('+91 94140 55678');
  const [cropIdInput, setCropIdInput] = useState(crops[0].id);
  const [estimatedWeightInput, setEstimatedWeightInput] = useState(140);
  const [vehicleNumberInput, setVehicleNumberInput] = useState('HR 05 C 8841');
  const [bookingSuccessPass, setBookingSuccessPass] = useState<SlotBooking | null>(null);

  // Paper Slip Print Preview State
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<SlotBooking>(bookings[0]);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Direct PDF Download Handler
  const handleDirectDownloadPdf = (bookingToDownload?: SlotBooking) => {
    const target = bookingToDownload || selectedPassForPrint;
    if (!target) return;
    setIsGeneratingPdf(true);
    try {
      const doc = generateGatePassPdf(target, {
        paperSize: 'a4',
        centerCode: 'APMC-KRN-04',
        operatorName: 'Gurmeet Singh',
        operatorId: 'CSC-HR-KRN-104'
      });
      const filename = `GatePass_${target.tokenNumber}_${target.farmerName.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      audioChime.playSuccessChime();
      speechVoice.speak(`Mandi Gate Pass PDF for ${target.farmerName} generated and downloaded.`, 'en-IN');
      setDownloadSuccessToast(`Downloaded official PDF: ${filename}`);
      setTimeout(() => setDownloadSuccessToast(null), 4500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // IVR Simulator State
  const [callActive, setCallActive] = useState(false);
  const [ivrStep, setIvrStep] = useState<number>(1);
  const [dialedDigits, setDialedDigits] = useState<string>('');
  const [ivrMessage, setIvrMessage] = useState<string>('Welcome to Kisan Suvidha Mandi Helpline (1800-180-DOCA). Press 1 for Hindi, Press 2 for English.');

  const handleKioskBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const crop = crops.find(c => c.id === cropIdInput) || crops[0];
    const center = centers[0];

    const newBooking = bookSlot({
      farmerName: farmerNameInput,
      farmerPhone: farmerPhoneInput,
      aadhaarLast4: farmerAadhaarInput.replace(/\s+/g, '').slice(-4),
      cropId: crop.id,
      cropName: crop.name,
      estimatedWeightQtl: estimatedWeightInput,
      bagsCount: estimatedWeightInput * 2,
      centerId: center.id,
      centerName: center.name,
      bookingDate: '2026-09-30',
      timeSlot: '10:00 AM - 11:00 AM',
      vehicleNumber: vehicleNumberInput,
      vehicleType: 'Tractor Trolley',
      mspRate: crop.mspRatePerQtl
    });

    setBookingSuccessPass(newBooking);
    setSelectedPassForPrint(newBooking);
  };

  // IVR Call Flow Simulator
  const startIvrCall = () => {
    setCallActive(true);
    setIvrStep(1);
    setDialedDigits('');
    const msg = 'Namaste! Welcome to Kisan Suvidha Helpline (1800-180-DOCA). Press 1 for Hindi, Press 2 for English.';
    setIvrMessage(msg);
    speechVoice.speak(msg, 'en-IN');
  };

  const handleKeyPress = (num: string) => {
    if (!callActive) return;
    setDialedDigits(prev => prev + num);

    if (ivrStep === 1) {
      // Language selected
      setIvrStep(2);
      const msg = 'Press 1 to Book Mandi Slot. Press 2 to Check Queue Position. Press 3 for Payment DBT Status.';
      setIvrMessage(msg);
      speechVoice.speak(msg, 'en-IN');
    } else if (ivrStep === 2) {
      if (num === '1') {
        // Book slot
        setIvrStep(3);
        const msg = 'Select Mandi: Press 1 for Karnal Central Mandi, Press 2 for Indore Terminal, Press 3 for Khanna Mandi.';
        setIvrMessage(msg);
        speechVoice.speak(msg, 'en-IN');
      } else if (num === '2') {
        setIvrStep(5);
        const msg = 'Your current token DOCA WHT 8492 is at Gate 2. Queue position 3. Estimated wait time is 18 minutes.';
        setIvrMessage(msg);
        speechVoice.speak(msg, 'en-IN');
      } else {
        setIvrStep(5);
        const msg = 'Your payment of 5 lakh 23 thousand rupees for Chana has been processed via PFMS to your linked SBI account.';
        setIvrMessage(msg);
        speechVoice.speak(msg, 'en-IN');
      }
    } else if (ivrStep === 3) {
      // Mandi selected
      setIvrStep(4);
      const msg = 'Select Commodity: Press 1 for Wheat at MSP 2,275 rupees, Press 2 for Paddy Grade A, Press 3 for Mustard.';
      setIvrMessage(msg);
      speechVoice.speak(msg, 'en-IN');
    } else if (ivrStep === 4) {
      // Confirmed
      setIvrStep(5);
      const token = `DOCA-IVR-${Math.floor(1000 + Math.random() * 9000)}`;
      const msg = `Dhanyawad! Your slot has been reserved for tomorrow 09:30 AM at Gate 2. Token number ${token}. Confirmation SMS sent to your mobile.`;
      setIvrMessage(msg);
      speechVoice.speak(msg, 'en-IN');
      sendSms('+91 98765 43210', `IVR Toll-Free Reservation: Token #${token} booked for Wheat at Karnal Mandi (Gate 2). Keep SMS ready at gate.`, 'booking');
    }
  };

  const endIvrCall = () => {
    speechVoice.stop();
    setCallActive(false);
    setIvrStep(1);
    setDialedDigits('');
    setIvrMessage('Call Disconnected.');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950 via-neutral-900 to-purple-950 text-white rounded-2xl shadow-sm border border-purple-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Gram Panchayat & CSC Assisted Kiosk</span>
            <span>·</span>
            <span>Inclusivity for Feature Phones & Offline Farmers</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Common Service Centre (CSC) Operator Desk
          </h1>
          <p className="text-xs text-purple-200 mt-0.5">
            Centre Code: CSC-HR-KRN-104 · Operator: Gurmeet Singh · Gram Panchayat: Taraori Rural
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center p-1 bg-purple-900/60 rounded-xl border border-purple-700/60 shrink-0 gap-1">
          <button
            onClick={() => handleTabChange('scan_validate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'scan_validate' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-200 hover:text-white'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Camera QR Scanner</span>
            <span className="text-[9px] bg-purple-500/30 px-1 rounded uppercase font-bold tracking-wider">Live</span>
          </button>
          <button
            onClick={() => handleTabChange('assisted_booking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'assisted_booking' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-200 hover:text-white'
            }`}
          >
            Assisted Booking
          </button>
          <button
            onClick={() => handleTabChange('paper_slip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'paper_slip' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-200 hover:text-white'
            }`}
          >
            Print QR Slip
          </button>
          <button
            onClick={() => handleTabChange('ivr_simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ivr_simulator' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-200 hover:text-white'
            }`}
          >
            1800 IVR Phone Simulator
          </button>
        </div>
      </div>

      {/* 2. TAB 0: Camera-based QR Code Scanner */}
      {activeTab === 'scan_validate' && (
        <KioskQRScanner 
          onSelectBookingForPrint={(booking) => {
            setSelectedPassForPrint(booking);
            handleTabChange('paper_slip');
          }}
          onNavigateToBooking={() => handleTabChange('assisted_booking')}
        />
      )}

      {/* 3. TAB 1: Assisted Booking Desk */}
      {activeTab === 'assisted_booking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-purple-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Assisted Farmer Registration & Slot Reservation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('scan_validate')}
                className="flex items-center gap-1.5 text-xs text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl font-bold transition-all shadow-xs"
              >
                <ScanLine className="w-3.5 h-3.5 text-purple-700" />
                <span>Camera Pass Scanner</span>
              </button>
            </div>

            <form onSubmit={handleKioskBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Farmer Aadhaar / Kisan ID</label>
                  <input
                    type="text"
                    value={farmerAadhaarInput}
                    onChange={(e) => setFarmerAadhaarInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Farmer Full Name</label>
                  <input
                    type="text"
                    value={farmerNameInput}
                    onChange={(e) => setFarmerNameInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-semibold text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Mobile Number (Any Basic Phone)</label>
                  <input
                    type="text"
                    value={farmerPhoneInput}
                    onChange={(e) => setFarmerPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Vehicle License Plate</label>
                  <input
                    type="text"
                    value={vehicleNumberInput}
                    onChange={(e) => setVehicleNumberInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono uppercase font-bold text-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Commodity to Procure</label>
                  <select
                    value={cropIdInput}
                    onChange={(e) => setCropIdInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-900"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (MSP ₹{c.mspRatePerQtl}/Qtl)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-600 block mb-1 font-medium">Estimated Weight (Quintals)</label>
                  <input
                    type="number"
                    value={estimatedWeightInput}
                    onChange={(e) => setEstimatedWeightInput(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono font-bold text-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] leading-relaxed">
                💡 <strong>Kiosk Operator Note:</strong> Once confirmed, the system will generate a high-contrast printed paper slip with the QR token. The farmer carries this physical slip to the Mandi Gate; no smartphone required.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Reserve Slot & Generate Printable Slip</span>
              </button>
            </form>
          </div>

          {/* Right Column: Generated Slip Preview */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="text-sm font-bold text-neutral-900">
                  Paper QR Slip Preview
                </h3>
                <span className="text-xs font-mono text-neutral-500">
                  READY TO PRINT
                </span>
              </div>

              {bookingSuccessPass ? (
                <div className="mt-4 p-4 border-2 border-neutral-800 rounded-xl text-center space-y-3 bg-neutral-50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 border-b border-neutral-300 pb-2">
                    भारत सरकार · कृषि एवं किसान कल्याण मंत्रालय · DoCA
                  </div>
                  <h4 className="font-extrabold text-base text-neutral-900 uppercase">
                    प्रोक्योरमेंट टोकन पर्ची (Mandi Slip)
                  </h4>
                  <QRCodeDisplay
                    value={`DOCA-SLIP:${bookingSuccessPass.tokenNumber}`}
                    size={160}
                    label={bookingSuccessPass.tokenNumber}
                    sublabel={`गेट नंबर #${bookingSuccessPass.gateNumber}`}
                  />
                  <div className="text-left text-xs space-y-1 pt-2 border-t border-neutral-300">
                    <p><strong>किसान (Farmer):</strong> {bookingSuccessPass.farmerName}</p>
                    <p><strong>फसल (Crop):</strong> {bookingSuccessPass.cropName}</p>
                    <p><strong>वजन (Weight):</strong> {bookingSuccessPass.estimatedWeightQtl} क्विंटल (~{bookingSuccessPass.bagsCount} बोरी)</p>
                    <p><strong>समय (Slot):</strong> {bookingSuccessPass.bookingDate} ({bookingSuccessPass.timeSlot})</p>
                  </div>
                  <div className="p-2 bg-neutral-200 text-neutral-800 text-[10px] font-bold rounded">
                    कृपया इस पर्ची को मंडी गेट नंबर {bookingSuccessPass.gateNumber} पर स्कैनर पर दिखाएं।
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center text-neutral-400 space-y-2">
                  <FileText className="w-10 h-10 mx-auto stroke-1" />
                  <p className="text-xs font-medium">Complete the form to generate the paper slip preview</p>
                </div>
              )}
            </div>

            {bookingSuccessPass && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectDownloadPdf(bookingSuccessPass)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Hard-Copy PDF Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPassForPrint(bookingSuccessPass);
                    setIsPdfModalOpen(true);
                  }}
                  className="py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Print Preview (A4/Thermal)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TAB 2: Printable Paper QR Slip */}
      {activeTab === 'paper_slip' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                  DoCA Physical Hard Copy
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  TOKEN #{selectedPassForPrint.tokenNumber}
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                Official Paper QR Pass & Token Slip Dispatcher
              </h3>
              <p className="text-xs text-neutral-500">
                Large-font high-contrast slip designed for thermal receipt roll or standard A4 hard copies for offline farmers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Select Farmer Pass */}
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
                <span className="text-neutral-500 pl-1.5 font-medium">Pass:</span>
                <select
                  value={selectedPassForPrint.tokenNumber}
                  onChange={(e) => {
                    const found = bookings.find(b => b.tokenNumber === e.target.value);
                    if (found) setSelectedPassForPrint(found);
                  }}
                  className="px-2 py-1 rounded-lg border border-neutral-300 font-bold text-neutral-900 bg-white text-xs cursor-pointer"
                >
                  {bookings.map(b => (
                    <option key={b.tokenNumber} value={b.tokenNumber}>
                      {b.tokenNumber} · {b.farmerName} ({b.cropName.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Open PDF Preview with A4 and Thermal layout options"
              >
                <Eye className="w-3.5 h-3.5 text-neutral-600" />
                <span>Format Preview</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDownloadPdf(selectedPassForPrint)}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                title="Download print-friendly official PDF file to device"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Pass'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs"
                title="Trigger local printer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Hard Copy</span>
              </button>
            </div>
          </div>

          {/* Download Success Notice */}
          {downloadSuccessToast && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Download Successful:</strong> {downloadSuccessToast}. Print or hand directly to the arriving farmer.
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                PDF ARCHIVE READY
              </span>
            </div>
          )}

          {/* Physical Document Representation */}
          <div className="max-w-md mx-auto p-6 border-2 border-neutral-950 rounded-2xl bg-white shadow-md space-y-4 print-container text-neutral-900">
            <div className="text-center border-b-2 border-neutral-900 pb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-700">
                Department of Consumer Affairs · FCI Mandi Division
              </span>
              <h2 className="text-lg font-extrabold uppercase mt-1">
                Kisan Queue Token Pass
              </h2>
              <p className="text-xs font-bold text-emerald-950">
                {selectedPassForPrint.centerName}
              </p>
            </div>

            <div className="flex justify-center py-2">
              <QRCodeDisplay
                value={`DOCA-SLIP:${selectedPassForPrint.tokenNumber}:${selectedPassForPrint.gateNumber}`}
                size={180}
                label={selectedPassForPrint.tokenNumber}
                sublabel={`MANDI ENTRY PASS`}
              />
            </div>

            <div className="p-3 bg-neutral-100 rounded-xl space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">TOKEN NUMBER:</span>
                <span className="font-bold text-sm text-neutral-950">{selectedPassForPrint.tokenNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">ENTRY GATE:</span>
                <span className="font-bold text-sm text-emerald-950">GATE #{selectedPassForPrint.gateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">FARMER:</span>
                <span className="font-bold font-sans text-neutral-900">{selectedPassForPrint.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">COMMODITY:</span>
                <span className="font-bold font-sans text-neutral-900">{selectedPassForPrint.cropName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">TIME WINDOW:</span>
                <span className="font-bold text-neutral-900">{selectedPassForPrint.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 font-sans">VEHICLE PLATE:</span>
                <span className="font-bold text-neutral-900">{selectedPassForPrint.vehicleNumber}</span>
              </div>
            </div>

            <div className="p-3 border border-neutral-900 rounded-lg text-center text-xs font-bold bg-neutral-50 leading-relaxed">
              ⚠️ किसान निर्देश (Hindi): कृपया समय से 15 मिनट पूर्व गेट नंबर {selectedPassForPrint.gateNumber} पर पहुंचे और बूम बैरियर पर यह कोड दिखाएं।
            </div>

            <div className="text-[10px] text-center text-neutral-500 pt-2 border-t border-neutral-200">
              Gram Panchayat Kiosk Operator Verified · Zero Fee Government Service
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB 3: Interactive IVR Phone Simulator */}
      {activeTab === 'ivr_simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Phone Mockup Frame */}
          <div className="lg:col-span-5 bg-neutral-900 rounded-3xl p-6 shadow-2xl border-4 border-neutral-700 max-w-sm mx-auto w-full text-white flex flex-col justify-between space-y-6">
            
            {/* Phone Screen Display */}
            <div className="p-4 bg-emerald-950/90 rounded-2xl border border-emerald-500/40 min-h-[170px] flex flex-col justify-between text-xs font-mono shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span>BSNL / JIO 4G</span>
                <span>{callActive ? 'CALL: 00:42' : 'STANDBY'}</span>
              </div>

              <div className="py-2">
                {callActive ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-1">
                      IVR PROMPT (1800-180-DOCA)
                    </span>
                    <p className="text-white text-xs leading-relaxed font-sans">
                      "{ivrMessage}"
                    </p>
                    {dialedDigits && (
                      <span className="mt-2 block text-emerald-400 text-sm font-bold">
                        Keys Pressed: {dialedDigits}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 py-4 font-sans">
                    <PhoneCall className="w-8 h-8 mx-auto text-emerald-500 mb-2 stroke-1" />
                    <p className="font-bold text-white text-sm">Toll-Free Kisan IVR</p>
                    <p className="text-[11px] text-neutral-300">Dial 1800-180-DOCA</p>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-emerald-400/80 text-right">
                {callActive ? 'Press keypad numbers' : 'Tap Call Button below'}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { key: '1', sub: 'HIN / BOOK' },
                { key: '2', sub: 'ENG / STATUS' },
                { key: '3', sub: 'DBT' },
                { key: '4', sub: 'GHI' },
                { key: '5', sub: 'JKL' },
                { key: '6', sub: 'MNO' },
                { key: '7', sub: 'PQRS' },
                { key: '8', sub: 'TUV' },
                { key: '9', sub: 'WXYZ' },
                { key: '*', sub: 'CANCEL' },
                { key: '0', sub: 'OPERATOR' },
                { key: '#', sub: 'CONFIRM' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => handleKeyPress(btn.key)}
                  disabled={!callActive}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 rounded-xl border border-neutral-700 text-white transition-colors active:scale-95"
                >
                  <span className="font-mono font-bold text-lg block leading-none">{btn.key}</span>
                  <span className="text-[8px] text-neutral-400 font-mono tracking-tight block mt-1">{btn.sub}</span>
                </button>
              ))}
            </div>

            {/* Call / End Controls */}
            <div className="flex gap-3 pt-2">
              {!callActive ? (
                <button
                  onClick={startIvrCall}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Toll-Free 1800-180-DOCA</span>
                </button>
              ) : (
                <button
                  onClick={endIvrCall}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50"
                >
                  <span>End Call</span>
                </button>
              )}
            </div>

          </div>

          {/* Explanation & Workflow Steps for Presentation */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
              <Smartphone className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm font-bold text-neutral-900">
                How Feature-Phone IVR Automation Works
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block">
                  1. Zero Internet, Zero Smartphone Requirement
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  Farmers with a basic ₹800 feature phone (Nokia 105, JioBharat, etc.) dial the toll-free number <strong>1800-180-DOCA</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block">
                  2. Interactive Keypad Telephony
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  The automated voice synthesizer prompts the farmer to press <strong>1 for Wheat</strong>, select their nearest district Mandi, and choose morning or afternoon slot.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block">
                  3. Instant DLT SMS Token Confirmation
                </span>
                <p className="text-neutral-600 leading-relaxed">
                  The moment key <strong>#</strong> is pressed, the automated system books the gate slot and dispatches an immediate text message with the token number and gate assignment to their basic phone.
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                <strong>Demo Action:</strong> Click the green <strong>"Call Toll-Free"</strong> button on the left, then press keypad <strong>1 ➔ 1 ➔ 1</strong> to complete a voice booking right in your video demo!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Official Hard-Copy PDF Generation & Print Preview Modal */}
      {selectedPassForPrint && (
        <GatePassPdfModal
          booking={selectedPassForPrint}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

    </div>
  );
};
