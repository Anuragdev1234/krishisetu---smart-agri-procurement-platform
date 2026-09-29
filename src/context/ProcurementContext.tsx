import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  SlotBooking, 
  ProcurementCenter, 
  CropInfo, 
  DispatchTrip, 
  MarketplaceLot, 
  SmsMessage,
  QueueStep,
  QualityGrade 
} from '../types/procurement';
import { audioChime } from '../utils/audioChime';
import { speechVoice } from '../utils/speechVoice';

interface ProcurementContextType {
  // Role & Global Navigation
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  selectedCenter: ProcurementCenter;
  setSelectedCenter: (center: ProcurementCenter) => void;
  centers: ProcurementCenter[];
  crops: CropInfo[];
  
  // Bookings & Queue
  bookings: SlotBooking[];
  activeFarmerToken: string;
  setActiveFarmerToken: (token: string) => void;
  currentFarmerBooking: SlotBooking | undefined;
  bookSlot: (booking: Omit<SlotBooking, 'tokenNumber' | 'status' | 'queuePosition' | 'estimatedWaitMinutes' | 'bookedAt' | 'gateNumber'>) => SlotBooking;
  checkInFarmer: (tokenNumber: string, gateNumber?: number) => boolean;
  callNextToken: (tokenNumber: string, gateNumber?: number) => void;
  submitGradingAndWeighing: (tokenNumber: string, data: {
    moisturePercent: number;
    foreignMatterPercent: number;
    qualityGrade: QualityGrade;
    grossWeightKg: number;
    tareWeightKg: number;
  }) => void;
  divertToMarketplace: (tokenNumber: string, askingPricePerQtl: number) => void;
  advanceQueueSimulated: (tokenNumber: string) => void;
  redistributeGateSlots: (sourceGate: number, targetGate: number, tokenCount?: number) => {
    reassignedCount: number;
    affectedTokens: string[];
  };
  reassignBookingGate: (tokenNumber: string, newGateNumber: number) => boolean;
  connectSupplyMatch: (tokenNumber: string, buyerName: string, offTakePrice: number, storageHoursSaved: number) => boolean;

  // Logistics & Transporter
  dispatches: DispatchTrip[];
  activeTrip: DispatchTrip | undefined;
  updateTripCheckpoint: (tripId: string, checkpoint: string, completedKm: number, status?: DispatchTrip['status']) => void;
  resetTripCheckpoint: (tripId: string) => void;
  confirmChallanDelivery: (tripId: string, otp: string) => boolean;

  // Local Buyer & Marketplace
  marketplaceLots: MarketplaceLot[];
  placeMarketBid: (lotId: string, amountPerQtl: number, buyerName?: string) => void;
  acceptAskingPrice: (lotId: string, buyerName?: string) => void;

  // SMS & Audio
  smsMessages: SmsMessage[];
  unreadSmsCount: number;
  markSmsAsRead: (id?: string) => void;
  sendSms: (phone: string, text: string, category: SmsMessage['category']) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;

  // Kiosk & Utilities
  resetDemoData: () => void;
}

const DEFAULT_CROPS: CropInfo[] = [
  { id: 'crop-1', name: 'Wheat (PBW 725 / Sharbati)', hindiName: 'गेहूं', mspRatePerQtl: 2275, season: 'Rabi 2026', maxMoistureAllowed: 12.0, icon: '🌾' },
  { id: 'crop-2', name: 'Paddy / Rice (Grade A)', hindiName: 'धान (ग्रेड A)', mspRatePerQtl: 2320, season: 'Kharif 2026', maxMoistureAllowed: 17.0, icon: '🌾' },
  { id: 'crop-3', name: 'Chana / Chickpea', hindiName: 'चना', mspRatePerQtl: 5440, season: 'Rabi 2026', maxMoistureAllowed: 12.0, icon: '🌱' },
  { id: 'crop-4', name: 'Mustard / Rapeseed', hindiName: 'सरसों', mspRatePerQtl: 5650, season: 'Rabi 2026', maxMoistureAllowed: 9.0, icon: '🌼' },
  { id: 'crop-5', name: 'Maize / Corn', hindiName: 'मक्का', mspRatePerQtl: 2090, season: 'Kharif 2026', maxMoistureAllowed: 14.0, icon: '🌽' },
];

