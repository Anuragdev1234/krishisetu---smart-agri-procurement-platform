import React, { useState } from 'react';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Video, 
  ArrowRight,
  Maximize2,
  Volume2
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { UserRole } from '../../types/procurement';

interface PresentationAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (role: UserRole, tab: string) => void;
}

export const PresentationAssistant: React.FC<PresentationAssistantProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const { setActiveRole, callNextToken, bookings, checkInFarmer } = useProcurement();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const presentationSteps: {
    title: string;
    role: UserRole;
    tab: string;
    description: string;
    talkingPoint: string;
    actionLabel: string;
    onExecuteAction?: () => void;
  }[] = [
    {
      title: '1. Farmer Regional Voice Booking & QR Pass',
      role: 'farmer',
      tab: 'voice_booking',
      description: 'Non-literate or elderly farmers speak in Hindi, Punjabi, Marathi, Telugu, or English to book slots with auto-extracted crop, weight, and gate window.',
      talkingPoint: '"Farmers do not need to type: they simply speak in their mother tongue—saying \'100 quintal gehu Karnal Mandi subah\'—and our voice assistant auto-fills and speaks back confirmation."',
      actionLabel: 'Open Farmer Voice Assistant',
    },
    {
      title: '2. Gate Live View & Dynamic Slot Redistribution',
      role: 'officer',
      tab: 'slot_redistribution',
      description: 'Physical Mandi Officer monitors live gate queues, detects safety threshold overloads, and triggers dynamic slot redistribution to re-route incoming farmers with SMS alerts.',
      talkingPoint: '"When Gate 2 exceeds safe road approach limits with 18 tractor trolleys, the system automatically detects the safety hazard and suggests dynamically re-routing 4 vehicles to Gate 3, slashing wait times by 64%."',
      actionLabel: 'Open Dynamic Slot Redistribution Desk',
      onExecuteAction: () => {
        callNextToken('DOCA-WHT-8492', 2);
      }
    },
    {
      title: '3. Digital Grading & E-Pauti (GRN)',
      role: 'officer',
      tab: 'inspection_form',
      description: 'Moisture tested with digital meter. Weighbridge gross & tare weights computed automatically into net quintals and PFMS payout.',
      talkingPoint: '"Zero manual paperwork: Moisture %, foreign matter %, and weighbridge gross/tare auto-calculate the exact MSP transfer and produce an official E-Pauti slip."',
      actionLabel: 'Open Grading & Weighbridge Form',
    },
    {
      title: '4. AI Supply Matcher & Storage Duration Minimizer',
      role: 'officer',
      tab: 'ai_supply_matcher',
      description: 'Automatically cross-references real-time arrival logs with local flour mills and rice sheller deficits, slashing storage holding duration from 72h down to 3.2h.',
      talkingPoint: '"Instead of letting grain sit in central silos for days, our AI Supply Matcher pairs incoming truckloads directly with local processors who have critical deficits, reclaiming 214 silo hours and saving ₹4.4 Lakhs in aeration holding costs."',
      actionLabel: 'Open AI Supply Matcher Desk',
    },
    {
      title: '5. Transporter Logistics & Gate-Congestion Route Optimization',
      role: 'transporter',
      tab: 'route_optimizer',
      description: 'Calculates the shortest and fastest path to the Mandi based on live gate congestion data (e.g. avoiding Gate 1 backlog by taking the Gate 4 Western Bypass, saving 21 minutes and fuel).',
      talkingPoint: '"Our dynamic routing engine does not just look at highway distance—it monitors real-time weighbridge queue bottlenecks at each Mandi gate, auto-routing heavy grain trailers to the fastest intake channel."',
      actionLabel: 'Open Route Optimizer & Gate Telemetry',
    },
    {
      title: '6. Secondary Market Bidding',
      role: 'local_buyer',
      tab: 'market_board',
      description: 'Commercial millers bid on non-buffer lots (e.g. moisture 14.8%) with verified Mandi quality seals.',
      talkingPoint: '"Instead of rejecting farmers whose grain is slightly off-spec, the secondary market lets licensed merchants place instant bids, ensuring zero farmer distress."',
      actionLabel: 'Open Local Merchant Bidding',
    },
    {
      title: '7. Non-Smartphone Inclusivity & PDF Hard Copies (Kiosk & IVR)',
      role: 'kiosk',
      tab: 'paper_slip',
      description: 'Gram Panchayat CSC kiosk generates downloadable, print-friendly official PDF gate passes (A4 and 80mm thermal), camera QR validation, and 1800-180-DOCA toll-free phone voice bookings.',
      talkingPoint: '"For offline farmers and feature-phone users, CSC kiosk operators generate print-friendly official PDF gate passes with scannable vector QR codes, or take keypad reservations via 1800 toll-free IVR."',
      actionLabel: 'Open Kiosk PDF Gate Pass Dispatcher',
    },
  ];

  const currentStep = presentationSteps[currentStepIndex];

  const handleApplyStep = () => {
    setActiveRole(currentStep.role);
    onSelectTab(currentStep.role, currentStep.tab);
    if (currentStep.onExecuteAction) {
      currentStep.onExecuteAction();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-40 max-w-xl w-full bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-neutral-700 p-4 animate-in slide-in-from-bottom duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Video Demo Presentation Assistant
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {currentStepIndex + 1} of {presentationSteps.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Info */}
      <div className="py-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{currentStep.title}</span>
          </h4>
          <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-700">
            {currentStep.role.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-neutral-300">
          {currentStep.description}
        </p>

        {/* Talking point suggestion for demo recording */}
        <div className="p-2.5 bg-neutral-800/80 rounded-xl border border-neutral-700 text-xs text-amber-200/90 italic leading-relaxed">
          <span className="font-bold text-amber-400 not-italic mr-1.5">🎙️ Suggested Script:</span>
          {currentStep.talkingPoint}
        </div>
      </div>

      {/* Navigation and Action Button */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentStepIndex(i => Math.min(presentationSteps.length - 1, i + 1))}
            disabled={currentStepIndex === presentationSteps.length - 1}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleApplyStep}
          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>{currentStep.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
