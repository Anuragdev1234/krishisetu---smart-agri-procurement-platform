import React from 'react';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Clock, 
  QrCode, 
  Receipt, 
  ScanLine, 
  Users, 
  Scale, 
  Warehouse, 
  Truck, 
  Navigation, 
  FileCheck, 
  Store, 
  Gavel, 
  FileSpreadsheet, 
  Printer, 
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Route,
  Mic,
  TrendingUp,
  Video,
  Shuffle,
  Sparkles
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { activeRole, bookings, dispatches, marketplaceLots } = useProcurement();
  const { t } = useLanguage();

  // Dynamic role menus
  const getNavItems = () => {
    switch (activeRole) {
      case 'farmer':
        return [
          { id: 'overview', label: t('nav.dashboard', 'Dashboard Overview'), icon: LayoutDashboard },
          { id: 'voice_booking', label: t('nav.voiceBooking', 'Voice Slot Booking'), icon: Mic, badge: 'Voice' },
          { id: 'book_slot', label: t('nav.bookSlot', 'Book Procurement Slot'), icon: CalendarPlus, badge: 'MSP' },
          { id: 'queue_tracker', label: t('nav.queueTracker', 'Live Queue Tracker'), icon: Clock, badge: 'Live' },
          { id: 'qr_pass', label: t('nav.digitalPass', 'Digital QR Pass'), icon: QrCode },
          { id: 'dbt_history', label: t('nav.dbtHistory', 'Procurement & DBT'), icon: Receipt },
        ];
      case 'officer':
        const inYardCount = bookings.filter(b => b.status === 'in_yard' || b.status === 'grading').length;
        return [
          { id: 'yard_command', label: t('nav.commandOverview', 'Command Overview'), icon: LayoutDashboard },
          { id: 'ai_supply_matcher', label: t('nav.aiSupplyMatcher', 'AI Supply Matcher'), icon: Sparkles, badge: 'AI' },
          { id: 'slot_redistribution', label: t('nav.slotRedistribution', 'Slot Redistribution'), icon: Shuffle, badge: 'Auto' },
          { id: 'gate_live_view', label: t('nav.gateLiveView', 'Gate CCTV Live View'), icon: Video, badge: 'Live Feed' },
          { id: 'analytics', label: t('nav.analytics', 'Analytics & Traffic'), icon: BarChart3, badge: 'Live' },
          { id: 'economic_impact', label: t('nav.economicImpact', 'Economic Impact'), icon: TrendingUp, badge: 'ROI' },
          { id: 'qr_scanner', label: t('nav.qrScanner', 'Gate QR Scanner'), icon: ScanLine, badge: 'Camera' },
          { id: 'daily_roster', label: t('nav.dailyRoster', 'Daily Queue Roster'), icon: Users, count: inYardCount },
          { id: 'inspection_form', label: t('nav.gradingWeighing', 'Grading & Weighing'), icon: Scale },
          { id: 'capacity_storage', label: t('nav.siloCapacity', 'Silo Capacity & Fleet'), icon: Warehouse },
        ];
      case 'transporter':
        const readyDispatches = dispatches.filter(d => d.status === 'ready' || d.status === 'in_transit').length;
        return [
          { id: 'cockpit', label: t('nav.cockpit', 'Driver Cockpit'), icon: LayoutDashboard },
          { id: 'route_optimizer', label: t('nav.routeOptimizer', 'Route Optimizer'), icon: Route, badge: 'Smart' },
          { id: 'active_dispatches', label: t('nav.activeDispatches', 'Ready Dispatches'), icon: Truck, count: readyDispatches },
          { id: 'trip_tracker', label: 'Route & Transit Map', icon: Navigation, badge: 'GPS' },
          { id: 'echallans', label: t('nav.echallan', 'E-Challan & Sign-Off'), icon: FileCheck },
        ];
      case 'local_buyer':
        const openLots = marketplaceLots.filter(l => l.status === 'open').length;
        return [
          { id: 'market_board', label: t('nav.marketBoard', 'Open Market Board'), icon: Store, count: openLots },
          { id: 'bidding_desk', label: t('nav.biddingDesk', 'Bidding Desk'), icon: Gavel },
          { id: 'quality_reports', label: 'Quality Lab Reports', icon: FileSpreadsheet },
          { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
        ];
      case 'kiosk':
        return [
          { id: 'scan_validate', label: t('nav.kioskScanner', 'Camera QR Validator'), icon: ScanLine, badge: 'Camera' },
          { id: 'assisted_booking', label: 'Assisted Slot Booking', icon: Users },
          { id: 'paper_slip', label: t('nav.paperSlip', 'Print & PDF Gate Pass'), icon: Printer, badge: 'PDF' },
          { id: 'ivr_simulator', label: t('nav.ivrSimulator', 'IVR Voice Simulator'), icon: PhoneCall, badge: '1800' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleHeader = () => {
    switch (activeRole) {
      case 'farmer':
        return {
          title: 'Kisan Kendra',
          roleTitle: 'Farmer Dashboard',
          sub: 'Direct Farmer Procurement Portal',
          color: 'text-emerald-400'
        };
      case 'officer':
        return {
          title: 'DoCA Command',
          roleTitle: 'Procurement Officer',
          sub: 'Physical Mandi Operations Center',
          color: 'text-amber-400'
        };
      case 'transporter':
        return {
          title: 'Transit Logistics',
          roleTitle: 'Fleet Contractor',
          sub: 'State Warehouse Transit Fleet',
          color: 'text-blue-400'
        };
      case 'local_buyer':
        return {
          title: 'Secondary Mandi',
          roleTitle: 'Licensed Merchant',
          sub: 'Open Grain Trading Exchange',
          color: 'text-orange-400'
        };
      case 'kiosk':
        return {
          title: 'Gram Panchayat',
          roleTitle: 'CSC Operator / Kiosk',
          sub: 'Assisted Non-Smart Services',
          color: 'text-purple-400'
        };
    }
  };

  const roleMeta = getRoleHeader();

  return (
    <aside className="w-64 shrink-0 bg-[#064E3B] text-white flex flex-col justify-between border-r border-emerald-950/60 shadow-lg min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        {/* Role Identity Card */}
        <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/50 mb-6">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">
            <span>Active Station</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            {roleMeta.roleTitle}
          </h2>
          <p className="text-[11px] text-emerald-200/80 mt-0.5">
            {roleMeta.sub}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm border border-emerald-600/60'
                    : 'text-emerald-100/90 hover:bg-emerald-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-300/70'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-700/70 text-emerald-200">
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100 text-emerald-300' : 'opacity-30'}`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-emerald-900/60 bg-emerald-950/40">
        <div className="flex items-center justify-between text-[11px] text-emerald-300/80 font-mono">
          <span>PORTAL ID: DOCA-2026</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Operational" />
        </div>
        <p className="text-[10px] text-emerald-400/60 mt-1">
          DoCA Automated Queue Engine
        </p>
      </div>
    </aside>
  );
};
