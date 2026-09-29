import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  ScanLine, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Printer, 
  ShieldCheck, 
  Volume2, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Truck, 
  Calendar, 
  Clock, 
  Scale, 
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { SlotBooking } from '../../types/procurement';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { audioChime } from '../../utils/audioChime';
import { speechVoice } from '../../utils/speechVoice';

interface KioskQRScannerProps {
  onSelectBookingForPrint?: (booking: SlotBooking) => void;
  onNavigateToBooking?: () => void;
}

export const KioskQRScanner: React.FC<KioskQRScannerProps> = ({ 
  onSelectBookingForPrint,
  onNavigateToBooking 
}) => {
  const { bookings, checkInFarmer, centers } = useProcurement();

  // Video & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scanner States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedRaw, setLastScannedRaw] = useState<string | null>(null);
  const [validatedBooking, setValidatedBooking] = useState<SlotBooking | null>(bookings[0] || null);
  const [manualInput, setManualInput] = useState<string>('');
  const [assignedGate, setAssignedGate] = useState<number>(2);
  const [scanStatusMsg, setScanStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>({
    type: 'info',
    text: 'Camera sensor standby. Click "Start Live Camera" or select a demo token below.'
  });

  // Helper: Find booking from scanned string
  const resolveBookingFromScan = useCallback((scannedText: string): SlotBooking | null => {
    const cleanText = scannedText.trim();
    
    // Check if JSON
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.tokenNumber) {
        const found = bookings.find(b => b.tokenNumber.toUpperCase() === parsed.tokenNumber.toUpperCase());
        if (found) return found;
      }
    } catch {
      // Not JSON, continue to string match
    }

    // Direct token match
    let match = bookings.find(b => b.tokenNumber.toUpperCase() === cleanText.toUpperCase());
    if (match) return match;

    // Substring token match (e.g. DOCA-WHT-8492)
    match = bookings.find(b => cleanText.toUpperCase().includes(b.tokenNumber.toUpperCase()));
    if (match) return match;

    // Match by vehicle or aadhaar or phone
    match = bookings.find(b => 
      cleanText.toUpperCase().includes(b.vehicleNumber.toUpperCase()) ||
      cleanText.includes(b.aadhaarLast4) ||
      b.farmerPhone.includes(cleanText)
    );

    return match || null;
  }, [bookings]);

  // Handle validated token
  const processFoundCode = useCallback((codeText: string) => {
    setLastScannedRaw(codeText);
    const foundBooking = resolveBookingFromScan(codeText);

    if (foundBooking) {
      setValidatedBooking(foundBooking);
      setAssignedGate(foundBooking.gateNumber || 2);
      audioChime.playGateCallChime();
      speechVoice.speak(
        `Digital gate pass verified for ${foundBooking.farmerName}. Token ${foundBooking.tokenNumber.replace(/-/g, ' ')}. Valid for Gate ${foundBooking.gateNumber || 2}.`,
        'en-IN'
      );
      setScanStatusMsg({
        type: 'success',
        text: `✓ Verified Token ${foundBooking.tokenNumber} for ${foundBooking.farmerName} (${foundBooking.cropName})`
      });
    } else {
      audioChime.playAlertChime();
      speechVoice.speak(`Token code unrecognized. Please check token roster.`, 'en-IN');
      setScanStatusMsg({
        type: 'error',
        text: `QR code detected ("${codeText.slice(0, 30)}"), but not found in active procurement database.`
      });
    }
  }, [resolveBookingFromScan]);

  // Frame processing loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        setIsScanning(false);
        processFoundCode(code.data);
        // Cool down for 3 seconds before next continuous scan
        setTimeout(() => {
          setIsScanning(true);
        }, 3000);
        return;
      }
    }

    if (cameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    }
  }, [cameraActive, processFoundCode]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraActive(true);
      setIsScanning(true);
      setScanStatusMsg({
        type: 'info',
        text: 'Live camera optical sensor engaged. Align farmer QR code within the target reticle.'
      });
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraActive(false);
      setIsScanning(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. You can still test with the 1-click demo passes below or upload a QR image.'
          : `Camera access unavailable: ${err.message || 'Device camera busy or permission denied'}`
      );
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  // Flip Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

  // Handle continuous scan loop
  useEffect(() => {
    if (cameraActive && isScanning) {
      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [cameraActive, isScanning, scanFrame]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Image File Upload Scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          processFoundCode(code.data);
        } else {
          setScanStatusMsg({
            type: 'error',
            text: 'No valid QR barcode found in the uploaded image. Please try another file.'
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manual Check-In
  const handleCheckInNow = () => {
    if (!validatedBooking) return;
    checkInFarmer(validatedBooking.tokenNumber, assignedGate);
    audioChime.playGateCallChime();
    speechVoice.speak(
      `Gate pass checked in. Vehicle admitted to Gate ${assignedGate} holding bay.`,
      'en-IN'
    );
    setScanStatusMsg({
      type: 'success',
      text: `✓ Farmer ${validatedBooking.farmerName} admitted at Gate #${assignedGate}. Holding bay pass issued.`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-purple-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1">
            <ScanLine className="w-4 h-4 text-purple-400" />
            <span>Kiosk Camera Gate Pass Validator</span>
            <span>·</span>
            <span>Instant Optical Token Verification</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Live QR Scanner & Gate Pass Inspection
          </h1>
          <p className="text-xs text-purple-200 mt-0.5">
            Real-time video barcode recognition for instant authentication of farmer tokens, digital passes, and paper slips
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Start Live Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* 2. Status Notice Strip */}
      {scanStatusMsg && (
        <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
          scanStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' :
          scanStatusMsg.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-950' :
          'bg-purple-50 border-purple-200 text-purple-950'
        }`}>
          <div className="flex items-center gap-2.5">
            {scanStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> :
             scanStatusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> :
             <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />}
            <span>{scanStatusMsg.text}</span>
          </div>

          {validatedBooking && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded border border-neutral-200">
              {validatedBooking.tokenNumber}
            </span>
          )}
        </div>
      )}

      {/* 3. Main Split View: Camera Viewfinder (Left) & Validated Pass Certificate (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Camera Viewfinder & Controls (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-800" />
              <h3 className="text-sm font-bold text-neutral-900">
                Optical Viewfinder Bay
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {cameraActive && (
                <button
                  onClick={toggleFacingMode}
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
                </button>
              )}
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                cameraActive ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {cameraActive ? 'LIVE STREAM' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Viewfinder Canvas / Video Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-950 text-white min-h-[290px] flex flex-col justify-between border-2 border-neutral-800 shadow-inner">
            
            {/* Top Telemetry Overlay */}
            <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-[11px] font-mono text-purple-300 z-10">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
                <span>{cameraActive ? 'OPTICAL LASER SCANNER: 60 FPS' : 'CAMERA OFFLINE'}</span>
              </span>
              <span>1080p · AUTO-EXPOSURE</span>
            </div>

            {/* Video Element */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              muted
              playsInline
            />

            {/* Hidden canvas for jsQR analysis */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Inactive Standby Screen */}
            {!cameraActive && (
              <div className="my-auto py-8 text-center px-4 z-10 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-lg">
                  <ScanLine className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Camera Sensor Idle</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                    Activate device camera to scan physical paper slips, or test immediately using the 1-click token simulator below.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Turn On Web Camera</span>
                </button>
              </div>
            )}

            {/* Active Target Reticle Overlay */}
            {cameraActive && (
              <div className="relative z-10 flex-1 flex items-center justify-center p-4">
                <div className="relative w-56 h-56 border-2 border-dashed border-purple-400/90 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400" />
                  
                  {/* Laser Sweeper Animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400 shadow-[0_0_10px_#a855f7] animate-bounce" />
                </div>
              </div>
            )}

            {/* Bottom Overlay Instructions */}
            <div className="p-3 bg-gradient-to-t from-black/80 to-transparent text-center text-[11px] text-neutral-300 z-10">
              {cameraActive 
                ? 'Align QR square inside the reticle. Barcode auto-decodes instantly.' 
                : 'Supports DLT-compliant APMC e-Pauti and farmer gate tokens'}
            </div>
          </div>

          {/* Quick 1-Click Demo Pass Scanner Buttons */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Simulate Real QR Scans (1-Click Test Passes):</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">3 Active in Mandi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {bookings.slice(0, 3).map((b) => (
                <button
                  key={b.tokenNumber}
                  type="button"
                  onClick={() => processFoundCode(b.tokenNumber)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    validatedBooking?.tokenNumber === b.tokenNumber
                      ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-400/30'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  <span className="font-mono font-bold text-xs text-neutral-900 block truncate">
                    {b.tokenNumber}
                  </span>
                  <span className="text-[11px] text-neutral-600 block truncate">
                    {b.farmerName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 mt-1 block">
                    {b.cropName.split('(')[0]} · {b.estimatedWeightQtl} Qtl
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Token Code Lookup Input */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Manual Token / Vehicle Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder="e.g. DOCA-WHT-8492 or HR 05 C 8841"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualInput) {
                    processFoundCode(manualInput);
                    setManualInput('');
                  }
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Validate
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Authenticated Gate Pass Certificate (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-neutral-900">
                Official Gate Pass & Token Verification
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              GOVT VERIFIED
            </span>
          </div>

          {validatedBooking ? (
            <div className="space-y-4">
              
              {/* Pass Card with QR Visual & Watermark */}
              <div className="p-4 bg-gradient-to-br from-neutral-50 to-purple-50/40 rounded-2xl border-2 border-purple-200 space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Digital QR Code Display */}
                  <div className="shrink-0 bg-white p-2 rounded-xl shadow-xs border border-neutral-200">
                    <QRCodeDisplay 
                      value={validatedBooking.tokenNumber} 
                      size={110} 
                      label={validatedBooking.tokenNumber}
                    />
                  </div>

                  {/* Primary Credentials */}
                  <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-900 text-white font-mono text-[10px] font-bold">
                        {validatedBooking.tokenNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">
                        {validatedBooking.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-neutral-900 truncate">
                      {validatedBooking.farmerName}
                    </h4>
                    
                    <p className="text-xs text-neutral-600">
                      Aadhaar: <strong className="font-mono text-neutral-900">XXXX-XXXX-{validatedBooking.aadhaarLast4}</strong>
                    </p>
                    <p className="text-xs text-neutral-600">
                      Mobile: <strong className="font-mono text-neutral-900">{validatedBooking.farmerPhone}</strong>
                    </p>
                    <p className="text-xs text-neutral-600">
                      Vehicle: <strong className="font-mono text-neutral-900">{validatedBooking.vehicleNumber}</strong>
                    </p>
                  </div>
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-purple-200/80 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">Commodity</span>
                    <span className="font-bold text-neutral-900">{validatedBooking.cropName.split('(')[0]}</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">Load (Estimated)</span>
                    <span className="font-mono font-bold text-neutral-900">{validatedBooking.estimatedWeightQtl} Quintals</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">MSP Benchmark</span>
                    <span className="font-mono font-bold text-emerald-800">₹{validatedBooking.mspRate}/Qtl</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">Allotted Gate</span>
                    <span className="font-mono font-extrabold text-purple-900">Gate #{assignedGate}</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">Time Slot</span>
                    <span className="font-semibold text-neutral-800 truncate">{validatedBooking.timeSlot}</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-purple-100">
                    <span className="text-[10px] text-neutral-500 block">Expected Payout</span>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{validatedBooking.totalPayout?.toLocaleString('en-IN') || (validatedBooking.estimatedWeightQtl * validatedBooking.mspRate).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gate Assignment & Check-In Action Box */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900">Assign Boom Barrier Lane:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(gateNum => (
                      <button
                        key={gateNum}
                        type="button"
                        onClick={() => setAssignedGate(gateNum)}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all ${
                          assignedGate === gateNum
                            ? 'bg-purple-900 text-white shadow-xs'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        G{gateNum}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckInNow}
                    className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check-In & Raise Boom Barrier</span>
                  </button>

                  {onSelectBookingForPrint && (
                    <button
                      type="button"
                      onClick={() => onSelectBookingForPrint(validatedBooking)}
                      className="py-2.5 px-4 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4 text-neutral-600" />
                      <span>Print Slip</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <ScanLine className="w-12 h-12 mx-auto stroke-1 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">No Pass Scanned Yet</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Scan a barcode using the camera or select one of the 1-click test passes on the left.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