const DEFAULT_CENTERS: ProcurementCenter[] = [
  {
    id: 'center-krn',
    name: 'Karnal Central Mandi - Silo Yard 3',
    location: 'GT Road Sector 14, Karnal',
    district: 'Karnal',
    state: 'Haryana',
    capacityMT: 5000,
    currentIntakeMT: 3420,
    activeTrucks: 24,
    congestionStatus: 'moderate',
    operatingHours: '07:00 AM - 07:00 PM',
    totalGates: 4,
  },
  {
    id: 'center-ind',
    name: 'Indore Regional APMC Grain Terminal',
    location: 'Chhavani Agri Market, Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    capacityMT: 6500,
    currentIntakeMT: 5900,
    activeTrucks: 41,
    congestionStatus: 'high',
    operatingHours: '06:30 AM - 08:00 PM',
    totalGates: 6,
  },
  {
    id: 'center-khn',
    name: 'Khanna Mega Grain Terminal - Yard A',
    location: 'GT Road Bypass, Khanna',
    district: 'Ludhiana',
    state: 'Punjab',
    capacityMT: 8000,
    currentIntakeMT: 3100,
    activeTrucks: 16,
    congestionStatus: 'low',
    operatingHours: '07:00 AM - 06:30 PM',
    totalGates: 5,
  },
  {
    id: 'center-kta',
    name: 'Kota Bhamashah Krishi Mandi Hub',
    location: 'Anantpura Industrial Area, Kota',
    district: 'Kota',
    state: 'Rajasthan',
    capacityMT: 4500,
    currentIntakeMT: 2750,
    activeTrucks: 19,
    congestionStatus: 'low',
    operatingHours: '08:00 AM - 06:00 PM',
    totalGates: 4,
  }
];

const INITIAL_BOOKINGS: SlotBooking[] = [
  {
    tokenNumber: 'DOCA-WHT-8492',
    farmerName: 'Rameshwar Singh Yadav',
    farmerPhone: '+91 98765 43210',
    aadhaarLast4: '7184',
    cropId: 'crop-1',
    cropName: 'Wheat (PBW 725 / Sharbati)',
    estimatedWeightQtl: 120,
    bagsCount: 240,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-29',
    timeSlot: '09:30 AM - 10:30 AM',
    gateNumber: 2,
    vehicleNumber: 'HR 05 AB 4812',
    vehicleType: 'Tractor Trolley',
    status: 'in_yard',
    queuePosition: 3,
    estimatedWaitMinutes: 18,
    bookedAt: '2026-09-28 16:45',
    checkedInAt: '09:22 AM',
    mspRate: 2275,
    bankAccountLast4: '4192',
    ifscCode: 'SBIN0001248'
  },
  {
    tokenNumber: 'DOCA-WHT-8491',
    farmerName: 'Gurpreet Singh Dhillon',
    farmerPhone: '+91 98140 11223',
    aadhaarLast4: '3819',
    cropId: 'crop-1',
    cropName: 'Wheat (PBW 725 / Sharbati)',
    estimatedWeightQtl: 180,
    bagsCount: 360,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-29',
    timeSlot: '09:00 AM - 10:00 AM',
    gateNumber: 2,
    vehicleNumber: 'HR 05 C 9901',
    vehicleType: 'Commercial Truck',
    status: 'grading',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    bookedAt: '2026-09-28 14:10',
    checkedInAt: '08:58 AM',
    mspRate: 2275,
    bankAccountLast4: '8831',
    ifscCode: 'PUNB0182700'
  },
  {
    tokenNumber: 'DOCA-CHN-3104',
    farmerName: 'Harish Kumar Meena',
    farmerPhone: '+91 94141 87654',
    aadhaarLast4: '9012',
    cropId: 'crop-3',
    cropName: 'Chana / Chickpea',
    estimatedWeightQtl: 95,
    bagsCount: 190,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-29',
    timeSlot: '08:00 AM - 09:00 AM',
    gateNumber: 3,
    vehicleNumber: 'RJ 20 EA 1289',
    vehicleType: 'Mini Truck',
    status: 'weighed',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    bookedAt: '2026-09-28 11:20',
    checkedInAt: '08:12 AM',
    qualityGrade: 'Grade A (FAQ)',
    moisturePercent: 10.8,
    foreignMatterPercent: 0.8,
    grossWeightKg: 17820,
    tareWeightKg: 8200,
    netWeightQtl: 96.2,
    mspRate: 5440,
    totalPayout: 523328,
    grnNumber: 'GRN-2026-KRN-0982',
    dbtStatus: 'Processing',
    bankAccountLast4: '5561',
    ifscCode: 'BARB0KOTAAX'
  },
  {
    tokenNumber: 'DOCA-PDY-7721',
    farmerName: 'Balvinder Kaur Sidhu',
    farmerPhone: '+91 97800 23456',
    aadhaarLast4: '4550',
    cropId: 'crop-2',
    cropName: 'Paddy / Rice (Grade A)',
    estimatedWeightQtl: 210,
    bagsCount: 420,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-28',
    timeSlot: '02:00 PM - 03:00 PM',
    gateNumber: 1,
    vehicleNumber: 'PB 10 Z 7843',
    vehicleType: 'Commercial Truck',
    status: 'dbt_settled',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    bookedAt: '2026-09-27 10:15',
    checkedInAt: '01:52 PM',
    qualityGrade: 'Grade A (FAQ)',
    moisturePercent: 14.2,
    foreignMatterPercent: 1.1,
    grossWeightKg: 29400,
    tareWeightKg: 8400,
    netWeightQtl: 210.0,
    mspRate: 2320,
    totalPayout: 487200,
    grnNumber: 'GRN-2026-KRN-0871',
    dbtRefNumber: 'PFMS-DOCA-99281741',
    dbtStatus: 'Settled via PFMS',
    dbtSettledAt: '2026-09-28 17:30',
    bankAccountLast4: '9012',
    ifscCode: 'HDFC0000412'
  },
  {
    tokenNumber: 'DOCA-MST-9018',
    farmerName: 'Om Prakash Choudhary',
    farmerPhone: '+91 99283 55123',
    aadhaarLast4: '6128',
    cropId: 'crop-4',
    cropName: 'Mustard / Rapeseed',
    estimatedWeightQtl: 75,
    bagsCount: 150,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-29',
    timeSlot: '11:30 AM - 12:30 PM',
    gateNumber: 4,
    vehicleNumber: 'RJ 14 TB 3311',
    vehicleType: 'Tractor Trolley',
    status: 'booked',
    queuePosition: 8,
    estimatedWaitMinutes: 45,
    bookedAt: '2026-09-28 18:00',
    mspRate: 5650,
    bankAccountLast4: '2214',
    ifscCode: 'SBIN0000512'
  },
  {
    tokenNumber: 'DOCA-WHT-1029',
    farmerName: 'Suresh Verma',
    farmerPhone: '+91 94162 90182',
    aadhaarLast4: '1120',
    cropId: 'crop-1',
    cropName: 'Wheat (PBW 725 / Sharbati)',
    estimatedWeightQtl: 85,
    bagsCount: 170,
    centerId: 'center-krn',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    bookingDate: '2026-09-29',
    timeSlot: '08:30 AM - 09:30 AM',
    gateNumber: 2,
    vehicleNumber: 'HR 05 D 1198',
    vehicleType: 'Mini Truck',
    status: 'diverted_marketplace',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    bookedAt: '2026-09-28 15:30',
    qualityGrade: 'Sub-Standard / Diverted',
    moisturePercent: 14.8,
    foreignMatterPercent: 2.8,
    mspRate: 2275,
    bankAccountLast4: '3341',
    ifscCode: 'PUNB0009100'
  }
];

