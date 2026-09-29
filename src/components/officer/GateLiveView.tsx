import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Sliders, 
  Volume2, 
  Maximize2, 
  Radio, 
  Sparkles, 
  Filter, 
  Layers, 
  Clock, 
  ArrowRight, 
  Download,
  Zap,
  Flame,
  Moon,
  ScanLine,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { audioChime } from '../../utils/audioChime';
import { speechVoice } from '../../utils/speechVoice';

export type VideoFilterMode = 'standard' | 'anpr_ocr' | 'night_ir' | 'thermal';

interface GateConfig {
  id: number;
  name: string;
  laneType: string;
  congestionLevel: 'High Congestion' | 'Peak Congestion' | 'Moderate' | 'Smooth';
  congestionColor: string;
  hourlyRate: number;
  queueCount: number;
  avgWaitMins: number;
  barrierStatus: 'LOWERED' | 'RAISED';
  detectedPlate: string;
  vehicleType: string;
  speedKmH: number;
}

const GATES_DATA: GateConfig[] = [
  {
    id: 2,
    name: 'Gate 2: Tractor Trolley Direct Lane',
    laneType: 'Heavy Agricultural Conveyance',
    congestionLevel: 'Peak Congestion',
    congestionColor: 'text-rose-400 bg-rose-950/80 border-rose-800',
    hourlyRate: 284,
    queueCount: 18,
    avgWaitMins: 14.2,
    barrierStatus: 'LOWERED',
    detectedPlate: 'HR 05 AB 4812',
    vehicleType: 'Tractor Trolley (Wheat 100 Qtl)',
    speedKmH: 8.5
  },
  {
    id: 1,
    name: 'Gate 1: Multi-Axle Heavy Commercial Trucks',
    laneType: 'Interstate Bulk Transporter',
    congestionLevel: 'High Congestion',
    congestionColor: 'text-amber-400 bg-amber-950/80 border-amber-800',
    hourlyRate: 142,
    queueCount: 12,
    avgWaitMins: 11.5,
    barrierStatus: 'RAISED',
    detectedPlate: 'UP 32 BN 4410',
    vehicleType: 'Tata Signa 2823 (25.0 MT)',
    speedKmH: 12.0
  },
  {
    id: 3,
    name: 'Gate 3: Pickups & Light Commercial Vehicles',
    laneType: 'Fast-Track Small Lot Delivery',
    congestionLevel: 'Moderate',
    congestionColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    hourlyRate: 118,
    queueCount: 5,
    avgWaitMins: 6.8,
    barrierStatus: 'LOWERED',
    detectedPlate: 'HR 02 Z 9184',
    vehicleType: 'Mahindra Bolero Maxi Truck',
    speedKmH: 15.2
  },
  {
    id: 4,
    name: 'Gate 4: Weighbridge Exit & Silo Evacuation Dock',
    laneType: 'Outbound FCI Dispatch Channel',
    congestionLevel: 'Smooth',
    congestionColor: 'text-blue-400 bg-blue-950/80 border-blue-800',
    hourlyRate: 64,
    queueCount: 2,
    avgWaitMins: 3.2,
    barrierStatus: 'RAISED',
    detectedPlate: 'PB 10 CG 5501',
    vehicleType: 'Ashok Leyland 3518 Tanker',
    speedKmH: 18.0
  }
];

interface GateLiveViewProps {
  onCheckInToken?: (token: string, gate: number) => void;
  standalone?: boolean;
}

