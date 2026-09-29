import React, { useState } from 'react';
import { ProcurementProvider, useProcurement } from './context/ProcurementContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SmsNotificationDrawer } from './components/common/SmsNotificationDrawer';
import { AuthModal } from './components/common/AuthModal';
import { PresentationAssistant } from './components/common/PresentationAssistant';
import { UserRole } from './types/procurement';

import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { TransporterDashboard } from './components/transporter/TransporterDashboard';
import { LocalBuyerDashboard } from './components/localbuyer/LocalBuyerDashboard';
import { KioskDashboard } from './components/kiosk/KioskDashboard';

const MainLayout: React.FC = () => {
  const { activeRole, setActiveRole } = useProcurement();
  
  // Tab state per role
  const [farmerTab, setFarmerTab] = useState('overview');
  const [officerTab, setOfficerTab] = useState('yard_command');
  const [transporterTab, setTransporterTab] = useState('cockpit');
  const [localBuyerTab, setLocalBuyerTab] = useState('market_board');
  const [kioskTab, setKioskTab] = useState('assisted_booking');

  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Get active tab and updater for current role
  const getCurrentTab = () => {
    switch (activeRole) {
      case 'farmer': return farmerTab;
      case 'officer': return officerTab;
      case 'transporter': return transporterTab;
      case 'local_buyer': return localBuyerTab;
      case 'kiosk': return kioskTab;
    }
  };

  const handleSelectTab = (tab: string) => {
    switch (activeRole) {
      case 'farmer': setFarmerTab(tab); break;
      case 'officer': setOfficerTab(tab); break;
      case 'transporter': setTransporterTab(tab); break;
      case 'local_buyer': setLocalBuyerTab(tab); break;
      case 'kiosk': setKioskTab(tab); break;
    }
  };

  const handleAssistantSelectTab = (role: UserRole, tab?: string) => {
    setActiveRole(role);
    if (!tab) return;
    switch (role) {
      case 'farmer': setFarmerTab(tab); break;
      case 'officer': setOfficerTab(tab); break;
      case 'transporter': setTransporterTab(tab); break;
      case 'local_buyer': setLocalBuyerTab(tab); break;
      case 'kiosk': setKioskTab(tab); break;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans">
      {/* Global Top Navigation Bar with Demo Role Switcher */}
      <Header
        onOpenSms={() => setIsSmsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen(prev => !prev)}
        isAssistantOpen={isAssistantOpen}
      />

      {/* Main Workspace: Deep Emerald Sidebar + Dynamic Viewport */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={getCurrentTab()}
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[calc(100vw-16rem)]">
          {activeRole === 'farmer' && (
            <FarmerDashboard 
              currentTab={farmerTab} 
              onSelectTab={setFarmerTab} 
            />
          )}
          {activeRole === 'officer' && (
            <OfficerDashboard 
              currentTab={officerTab} 
              onSelectTab={setOfficerTab} 
              onSwitchRole={handleAssistantSelectTab}
            />
          )}
          {activeRole === 'transporter' && (
            <TransporterDashboard 
              currentTab={transporterTab} 
              onSelectTab={setTransporterTab} 
            />
          )}
          {activeRole === 'local_buyer' && (
            <LocalBuyerDashboard 
              currentTab={localBuyerTab} 
              onSelectTab={setLocalBuyerTab} 
            />
          )}
          {activeRole === 'kiosk' && (
            <KioskDashboard 
              currentTab={kioskTab} 
              onSelectTab={setKioskTab} 
            />
          )}
        </main>
      </div>

      {/* Interactive SMS Drawer */}
      <SmsNotificationDrawer
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
      />

      {/* Unified Multi-Role Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Video Presentation Recording Assistant */}
      <PresentationAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSelectTab={handleAssistantSelectTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ProcurementProvider>
        <MainLayout />
      </ProcurementProvider>
    </LanguageProvider>
  );
}
