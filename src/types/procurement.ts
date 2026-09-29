export type UserRole = 'farmer' | 'officer' | 'transporter' | 'local_buyer' | 'kiosk';

export type QueueStep = 
  | 'booked' 
  | 'in_yard' 
  | 'grading' 
  | 'weighed' 
  | 'grn_issued' 
  | 'dbt_settled' 
  | 'diverted_marketplace';

export type QualityGrade = 'Grade A (FAQ)' | 'Grade B (FAQ)' | 'Sub-Standard / Diverted';

export interface CropInfo {
  id: string;
  name: string;
  hindiName: string;
  mspRatePerQtl: number;
  season: string;
  maxMoistureAllowed: number; // e.g. 12% or 14%
  icon: string;
}

export interface ProcurementCenter {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  capacityMT: number;
  currentIntakeMT: number;
  activeTrucks: number;
  congestionStatus: 'low' | 'moderate' | 'high';
  operatingHours: string;
  totalGates: number;
}

export interface SlotBooking {
  tokenNumber: string;
  farmerName: string;
  farmerPhone: string;
  aadhaarLast4: string;
  cropId: string;
  cropName: string;
  estimatedWeightQtl: number;
  bagsCount: number;
  centerId: string;
  centerName: string;
  bookingDate: string;
  timeSlot: string;
  gateNumber: number;
  vehicleNumber: string;
  vehicleType: 'Tractor Trolley' | 'Mini Truck' | 'Bullock Cart' | 'Commercial Truck';
  status: QueueStep;
  queuePosition: number;
  estimatedWaitMinutes: number;
  bookedAt: string;
  checkedInAt?: string;
  // Inspection & Weighing
  qualityGrade?: QualityGrade;
  moisturePercent?: number;
  foreignMatterPercent?: number;
  grossWeightKg?: number;
  tareWeightKg?: number;
  netWeightQtl?: number;
  mspRate: number;
  totalPayout?: number;
  // Verification and Financials
  grnNumber?: string;
  dbtRefNumber?: string;
  dbtStatus?: 'Pending' | 'Processing' | 'Settled via PFMS';
  dbtSettledAt?: string;
  bankAccountLast4?: string;
  ifscCode?: string;
  // AI Supply Matcher
  matchedBuyer?: string;
  matchedPrice?: number;
  storageHoursSaved?: number;
}

export interface BuyerInventoryDemand {
  id: string;
  buyerName: string;
  buyerType: 'Flour Mill' | 'Rice Sheller' | 'Oil Expeller' | 'Dal Processor' | 'Feed Manufacturer' | 'Wholesale Trader';
  gstin: string;
  location: string;
  distanceKm: number;
  contactPerson: string;
  phone: string;
  targetCrops: string[];
  dailyConsumptionQtl: number;
  currentInventoryQtl: number;
  criticalBufferDays: number;
  inventoryDeficitQtl: number;
  urgencyLevel: 'critical' | 'high' | 'moderate';
  maxPurchasePricePerQtl: number;
  qualityToleranceNotes: string;
  preferredMoistureMax: number;
  directLiftFleetReady: boolean;
}

export interface SupplyMatchRecommendation {
  matchId: string;
  booking: SlotBooking;
  buyer: BuyerInventoryDemand;
  matchScore: number; // 0 - 100
  storageHoursSaved: number;
  siloCostSavedINR: number;
  farmerPriceRealization: number;
  priceDeltaVsMsp: number;
  rationale: string;
  status: 'recommended' | 'connected' | 'rejected';
}

export interface DispatchTrip {
  tripId: string;
  fromCenterName: string;
  toWarehouseName: string;
  cropName: string;
  totalBags: number;
  netWeightMT: number;
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'ready' | 'loading' | 'in_transit' | 'delivered';
  currentCheckpoint: string;
  eta: string;
  distanceKm: number;
  completedKm: number;
  eChallanNumber: string;
  otpCode: string;
  departedAt?: string;
  deliveredAt?: string;
}

export interface MarketplaceLot {
  id: string;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  quantityQtl: number;
  moisturePercent: number;
  qualityNotes: string;
  centerName: string;
  askingPricePerQtl: number;
  highestBidPerQtl: number;
  highestBidder?: string;
  bidsCount: number;
  bids: {
    buyerName: string;
    buyerGstin: string;
    amountPerQtl: number;
    timestamp: string;
  }[];
  status: 'open' | 'sold';
  listedAt: string;
}

export interface SmsMessage {
  id: string;
  recipientPhone: string;
  senderHeader: string; // e.g. "VK-DOCAGV"
  text: string;
  timestamp: string;
  category: 'booking' | 'gate_call' | 'inspection' | 'dbt_payment';
  unread: boolean;
}