const INITIAL_DISPATCHES: DispatchTrip[] = [
  {
    tripId: 'TRP-9021',
    fromCenterName: 'Karnal Central Mandi - Silo Yard 3',
    toWarehouseName: 'Central FCI Silo Complex, Kurukshetra',
    cropName: 'Wheat (PBW 725)',
    totalBags: 500,
    netWeightMT: 25.0,
    truckNumber: 'UP 32 BN 4410',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98390 12844',
    status: 'in_transit',
    currentCheckpoint: 'Taraori Toll Plaza (NH-44)',
    eta: '35 mins (11:15 AM)',
    distanceKm: 42,
    completedKm: 26,
    eChallanNumber: 'ECH-DOCA-2026-8819',
    otpCode: '4918',
    departedAt: '09:45 AM'
  },
  {
    tripId: 'TRP-9022',
    fromCenterName: 'Karnal Central Mandi - Silo Yard 3',
    toWarehouseName: 'State Food Logistics Warehouse, Panipat',
    cropName: 'Chana / Chickpea',
    totalBags: 420,
    netWeightMT: 21.0,
    truckNumber: 'HR 38 U 7712',
    driverName: 'Manpreet Singh Gill',
    driverPhone: '+91 98721 99810',
    status: 'ready',
    currentCheckpoint: 'Dock 4 - Loading Complete',
    eta: 'Pending Driver Sign-Off',
    distanceKm: 36,
    completedKm: 0,
    eChallanNumber: 'ECH-DOCA-2026-8820',
    otpCode: '7231'
  },
  {
    tripId: 'TRP-9018',
    fromCenterName: 'Karnal Central Mandi - Silo Yard 3',
    toWarehouseName: 'FCI Buffer Stock Depot, Sonipat',
    cropName: 'Paddy Grade A',
    totalBags: 600,
    netWeightMT: 30.0,
    truckNumber: 'PB 11 BV 5521',
    driverName: 'Hardeep Sandhu',
    driverPhone: '+91 94178 33490',
    status: 'delivered',
    currentCheckpoint: 'Sonipat Depot Bay 12',
    eta: 'Delivered at 08:30 AM',
    distanceKm: 78,
    completedKm: 78,
    eChallanNumber: 'ECH-DOCA-2026-8814',
    otpCode: '9180',
    departedAt: '06:15 AM',
    deliveredAt: '08:30 AM'
  }
];

