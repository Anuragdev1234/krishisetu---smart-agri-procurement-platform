import React, { useState } from 'react';
import { X, Smartphone, Shield, KeyRound, Building2, Truck, Store, CheckCircle2 } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { UserRole } from '../../types/procurement';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setActiveRole } = useProcurement();
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  
  // Farmer OTP flow state
  const [farmerPhone, setFarmerPhone] = useState('98765 43210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  // Official / Officer flow
  const [officerEmpId, setOfficerEmpId] = useState('DOCA-OFF-8812');
  const [officerPassword, setOfficerPassword] = useState('••••••••');

  // Transporter flow
  const [fleetId, setFleetId] = useState('TRN-DL-4410');
  
  // Local Buyer flow
  const [buyerGstin, setBuyerGstin] = useState('06AAACG1928K1Z2');
  const [tradeLicense, setTradeLicense] = useState('APMC-LIC-2026-904');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (!farmerPhone) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setOtpValue('4921'); // Pre-fill mock OTP for smooth demo
    }, 400);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setActiveRole(selectedRole);
        setSuccess(false);
        onClose();
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 bg-emerald-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-emerald-800/80 text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>National Agri-Procurement Gateway</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Unified Portal Authentication
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Department of Consumer Affairs & Food Corporation of India
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div className="p-6">
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
            Select Your Role Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setSelectedRole('farmer'); setOtpSent(false); }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedRole === 'farmer'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <div className="text-lg mb-1">🧑🌾</div>
              <div className="text-xs font-bold leading-tight">Farmer</div>
              <div className="text-[10px] text-neutral-500">Phone OTP</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('officer')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedRole === 'officer'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Building2 className="w-5 h-5 text-emerald-700 mb-1" />
              <div className="text-xs font-bold leading-tight">Officer</div>
              <div className="text-[10px] text-neutral-500">Govt ID</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('transporter')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedRole === 'transporter'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Truck className="w-5 h-5 text-blue-700 mb-1" />
              <div className="text-xs font-bold leading-tight">Transporter</div>
              <div className="text-[10px] text-neutral-500">Fleet Code</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('local_buyer')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedRole === 'local_buyer'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Store className="w-5 h-5 text-amber-700 mb-1" />
              <div className="text-xs font-bold leading-tight">Local Buyer</div>
              <div className="text-[10px] text-neutral-500">GSTIN / APMC</div>
            </button>
          </div>

          {/* Dynamic Login Form */}
          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce mb-3" />
              <h3 className="text-base font-bold text-neutral-900">
                Authentication Successful
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Redirecting to {selectedRole.toUpperCase()} command dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Farmer OTP Mode */}
              {selectedRole === 'farmer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Kisan Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-mono text-neutral-700">
                        +91
                      </div>
                      <input
                        type="tel"
                        value={farmerPhone}
                        onChange={(e) => setFarmerPhone(e.target.value)}
                        placeholder="10 digit mobile number"
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        required
                      />
                      {!otpSent && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                        >
                          Send OTP
                        </button>
                      )}
                    </div>
                  </div>

                  {otpSent && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between text-xs text-emerald-900 mb-1.5">
                        <span className="font-semibold">Enter 4-Digit OTP Code</span>
                        <span className="font-mono text-emerald-700 text-[11px]">Demo OTP: 4921</span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        placeholder="• • • •"
                        className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Officer Official Login */}
              {selectedRole === 'officer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Government Employee ID / APMC Officer Code
                    </label>
                    <input
                      type="text"
                      value={officerEmpId}
                      onChange={(e) => setOfficerEmpId(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Govt Security PIN / Password
                    </label>
                    <input
                      type="password"
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Transporter Fleet Login */}
              {selectedRole === 'transporter' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Fleet Operator / Vehicle Registration
                    </label>
                    <input
                      type="text"
                      value={fleetId}
                      onChange={(e) => setFleetId(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-900">Contractor Note:</span> Real-time GPS and e-Challan telemetry will sync automatically upon check-in.
                  </div>
                </div>
              )}

              {/* Local Buyer GSTIN / Trade License Login */}
              {selectedRole === 'local_buyer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Merchant GSTIN
                    </label>
                    <input
                      type="text"
                      value={buyerGstin}
                      onChange={(e) => setBuyerGstin(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      APMC Trader License Number
                    </label>
                    <input
                      type="text"
                      value={tradeLicense}
                      onChange={(e) => setTradeLicense(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (selectedRole === 'farmer' && !otpSent)}
                  className="w-full py-2.5 px-4 bg-emerald-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : `Enter ${selectedRole.replace('_', ' ').toUpperCase()} Dashboard`}
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-neutral-200 text-center">
            <span className="text-[11px] text-neutral-400">
              💡 Tip: In this live demo, you can also switch roles anytime using the top bar buttons.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