export const GateLiveView: React.FC<GateLiveViewProps> = ({
  onCheckInToken,
  standalone = false
}) => {
  const { selectedCenter, checkInFarmer } = useProcurement();

  const [selectedGateId, setSelectedGateId] = useState<number>(2); // Default to Gate 2 (Peak Congestion)
  const [filterMode, setFilterMode] = useState<VideoFilterMode>('standard');
  const [isLowLatencyMode, setIsLowLatencyMode] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(false);
  const [isBarrierOverridden, setIsBarrierOverridden] = useState<boolean>(false);
  const [snapshotTaken, setSnapshotTaken] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [hudStats, setHudStats] = useState({ fps: 59.8, latencyMs: 14, timestamp: '' });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const selectedGate = GATES_DATA.find(g => g.id === selectedGateId) || GATES_DATA[0];

  // Request browser camera stream
  const startCamera = async () => {
    setPermissionState('requesting');
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unsupported');
      setErrorMessage('Browser mediaDevices API not available in this environment. Falling back to high-fidelity CCTV simulation.');
      setIsSimulatedFeed(true);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: isLowLatencyMode ? 60 : 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play error:", e));
        };
      }

      setPermissionState('granted');
      setIsStreaming(true);
      setIsSimulatedFeed(false);
      audioChime.playSuccessChime();
    } catch (err: any) {
      console.warn("Camera access denied or unavailable:", err);
      setPermissionState('denied');
      setErrorMessage(err.message || 'Camera permission denied or camera device in use. Switching to simulated low-latency live CCTV stream.');
      setIsSimulatedFeed(true);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setPermissionState('idle');
  };

  // Auto-attempt camera on mount; fallback gracefully if denied
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Update live HUD clock and latency
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 23) + ' IST';
      const randomJitter = (Math.random() * 3 - 1.5).toFixed(1);
      const fps = isLowLatencyMode ? (59.6 + Math.random() * 0.4).toFixed(1) : (29.8 + Math.random() * 0.4).toFixed(1);
      const latency = isLowLatencyMode ? Math.round(14 + Math.random() * 4) : Math.round(38 + Math.random() * 10);

      setHudStats({
        fps: Number(fps),
        latencyMs: latency,
        timestamp: timeStr
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isLowLatencyMode]);

  // Raise / Lower Gate Barrier override
  const handleToggleBarrier = () => {
    setIsBarrierOverridden(!isBarrierOverridden);
    audioChime.playGateCallChime();
    speechVoice.speak(
      `Boom barrier ${!isBarrierOverridden ? 'manually raised' : 'lowered'} at Gate ${selectedGate.id}. Lane cleared.`,
      'en-IN'
    );
  };

  // Sound horn / chime to clear lane congestion
  const handleSoundLaneChime = () => {
    audioChime.playGateCallChime();
    speechVoice.speak(`Attention drivers at Gate ${selectedGate.id}: Please advance forward to weighbridge lane.`, 'en-IN');
  };

  // Capture video snapshot
  const handleCaptureSnapshot = () => {
    if (videoRef.current && isStreaming && !isSimulatedFeed) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSnapshotTaken(dataUrl);
      }
    } else {
      // Simulated snapshot
      setSnapshotTaken('simulated-capture');
    }
    audioChime.playSuccessChime();
    setTimeout(() => setSnapshotTaken(null), 4000);
  };

  // Filter CSS style definitions
  const getFilterStyles = (): React.CSSProperties => {
    switch (filterMode) {
      case 'anpr_ocr':
        return {
          filter: 'grayscale(100%) contrast(190%) brightness(110%)'
        };
      case 'night_ir':
        return {
          filter: 'sepia(100%) hue-rotate(85deg) saturate(300%) contrast(140%) brightness(120%)'
        };
      case 'thermal':
        return {
          filter: 'invert(100%) hue-rotate(180deg) saturate(280%) contrast(150%)'
        };
      case 'standard':
      default:
        return {
          filter: 'contrast(108%) saturate(110%) brightness(102%)'
        };
    }
  };

  const isBarrierOpen = isBarrierOverridden || selectedGate.barrierStatus === 'RAISED';

  return (
    <div className={`space-y-6 ${standalone ? 'p-6 bg-neutral-900 min-h-screen text-white' : ''}`}>
      
      {/* 1. Top Command Header & Gate Selection */}
      <div className="p-6 bg-neutral-900 text-white rounded-2xl border border-neutral-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>APMC Optical Surveillance Feed</span>
            <span>·</span>
            <span>Low-Latency Gate Telemetry</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Entry Gate Live Video Surveillance</span>
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {hudStats.fps} FPS · {hudStats.latencyMs}ms
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time optical feed with camera permission, ANPR license plate recognition, and congestion filter overlays.
          </p>
        </div>

        {/* Action Controls: Camera Connection Status */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {permissionState === 'granted' && isStreaming ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
            >
              <VideoOff className="w-3.5 h-3.5 text-neutral-400" />
              <span>Disconnect Camera</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={permissionState === 'requesting'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{permissionState === 'requesting' ? 'Requesting Permission...' : 'Connect Hardware Camera'}</span>
            </button>
          )}

          <button
            onClick={() => setIsSimulatedFeed(!isSimulatedFeed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isSimulatedFeed 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimulatedFeed ? 'CCTV Simulation Active' : 'Switch to CCTV Sim'}</span>
          </button>
        </div>
      </div>

      {/* 2. Gate Selector Tabs (4 Gates with Live Congestion Indicators) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GATES_DATA.map((gate) => {
          const isSelected = selectedGateId === gate.id;
          return (
            <button
              key={gate.id}
              onClick={() => {
                setSelectedGateId(gate.id);
                setIsBarrierOverridden(false);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected 
                  ? 'bg-neutral-900 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                  : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold">Gate #{gate.id}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${gate.congestionColor}`}>
                  {gate.congestionLevel}
                </span>
              </div>
              <p className={`text-[11px] truncate font-medium ${isSelected ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {gate.name.split(':')[1]}
              </p>
              <div className="flex items-center justify-between text-[10px] mt-2 pt-1.5 border-t border-neutral-800/20 font-mono">
                <span className={isSelected ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>
                  {gate.queueCount} vehicles queue
                </span>
                <span className={isSelected ? 'text-neutral-400' : 'text-neutral-500'}>
                  ~{gate.avgWaitMins}m wait
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. The Live Video Monitor with HUD Overlays */}
      <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl">
        
        {/* Top HUD Telemetry Bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600/90 text-white font-bold text-[11px] tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              LIVE FEED
            </span>
            <span className="text-white font-bold text-xs">
              CAM-0{selectedGate.id} · {selectedGate.name.toUpperCase()}
            </span>
            <span className="hidden sm:inline text-neutral-400 text-[11px]">
              {selectedCenter.name} APMC YARD
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-300">
            <span className="bg-black/60 px-2 py-0.5 rounded border border-neutral-700 text-emerald-400 font-bold">
              {hudStats.timestamp || '2026-09-29 10:24:00 IST'}
            </span>
            <span className="hidden md:inline bg-black/60 px-2 py-0.5 rounded border border-neutral-700">
              BITRATE: 4.8 Mbps
            </span>
            <span className="bg-black/60 px-2 py-0.5 rounded border border-neutral-700 text-amber-300 font-bold">
              {hudStats.latencyMs}ms LATENCY
            </span>
          </div>
        </div>

        {/* Main Video Viewport (Hardware Camera OR Animated CCTV Canvas) */}
        <div className="relative w-full aspect-video min-h-[380px] sm:min-h-[480px] bg-neutral-950 flex items-center justify-center overflow-hidden">
          
          {/* Real hardware video stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-all duration-200 ${
              isStreaming && !isSimulatedFeed ? 'block' : 'hidden'
            }`}
            style={getFilterStyles()}
          />

          {/* Fallback / High-Fidelity Simulated CCTV Feed */}
          {(!isStreaming || isSimulatedFeed) && (
            <div 
              className="w-full h-full relative flex items-center justify-center bg-neutral-900"
              style={getFilterStyles()}
            >
              {/* Simulated Mandi Gate CCTV Scene Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/80 via-neutral-900 to-neutral-950">
                {/* Yard Road Asphalt Pattern */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-neutral-950/90 border-t-2 border-neutral-700 flex flex-col justify-between p-6">
                  {/* Lane Markings */}
                  <div className="w-full border-t-2 border-dashed border-yellow-500/40 my-auto" />
                  <div className="w-full border-t-2 border-dashed border-white/20" />
                </div>

                {/* Gate Physical Boom Barrier Structure Visual */}
                <div className="absolute left-12 bottom-20 w-8 h-48 bg-neutral-700 rounded-t-lg border-2 border-neutral-500 flex flex-col justify-between items-center py-2 shadow-2xl">
                  <div className={`w-4 h-4 rounded-full ${isBarrierOpen ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'}`} />
                  <span className="text-[8px] font-mono font-bold text-neutral-300 -rotate-90">APMC BARRIER</span>
                </div>

                {/* Horizontal Boom Arm */}
                <div 
                  className={`absolute left-16 bottom-56 h-3 bg-repeating-linear-gradient w-96 rounded-r origin-left transition-all duration-700 ${
                    isBarrierOpen ? '-rotate-75 shadow-lg' : 'rotate-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)]'
                  }`}
                  style={{
                    background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 15px, #ffffff 15px, #ffffff 30px)'
                  }}
                />

                {/* Simulated Vehicle approaching */}
                <div className="absolute right-24 bottom-24 p-4 rounded-xl bg-neutral-900/90 border-2 border-dashed border-emerald-400 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      AI OCR DETECT: 99.4%
                    </span>
                    <span className="font-mono text-neutral-300 text-[11px]">
                      {selectedGate.speedKmH} km/h
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">LICENSE PLATE (ANPR):</span>
                      <span className="font-mono font-black text-amber-300 text-sm tracking-wider bg-black px-2 py-0.5 rounded border border-amber-400/40">
                        {selectedGate.detectedPlate}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-200 font-semibold pt-1">
                      {selectedGate.vehicleType}
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Valid Pre-Booked E-Pass · Fast-Track Ready</span>
                    </div>
                  </div>
                </div>

                {/* Scanline CRT Overlay effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-full bg-[length:100%_4px]" />
              </div>
            </div>
          )}

          {/* Computer Vision Target Bounding Box Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-8">
            <div className="relative w-72 sm:w-96 h-48 border-2 border-emerald-400/70 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] flex flex-col justify-between p-2">
              <div className="flex justify-between items-start text-[10px] font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <span>GATE #0{selectedGate.id} OPTICAL TARGET</span>
                <span>TRACK_ID: #4812</span>
              </div>

              {/* Horizontal laser scan beam animation */}
              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse my-auto" />

              <div className="flex justify-between items-end text-[10px] font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <span>PLATE: {selectedGate.detectedPlate}</span>
                <span>CONF: 99.2%</span>
              </div>
            </div>
          </div>

          {/* Gate Boom Barrier Physical Status HUD Banner */}
          <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <div className={`px-3 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-2 text-xs font-mono font-bold shadow-lg ${
              isBarrierOpen 
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
                : 'bg-red-950/90 text-red-300 border-red-500/50'
            }`}>
              {isBarrierOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
              <span>BARRIER: {isBarrierOpen ? 'RAISED (GREEN CHANNEL)' : 'LOWERED (HOLD FOR SCAN)'}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/80 text-neutral-300 border border-neutral-700 backdrop-blur-md text-[11px] font-mono flex items-center justify-between">
              <span>LANE QUEUE:</span>
              <span className="font-bold text-amber-300 ml-2">{selectedGate.queueCount} Vehicles</span>
            </div>
          </div>

          {/* Snapshot Confirmation Overlay Toast */}
          {snapshotTaken && (
            <div className="absolute inset-0 z-30 bg-white/20 backdrop-blur-xs flex items-center justify-center animate-in fade-in">
              <div className="p-4 rounded-2xl bg-neutral-900 text-white border border-emerald-500 shadow-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm">Security Snapshot Captured</h4>
                  <p className="text-xs text-neutral-400 font-mono">
                    High-res frame archived to APMC Yard Incident Log with ANPR metadata.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Feed Ticker: ANPR Recent Vehicles */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-between gap-4 text-xs font-mono text-neutral-300 border-t border-white/10">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <ScanLine className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-neutral-400 text-[11px]">RECENT ANPR DETECTIONS:</span>
              <span className="text-emerald-300 font-bold">{selectedGate.detectedPlate}</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-300">HR 02 Z 9184</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-300">UP 32 BN 4410</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-300">PB 10 CG 5501</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                LOW-LATENCY WEBRTC ACTIVE
              </span>
            </div>
          </div>

        </div>

        {/* 4. Officer Command & Filter Controls Bar */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: Filter Modes (Standard, ANPR OCR, Night IR, Thermal) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Optic Filter:</span>
            </span>

            <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
              <button
                onClick={() => setFilterMode('standard')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'standard' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Standard Natural
              </button>
              <button
                onClick={() => setFilterMode('anpr_ocr')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'anpr_ocr' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ANPR Plate OCR
              </button>
              <button
                onClick={() => setFilterMode('night_ir')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'night_ir' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 text-emerald-300" />
                <span>Night Vision IR</span>
              </button>
              <button
                onClick={() => setFilterMode('thermal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterMode === 'thermal' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-300" />
                <span>Thermal Density</span>
              </button>
            </div>
          </div>

          {/* Right: Operational Commander Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLowLatencyMode(!isLowLatencyMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isLowLatencyMode 
                  ? 'bg-blue-950 text-blue-300 border-blue-700' 
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
              title="Toggle 60FPS ultra-low latency direct frame rendering"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>{isLowLatencyMode ? '60 FPS Direct' : '30 FPS Buff'}</span>
            </button>

            <button
              onClick={handleCaptureSnapshot}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Archive security frame to dossier"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-300" />
              <span>Snapshot</span>
            </button>

            <button
              onClick={handleSoundLaneChime}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Broadcast audible chime to clear gate congestion"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Lane Horn</span>
            </button>

            <button
              onClick={handleToggleBarrier}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isBarrierOpen 
                  ? 'bg-red-700 hover:bg-red-600 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isBarrierOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isBarrierOpen ? 'Lower Barrier Arm' : 'Raise Barrier Override'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* 5. Gate Congestion Analytics & Automated Fast-Track Action Strip */}
      <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 text-sm">
                Gate Congestion Management Advisory
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Active Protocol
              </span>
            </div>
            <p className="text-neutral-500 mt-0.5 text-[11px]">
              Gate #{selectedGate.id} currently holds <strong>{selectedGate.queueCount} vehicles</strong> with an average wait of <strong>{selectedGate.avgWaitMins} minutes</strong>. Automated Fast-Track routing is actively balancing arrivals across Gates 1, 2, and 3.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (onCheckInToken) {
                onCheckInToken(selectedGate.detectedPlate, selectedGate.id);
              } else {
                checkInFarmer('DOCA-WHT-8492', selectedGate.id);
                audioChime.playSuccessChime();
                speechVoice.speak(`Token admitted at Gate ${selectedGate.id}. Advancing queue.`, 'en-IN');
              }
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Admit Detected Vehicle ({selectedGate.detectedPlate})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
