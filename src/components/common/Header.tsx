import React from 'react';
import { 
  Building2, 
  Truck, 
  Store, 
  Smartphone, 
  Volume2, 
  VolumeX, 
  Bell, 
  MapPin, 
  RotateCcw,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types/procurement';
import { LanguageToggle } from './LanguageToggle';

interface HeaderProps {
  onOpenSms: () => void;
  onOpenAuth: () => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenSms, 
  onOpenAuth,
  onToggleAssistant,
  isAssistantOpen 
}) => {
  const { 
    activeRole, 
    setActiveRole, 
    selectedCenter, 
    setSelectedCenter, 
    centers, 
    unreadSmsCount,
    audioEnabled,
    toggleAudio,
    resetDemoData
  } = useProcurement();

  const { t } = useLanguage();

  const roleConfigs: { role: UserRole; label: string; icon: React.ReactNode; sublabel: string }[] = [
    { role: 'farmer', label: t('role.farmer', 'Farmer'), icon: <span className="text-base">🧑🌾</span>, sublabel: t('role.farmer.sub', 'Kisan Portal') },
    { role: 'officer', label: t('role.officer', 'Officer'), icon: <Building2 className="w-4 h-4 text-emerald-600" />, sublabel: t('role.officer.sub', 'DoCA Command') },
    { role: 'transporter', label: t('role.transporter', 'Transporter'), icon: <Truck className="w-4 h-4 text-blue-600" />, sublabel: t('role.transporter.sub', 'Fleet & Dispatch') },
    { role: 'local_buyer', label: t('role.buyer', 'Local Buyer'), icon: <Store className="w-4 h-4 text-amber-600" />, sublabel: t('role.buyer.sub', 'Secondary Market') },
    { role: 'kiosk', label: t('role.kiosk', 'CSC Kiosk'), icon: <Smartphone className="w-4 h-4 text-purple-600" />, sublabel: t('role.kiosk.sub', 'Offline Inclusivity') },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🌾
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-neutral-900">
                {t('brand.title', 'KrishiSetu')}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {t('brand.subtitle', 'DoCA & FCI')}
              </span>
            </div>
          </div>

          {/* Zone 2: Demo Role Switcher Segmented Control */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-x-auto max-w-2xl">
            {roleConfigs.map((item) => {
              const isActive = activeRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => setActiveRole(item.role)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-emerald-900 text-white shadow-sm' 
                      : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                  title={`Switch view to ${item.label} (${item.sublabel})`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Zone 3: Actions, Language Toggle & Mandi Selector */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector Toggle */}
            <LanguageToggle />

            {/* Procurement Center Selector */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                value={selectedCenter.id}
                onChange={(e) => {
                  const target = centers.find(c => c.id === e.target.value);
                  if (target) setSelectedCenter(target);
                }}
                className="bg-transparent font-medium text-neutral-900 focus:outline-none cursor-pointer max-w-[170px] truncate"
              >
                {centers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Gate Chime Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg border transition-colors ${
                audioEnabled 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
              }`}
              title={audioEnabled ? 'Gate audio chimes enabled' : 'Gate audio chimes muted'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* SMS Notifications Drawer Button */}
            <button
              onClick={onOpenSms}
              className="relative p-2 rounded-lg bg-neutral-50 text-neutral-700 border border-neutral-200 hover:bg-neutral-100 transition-colors"
              title="Farmer SMS Notifications simulation"
            >
              <Bell className="w-4 h-4" />
              {unreadSmsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {unreadSmsCount}
                </span>
              )}
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={resetDemoData}
              className="hidden md:flex p-2 rounded-lg bg-neutral-50 text-neutral-600 border border-neutral-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Reset simulation data to default demo state"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Demo Video Walkthrough Guide */}
            {onToggleAssistant && (
              <button
                onClick={onToggleAssistant}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  isAssistantOpen
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
                title="Open Video Presentation Recording Script & Walkthrough Assistant"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('header.demoScript', 'Demo Script')}</span>
              </button>
            )}

            {/* Unified Auth Button */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors whitespace-nowrap shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t('header.login', 'Login Portal')}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