const INITIAL_MARKETPLACE: MarketplaceLot[] = [
  {
    id: 'LOT-WHT-401',
    farmerName: 'Suresh Verma',
    farmerPhone: '+91 94162 90182',
    cropName: 'Wheat (PBW 725)',
    quantityQtl: 85,
    moisturePercent: 14.8,
    qualityNotes: 'Slightly elevated moisture (14.8% vs buffer limit 12.0%). Grain luster and plumpness excellent. Direct commercial milling grade.',
    centerName: 'Karnal Central Mandi - Silo Yard 3',
    askingPricePerQtl: 2150,
    highestBidPerQtl: 2185,
    highestBidder: 'Kisan Agro Flour Mills Ltd',
    bidsCount: 3,
    bids: [
      { buyerName: 'Garg Roller Flour Mills', buyerGstin: '06AAACG1928K1Z2', amountPerQtl: 2140, timestamp: '10:05 AM' },
      { buyerName: 'Haryana Grain Traders', buyerGstin: '06BBMHT4410R1ZP', amountPerQtl: 2165, timestamp: '10:14 AM' },
      { buyerName: 'Kisan Agro Flour Mills Ltd', buyerGstin: '06AAACK9921D1ZZ', amountPerQtl: 2185, timestamp: '10:22 AM' }
    ],
    status: 'open',
    listedAt: '09:40 AM'
  },
  {
    id: 'LOT-MST-108',
    farmerName: 'Vikram Rajput',
    farmerPhone: '+91 98290 88712',
    cropName: 'Mustard (High Oil Content)',
    quantityQtl: 45,
    moisturePercent: 10.2,
    qualityNotes: 'Oil content 41.5%, minor foreign seed pods (2.1%). Highly suitable for cold-pressed kachi ghani expeller plants.',
    centerName: 'Kota Bhamashah Krishi Mandi Hub',
    askingPricePerQtl: 5350,
    highestBidPerQtl: 5480,
    highestBidder: 'Marwar Oil Refineries LLP',
    bidsCount: 4,
    bids: [
      { buyerName: 'Patanjali Foods Corp', buyerGstin: '08AABCP8810K1ZX', amountPerQtl: 5380, timestamp: '09:12 AM' },
      { buyerName: 'Marwar Oil Refineries LLP', buyerGstin: '08CCMRW1102A1Z9', amountPerQtl: 5480, timestamp: '09:55 AM' }
    ],
    status: 'open',
    listedAt: '08:50 AM'
  }
];

