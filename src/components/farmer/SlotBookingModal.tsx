import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Truck, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, Mic, Volume2, Sparkles } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking } from '../../types/procurement';
import { VoiceBookingAssistant } from './VoiceBookingAssistant';

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (booking: SlotBooking) => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { crops, centers, bookSlot, selectedCenter } = useProcurement();

  const [step, setStep] = useState<number>(1);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [selectedCropId, setSelectedCropId] = useState<string>(crops[0]?.id || 'crop-1');
  const [estimatedWeightQtl, setEstimatedWeightQtl] = useState<number>(100);
  const [selectedCenterId, setSelectedCenterId] = useState<string>(selectedCenter.id || centers[0]?.id || 'center-krn');
  const [bookingDate, setBookingDate] = useState<string>('2026-09-30');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:30 AM - 10:30 AM');
  const [vehicleType, setVehicleType] = useState<SlotBooking['vehicleType']>('Tractor Trolley');
  const [vehicleNumber, setVehicleNumber] = useState<string>('HR 05 AB 4812');
  const [farmerName, setFarmerName] = useState<string>('Rameshwar Singh Yadav');
  const [farmerPhone, setFarmerPhone] = useState<string>('+91 98765 43210');
  const [aadhaarLast4, setAadhaarLast4] = useState<string>('7184');

  if (!isOpen) return null;

  const currentCrop = crops.find(c => c.id === selectedCropId) || crops[0];
  const chosenCenter = centers.find(c => c.id === selectedCenterId) || centers[0];
  const bagsCount = Math.round(estimatedWeightQtl * 2); // 50kg standard jute bags
  const estimatedMspValue = estimatedWeightQtl * (currentCrop?.mspRatePerQtl || 2275);

  const availableSlots = [
    { time: '07:30 AM - 08:30 AM', status: 'available', load: 'Low Congestion' },
    { time: '08:30 AM - 09:30 AM', status: 'available', load: 'Recommended' },
    { time: '09:30 AM - 10:30 AM', status: 'available', load: 'Moderate Queue' },
    { time: '10:30 AM - 11:30 AM', status: 'busy', load: 'Heavy Peak' },
    { time: '11:30 AM - 12:30 PM', status: 'busy', load: 'Heavy Peak' },
    { time: '02:00 PM - 03:00 PM', status: 'available', load: 'Smooth Traffic' },
    { time: '03:30 PM - 04:30 PM', status: 'available', load: 'Fast Track' },
  ];

  const handleCompleteBooking = () => {
    const booking = bookSlot({
      farmerName,
      farmerPhone,
      aadhaarLast4,
      cropId: currentCrop.id,
      cropName: currentCrop.name,
      estimatedWeightQtl,
      bagsCount,
      centerId: chosenCenter.id,
      centerName: chosenCenter.name,
      bookingDate,
      timeSlot: selectedTimeSlot,
      vehicleNumber,
      vehicleType,
      mspRate: currentCrop.mspRatePerQtl,
      bankAccountLast4: '4192',
      ifscCode: 'SBIN0001248'
    });

    if (onSuccess) {
      onSuccess(booking);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Wizard Header */}
        <div className="p-6 bg-emerald-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
              <span>Smart Booking Wizard</span>
              <span className="text-emerald-400">·</span>
              <span>Step {step} of 3</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Reserve Mandi Procurement Slot
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Automated gate pass with zero wait-time optimization
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVoiceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-neutral-950 animate-pulse" />
              <span>बोलकर भरें (Voice Mode)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 border-b border-neutral-200 text-center text-xs font-medium">
          <div className={`py-2.5 border-b-2 transition-colors ${step >= 1 ? 'border-emerald-700 text-emerald-900 font-bold bg-emerald-50/50' : 'border-transparent text-neutral-400'}`}>
            1. Crop & Quantity
          </div>
          <div className={`py-2.5 border-b-2 transition-colors ${step >= 2 ? 'border-emerald-700 text-emerald-900 font-bold bg-emerald-50/50' : 'border-transparent text-neutral-400'}`}>
            2. Mandi Center & Slot
          </div>
          <div className={`py-2.5 border-b-2 transition-colors ${step >= 3 ? 'border-emerald-700 text-emerald-900 font-bold bg-emerald-50/50' : 'border-transparent text-neutral-400'}`}>
            3. Vehicle & Confirm
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 space-y-6">
          
          {/* STEP 1: Crop & Quantity */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Select Commodity to Procure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {crops.map((crop) => {
                    const isSelected = selectedCropId === crop.id;
                    return (
                      <div
                        key={crop.id}
                        onClick={() => setSelectedCropId(crop.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{crop.icon}</span>
                          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                            ₹{crop.mspRatePerQtl.toLocaleString('en-IN')}/Qtl
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 mt-2">
                          {crop.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-1">
                          <span>{crop.hindiName} · {crop.season}</span>
                          <span>Moisture &le; {crop.maxMoistureAllowed}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Estimator */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">
                    Estimated Harvest Weight (Quintals)
                  </label>
                  <span className="font-mono font-bold text-sm text-emerald-900">
                    {estimatedWeightQtl} Quintals (~{bagsCount} Bags)
                  </span>
                </div>

                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={estimatedWeightQtl}
                  onChange={(e) => setEstimatedWeightQtl(Number(e.target.value))}
                  className="w-full accent-emerald-800 cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-200">
                  <span className="text-neutral-500">Guaranteed Government MSP Payout:</span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    ₹{estimatedMspValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Mandi Center & Slot */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Select Nearest Mandi Center
                </label>
                <div className="space-y-2">
                  {centers.map((c) => {
                    const isSelected = selectedCenterId === c.id;
                    const congestionColor = 
                      c.congestionStatus === 'low' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      c.congestionStatus === 'moderate' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      'text-rose-700 bg-rose-50 border-rose-200';
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCenterId(c.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <h4 className="text-xs font-bold text-neutral-900">{c.name}</h4>
                          </div>
                          <p className="text-[11px] text-neutral-500 ml-5 mt-0.5">
                            {c.location} · {c.totalGates} Automated Gates
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${congestionColor}`}>
                            {c.congestionStatus} Queue
                          </span>
                          <p className="text-[10px] text-neutral-500 font-mono mt-1">
                            {c.currentIntakeMT} / {c.capacityMT} MT
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Available Fast-Track Arrival Window
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.time} ({slot.load})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  <strong>AI Congestion Tip:</strong> Choosing the <strong>08:30 AM</strong> window saves an estimated <strong>42 minutes</strong> in weighbridge wait time compared to the noon peak rush.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Farmer Identity & Vehicle Information
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-500 block mb-1">Farmer Name</label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-semibold text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block mb-1">Kisan Mobile (for SMS pass)</label>
                    <input
                      type="text"
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block mb-1">Transport Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as SlotBooking['vehicleType'])}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-medium text-neutral-900"
                    >
                      <option value="Tractor Trolley">Tractor Trolley</option>
                      <option value="Mini Truck">Mini Truck (Pick-up)</option>
                      <option value="Commercial Truck">Commercial Truck (6-Wheeler)</option>
                      <option value="Bullock Cart">Bullock Cart (Traditional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-neutral-500 block mb-1">Vehicle License Plate</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg font-mono font-bold text-neutral-900 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-emerald-950 text-white rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-mono text-[11px]">
                  <span>RESERVATION SUMMARY</span>
                  <span>MSP GUARANTEED</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>{currentCrop.name} · {estimatedWeightQtl} Quintals</span>
                  <span className="font-mono text-emerald-400">₹{estimatedMspValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-neutral-300 text-xs">
                  {chosenCenter.name} · {bookingDate} ({selectedTimeSlot})
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-900 text-white hover:bg-emerald-800 transition-colors shadow-sm ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteBooking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-colors shadow-sm ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Generate Digital Pass</span>
            </button>
          )}
        </div>

      </div>

      {/* Regional Voice Assistant Sub-Modal */}
      {isVoiceOpen && (
        <VoiceBookingAssistant
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onSuccess={(booking) => {
            setIsVoiceOpen(false);
            if (onSuccess) {
              onSuccess(booking);
            }
            onClose();
          }}
        />
      )}
    </div>
  );
};