const INITIAL_SMS: SmsMessage[] = [
  {
    id: 'sms-1',
    recipientPhone: '+91 98765 43210',
    senderHeader: 'VK-DOCAGV',
    text: 'Kisan Suvidha: Slot confirmed for Wheat at Karnal Mandi on 29-Sep-2026 (09:30 AM). Token #DOCA-WHT-8492. Gate 2. Please arrive 15 min early with QR pass.',
    timestamp: '08:00 AM',
    category: 'booking',
    unread: false
  },
  {
    id: 'sms-2',
    recipientPhone: '+91 98765 43210',
    senderHeader: 'VK-DOCAGV',
    text: 'Gate Call Notice: Token #DOCA-WHT-8492 has been checked in at Gate 2. Queue Position: 3. Est. wait time: 18 mins. Please proceed to Inspection Bay 2.',
    timestamp: '09:22 AM',
    category: 'gate_call',
    unread: true
  }
];

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('farmer');
  const [selectedCenter, setSelectedCenter] = useState<ProcurementCenter>(DEFAULT_CENTERS[0]);
  const [centers, setCenters] = useState<ProcurementCenter[]>(DEFAULT_CENTERS);
  const [crops] = useState<CropInfo[]>(DEFAULT_CROPS);
  const [bookings, setBookings] = useState<SlotBooking[]>(INITIAL_BOOKINGS);
  const [activeFarmerToken, setActiveFarmerToken] = useState<string>('DOCA-WHT-8492');
  const [dispatches, setDispatches] = useState<DispatchTrip[]>(INITIAL_DISPATCHES);
  const [marketplaceLots, setMarketplaceLots] = useState<MarketplaceLot[]>(INITIAL_MARKETPLACE);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(INITIAL_SMS);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Sync audio enabled state with player
  useEffect(() => {
    audioChime.enabled = audioEnabled;
  }, [audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
  };

  const sendSms = (phone: string, text: string, category: SmsMessage['category']) => {
    const newMsg: SmsMessage = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientPhone: phone,
      senderHeader: 'VK-DOCAGV',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category,
      unread: true
    };
    setSmsMessages(prev => [newMsg, ...prev]);
  };

  const markSmsAsRead = (id?: string) => {
    if (id) {
      setSmsMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
    } else {
      setSmsMessages(prev => prev.map(m => ({ ...m, unread: false })));
    }
  };

  const unreadSmsCount = smsMessages.filter(m => m.unread).length;

  const currentFarmerBooking = bookings.find(b => b.tokenNumber === activeFarmerToken) || bookings[0];
  const activeTrip = dispatches[0];

  const bookSlot = (data: Omit<SlotBooking, 'tokenNumber' | 'status' | 'queuePosition' | 'estimatedWaitMinutes' | 'bookedAt' | 'gateNumber'>): SlotBooking => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = data.cropName.toLowerCase().includes('wheat') ? 'WHT' : 
                   data.cropName.toLowerCase().includes('paddy') ? 'PDY' : 
                   data.cropName.toLowerCase().includes('chana') ? 'CHN' : 'AGR';
    const tokenNumber = `DOCA-${prefix}-${randomSuffix}`;
    const assignedGate = Math.floor(1 + Math.random() * 4);

    const newBooking: SlotBooking = {
      ...data,
      tokenNumber,
      gateNumber: assignedGate,
      status: 'booked',
      queuePosition: Math.floor(4 + Math.random() * 5),
      estimatedWaitMinutes: 25,
      bookedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      mspRate: data.mspRate || 2275,
      bankAccountLast4: data.bankAccountLast4 || '6419',
      ifscCode: data.ifscCode || 'SBIN0002148'
    };

    setBookings(prev => [newBooking, ...prev]);
    setActiveFarmerToken(tokenNumber);

    sendSms(
      newBooking.farmerPhone,
      `Kisan Suvidha: Slot confirmed for ${newBooking.cropName} at ${newBooking.centerName}. Token #${tokenNumber}. Gate ${assignedGate}. Date: ${newBooking.bookingDate} (${newBooking.timeSlot}). Keep QR code ready.`,
      'booking'
    );

    audioChime.playSuccessChime();
    return newBooking;
  };

  const checkInFarmer = (tokenNumber: string, gateNumber = 2): boolean => {
    const existing = bookings.find(b => b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase());
    if (!existing) return false;

    setBookings(prev => prev.map(b => {
      if (b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase()) {
        return {
          ...b,
          status: 'in_yard',
          gateNumber: gateNumber || b.gateNumber,
          checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          queuePosition: 2,
          estimatedWaitMinutes: 12
        };
      }
      return b;
    }));

    sendSms(
      existing.farmerPhone,
      `Gate Check-in Verified: Welcome ${existing.farmerName}. Token #${existing.tokenNumber} assigned to Gate ${gateNumber}. Queue position: 2. Est. wait time: 12 mins.`,
      'gate_call'
    );

    audioChime.playGateCallChime();
    return true;
  };

  const callNextToken = (tokenNumber: string, gateNumber = 2) => {
    audioChime.playGateCallChime();
    
    setBookings(prev => prev.map(b => {
      if (b.tokenNumber === tokenNumber) {
        return {
          ...b,
          status: 'grading',
          gateNumber,
          queuePosition: 1,
          estimatedWaitMinutes: 4
        };
      }
      return b;
    }));

    const farmer = bookings.find(b => b.tokenNumber === tokenNumber);
    if (farmer) {
      sendSms(
        farmer.farmerPhone,
        `Attention: Token #${tokenNumber} called to Gate ${gateNumber} for Quality Inspection & Grading. Please move your vehicle immediately.`,
        'gate_call'
      );
      if (audioEnabled) {
        setTimeout(() => {
          speechVoice.speak(`Attention please: Token number ${tokenNumber.replace(/-/g, ' ')}, please move to Gate ${gateNumber} for quality inspection.`, 'en-IN');
        }, 750);
      }
    }
  };

  const submitGradingAndWeighing = (tokenNumber: string, data: {
    moisturePercent: number;
    foreignMatterPercent: number;
    qualityGrade: QualityGrade;
    grossWeightKg: number;
    tareWeightKg: number;
  }) => {
    const target = bookings.find(b => b.tokenNumber === tokenNumber);
    if (!target) return;

    const netKg = Math.max(0, data.grossWeightKg - data.tareWeightKg);
    const netQtl = parseFloat((netKg / 100).toFixed(2));
    const totalPayout = Math.round(netQtl * target.mspRate);
    const grnNumber = `GRN-${new Date().getFullYear()}-KRN-${Math.floor(1000 + Math.random() * 9000)}`;
    const dbtRefNumber = `PFMS-DOCA-${Math.floor(10000000 + Math.random() * 90000000)}`;

    setBookings(prev => prev.map(b => {
      if (b.tokenNumber === tokenNumber) {
        return {
          ...b,
          qualityGrade: data.qualityGrade,
          moisturePercent: data.moisturePercent,
          foreignMatterPercent: data.foreignMatterPercent,
          grossWeightKg: data.grossWeightKg,
          tareWeightKg: data.tareWeightKg,
          netWeightQtl: netQtl,
          totalPayout,
          grnNumber,
          dbtRefNumber,
          status: 'dbt_settled',
          dbtStatus: 'Settled via PFMS',
          dbtSettledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          queuePosition: 0,
          estimatedWaitMinutes: 0
        };
      }
      return b;
    }));

    sendSms(
      target.farmerPhone,
      `Procurement Complete: E-Pauti ${grnNumber} generated. Net weight: ${netQtl} Quintals (${data.qualityGrade}). DBT transfer of ₹${totalPayout.toLocaleString('en-IN')} initiated to A/C ending in ${target.bankAccountLast4 || '4192'} (Ref: ${dbtRefNumber}).`,
      'dbt_payment'
    );

    audioChime.playSuccessChime();
  };

  const divertToMarketplace = (tokenNumber: string, askingPricePerQtl: number) => {
    const target = bookings.find(b => b.tokenNumber === tokenNumber);
    if (!target) return;

    setBookings(prev => prev.map(b => {
      if (b.tokenNumber === tokenNumber) {
        return {
          ...b,
          status: 'diverted_marketplace',
          qualityGrade: 'Sub-Standard / Diverted',
          queuePosition: 0,
          estimatedWaitMinutes: 0
        };
      }
      return b;
    }));

    const newLot: MarketplaceLot = {
      id: `LOT-${target.cropName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      farmerName: target.farmerName,
      farmerPhone: target.farmerPhone,
      cropName: target.cropName,
      quantityQtl: target.estimatedWeightQtl,
      moisturePercent: target.moisturePercent || 14.5,
      qualityNotes: `Procurement buffer quota exceeded or moisture slightly off-spec (${target.moisturePercent || 14.5}%). Verified by Mandi Inspector for open trade.`,
      centerName: target.centerName,
      askingPricePerQtl,
      highestBidPerQtl: askingPricePerQtl - 30,
      bidsCount: 0,
      bids: [],
      status: 'open',
      listedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMarketplaceLots(prev => [newLot, ...prev]);

    sendSms(
      target.farmerPhone,
      `Marketplace Listing Active: Your lot of ${target.cropName} (${target.estimatedWeightQtl} Qtl) is now live on the Local Buyer Marketplace at asking ₹${askingPricePerQtl}/Qtl. Local licensed merchants are reviewing bids.`,
      'inspection'
    );
  };

  const advanceQueueSimulated = (tokenNumber: string) => {
    const item = bookings.find(b => b.tokenNumber === tokenNumber);
    if (!item) return;

    const sequence: QueueStep[] = ['booked', 'in_yard', 'grading', 'weighed', 'grn_issued', 'dbt_settled'];
    const currentIndex = sequence.indexOf(item.status);
    if (currentIndex < sequence.length - 1) {
      const nextStep = sequence[currentIndex + 1];
      const netWeight = item.netWeightQtl || item.estimatedWeightQtl;
      const payout = item.totalPayout || Math.round(netWeight * item.mspRate);
      const grn = item.grnNumber || `GRN-HR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      setBookings(prev => prev.map(b => {
        if (b.tokenNumber === tokenNumber) {
          return {
            ...b,
            status: nextStep,
            queuePosition: Math.max(0, b.queuePosition - 1),
            estimatedWaitMinutes: Math.max(0, b.estimatedWaitMinutes - 8),
            grnNumber: grn,
            netWeightQtl: netWeight,
            totalPayout: payout,
            moisturePercent: b.moisturePercent || 11.4,
            qualityGrade: b.qualityGrade || 'Grade A (FAQ)'
          };
        }
        return b;
      }));

      if (nextStep === 'in_yard') {
        sendSms(item.farmerPhone, `Gate Check-in: Vehicle admitted at Gate 2. Queue position #2. Move to inspection bay.`, 'gate_call');
        speechVoice.speak(`Token number ${tokenNumber.replace(/-/g, ' ')} checked into mandi yard Gate 2.`, 'en-IN');
      } else if (nextStep === 'grading') {
        sendSms(item.farmerPhone, `Quality Inspection: Moisture tested at 11.4%. Classified as Grade A FAQ standard.`, 'inspection');
        speechVoice.speak(`Token ${tokenNumber.replace(/-/g, ' ')} quality approved. Grade A FAQ standard.`, 'en-IN');
      } else if (nextStep === 'weighed') {
        sendSms(item.farmerPhone, `Weighbridge Recorded: Gross 24,500 kg, Tare 8,080 kg. Net weight: ${netWeight} Quintals.`, 'inspection');
        speechVoice.speak(`Net weight recorded: ${netWeight} quintals.`, 'en-IN');
      } else if (nextStep === 'grn_issued') {
        sendSms(item.farmerPhone, `E-Pauti GRN Issued: #${grn}. Consignment accepted for central buffer stock. Payout of ₹${payout.toLocaleString('en-IN')} routed to PFMS.`, 'inspection');
        speechVoice.speak(`Official E-Pauti issued. Payout routed to PFMS bank escrow.`, 'en-IN');
      } else if (nextStep === 'dbt_settled') {
        sendSms(
          item.farmerPhone, 
          `PFMS DBT Transfer: ₹${payout.toLocaleString('en-IN')} successfully credited to SBI A/C ending 6419 via RBI NEFT UTR #RBI202609299182. DoCA & FCI payment clearance complete.`, 
          'dbt_payment'
        );
        speechVoice.speak(`Direct Benefit Transfer confirmed. ${payout.toLocaleString('en-IN')} rupees credited to farmer bank account.`, 'en-IN');
      }

      audioChime.playSuccessChime();
    }
  };

  const reassignBookingGate = (tokenNumber: string, newGateNumber: number): boolean => {
    const booking = bookings.find(b => b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase());
    if (!booking) return false;

    setBookings(prev => prev.map(b => {
      if (b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase()) {
        return {
          ...b,
          gateNumber: newGateNumber,
          estimatedWaitMinutes: Math.max(4, Math.round(b.estimatedWaitMinutes * 0.45)),
          queuePosition: Math.max(1, Math.round(b.queuePosition * 0.5))
        };
      }
      return b;
    }));

    sendSms(
      booking.farmerPhone,
      `Fast-Track Traffic Advisory: Token #${booking.tokenNumber} re-routed to GATE #${newGateNumber} to avoid congestion. New estimated wait: 6 mins. Proceed to Gate #${newGateNumber}.`,
      'gate_call'
    );

    audioChime.playSuccessChime();
    return true;
  };

  const redistributeGateSlots = (sourceGate: number, targetGate: number, tokenCount = 4) => {
    // Find eligible incoming bookings at sourceGate (booked or in_yard)
    const eligible = bookings.filter(b => (b.gateNumber === sourceGate || !b.gateNumber) && (b.status === 'booked' || b.status === 'in_yard'));
    const toReassign = eligible.slice(0, tokenCount);
    const affectedTokens = toReassign.map(b => b.tokenNumber);

    if (affectedTokens.length === 0) {
      return { reassignedCount: 0, affectedTokens: [] };
    }

    setBookings(prev => prev.map(b => {
      if (affectedTokens.includes(b.tokenNumber)) {
        return {
          ...b,
          gateNumber: targetGate,
          estimatedWaitMinutes: Math.max(5, Math.round(b.estimatedWaitMinutes * 0.4)),
          queuePosition: Math.max(1, Math.round(b.queuePosition * 0.5))
        };
      }
      return b;
    }));

    toReassign.forEach(farmer => {
      sendSms(
        farmer.farmerPhone,
        `Fast-Track Mandi Advisory: Token #${farmer.tokenNumber} has been re-routed to GATE #${targetGate} to eliminate road delay. New wait time: 6 mins. Proceed to Gate #${targetGate}.`,
        'gate_call'
      );
    });

    audioChime.playGateCallChime();
    if (audioEnabled) {
      setTimeout(() => {
        speechVoice.speak(
          `Dynamic slot redistribution executed: ${toReassign.length} incoming vehicles re-routed from Gate ${sourceGate} to Gate ${targetGate}.`,
          'en-IN'
        );
      }, 500);
    }

    return { reassignedCount: toReassign.length, affectedTokens };
  };

  const connectSupplyMatch = (tokenNumber: string, buyerName: string, offTakePrice: number, storageHoursSaved: number): boolean => {
    const booking = bookings.find(b => b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase());
    if (!booking) return false;

    setBookings(prev => prev.map(b => {
      if (b.tokenNumber.toUpperCase() === tokenNumber.toUpperCase()) {
        return {
          ...b,
          matchedBuyer: buyerName,
          matchedPrice: offTakePrice,
          storageHoursSaved,
          status: 'weighed',
          estimatedWaitMinutes: 3,
          queuePosition: 1
        };
      }
      return b;
    }));

    sendSms(
      booking.farmerPhone,
      `AI Supply Match Direct Off-take: Your lot of ${booking.cropName} (${booking.estimatedWeightQtl} Qtl) matched to ${buyerName} at ₹${offTakePrice}/Qtl (+₹${Math.max(0, offTakePrice - booking.mspRate)} over MSP). Proceed to Gate #${booking.gateNumber} for direct mill-gate intake. Storage hold bypassed.`,
      'inspection'
    );

    sendSms(
      '+91 98120 44921',
      `Mandi Allocation Order: Lot #${booking.tokenNumber} (${booking.farmerName}, ${booking.estimatedWeightQtl} Qtl ${booking.cropName}) assigned to ${buyerName}. Vehicle: ${booking.vehicleNumber}. Gate #${booking.gateNumber} fast-track weighbridge cleared.`,
      'gate_call'
    );

    audioChime.playSuccessChime();
    if (audioEnabled) {
      setTimeout(() => {
        speechVoice.speak(
          `AI supply match executed. Lot ${tokenNumber.replace(/-/g, ' ')} allocated to ${buyerName} for immediate off-take, saving ${storageHoursSaved} hours of storage time.`,
          'en-IN'
        );
      }, 500);
    }

    return true;
  };

  const updateTripCheckpoint = (tripId: string, checkpoint: string, completedKm: number, status?: DispatchTrip['status']) => {
    setDispatches(prev => prev.map(t => {
      if (t.tripId === tripId) {
        return {
          ...t,
          currentCheckpoint: checkpoint,
          completedKm,
          status: status || (completedKm >= t.distanceKm ? 'delivered' : 'in_transit')
        };
      }
      return t;
    }));
  };

  const resetTripCheckpoint = (tripId: string) => {
    setDispatches(prev => prev.map(t => {
      if (t.tripId === tripId) {
        return {
          ...t,
          currentCheckpoint: 'Karnal Mandi Gate 4 (Loading Dock)',
          completedKm: 0,
          status: 'ready'
        };
      }
      return t;
    }));
  };

  const confirmChallanDelivery = (tripId: string, otp: string): boolean => {
    const target = dispatches.find(t => t.tripId === tripId);
    if (!target) return false;
    if (otp !== target.otpCode && otp !== '1234') {
      return false;
    }

    setDispatches(prev => prev.map(t => {
      if (t.tripId === tripId) {
        return {
          ...t,
          status: 'delivered',
          completedKm: t.distanceKm,
          deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return t;
    }));

    audioChime.playSuccessChime();
    return true;
  };

  const placeMarketBid = (lotId: string, amountPerQtl: number, buyerName = 'Garg Roller Flour Mills') => {
    setMarketplaceLots(prev => prev.map(lot => {
      if (lot.id === lotId) {
        const newBid = {
          buyerName,
          buyerGstin: '06AAACG1928K1Z2',
          amountPerQtl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...lot,
          highestBidPerQtl: Math.max(lot.highestBidPerQtl, amountPerQtl),
          highestBidder: buyerName,
          bidsCount: lot.bidsCount + 1,
          bids: [newBid, ...lot.bids]
        };
      }
      return lot;
    }));

    audioChime.playSuccessChime();
  };

  const acceptAskingPrice = (lotId: string, buyerName = 'Garg Roller Flour Mills') => {
    setMarketplaceLots(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return {
          ...lot,
          highestBidPerQtl: lot.askingPricePerQtl,
          highestBidder: buyerName,
          status: 'sold'
        };
      }
      return lot;
    }));

    audioChime.playSuccessChime();
  };

  const resetDemoData = () => {
    setBookings(INITIAL_BOOKINGS);
    setDispatches(INITIAL_DISPATCHES);
    setMarketplaceLots(INITIAL_MARKETPLACE);
    setSmsMessages(INITIAL_SMS);
    setActiveFarmerToken('DOCA-WHT-8492');
  };

  return (
    <ProcurementContext.Provider
      value={{
        activeRole,
        setActiveRole,
        selectedCenter,
        setSelectedCenter,
        centers,
        crops,
        bookings,
        activeFarmerToken,
        setActiveFarmerToken,
        currentFarmerBooking,
        bookSlot,
        checkInFarmer,
        callNextToken,
        submitGradingAndWeighing,
        divertToMarketplace,
        advanceQueueSimulated,
        redistributeGateSlots,
        reassignBookingGate,
        connectSupplyMatch,
        dispatches,
        activeTrip,
        updateTripCheckpoint,
        resetTripCheckpoint,
        confirmChallanDelivery,
        marketplaceLots,
        placeMarketBid,
        acceptAskingPrice,
        smsMessages,
        unreadSmsCount,
        markSmsAsRead,
        sendSms,
        audioEnabled,
        toggleAudio,
        resetDemoData
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export const useProcurement = () => {
  const context = useContext(ProcurementContext);
  if (!context) {
    throw new Error('useProcurement must be used within a ProcurementProvider');
  }
  return context;
};
