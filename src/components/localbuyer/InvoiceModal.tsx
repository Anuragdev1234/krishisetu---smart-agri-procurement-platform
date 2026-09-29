import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle2, FileText } from 'lucide-react';
import { MarketplaceLot } from '../../types/procurement';

interface InvoiceModalProps {
  lot: MarketplaceLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ lot, isOpen, onClose }) => {
  if (!isOpen || !lot) return null;

  const rate = lot.highestBidPerQtl || lot.askingPricePerQtl;
  const subtotal = lot.quantityQtl * rate;
  const mandiCess = Math.round(subtotal * 0.015); // 1.5%
  const marketFee = Math.round(subtotal * 0.005); // 0.5%
  const totalAmount = subtotal + mandiCess + marketFee;
  const invoiceNumber = `INV-APMC-${lot.id.replace('LOT-', '')}-2026`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden print-container">
        
        {/* Header (Hidden on print) */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <FileText className="w-4 h-4" />
            <span>APMC Commercial Tax Invoice & Gate Pass</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div className="p-6 sm:p-8 bg-white text-neutral-900 font-sans text-xs space-y-5">
          
          {/* Official Mandi Header */}
          <div className="border-b-2 border-neutral-950 pb-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
              Haryana State Agricultural Marketing Board (HSAMB) · APMC Karnal
            </span>
            <h1 className="text-lg font-extrabold uppercase tracking-tight text-neutral-900 mt-1">
              Commercial Grain Purchase Tax Invoice (Form 6)
            </h1>
            <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-neutral-500 mt-1">
              <span>Invoice: <strong>{invoiceNumber}</strong></span>
              <span>·</span>
              <span>Date: 29-Sep-2026</span>
              <span>·</span>
              <span>GST Exemption: Sec 11 (Raw Agri Produce)</span>
            </div>
          </div>

          {/* Consignor & Consignee Columns */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                Seller / Consignor (Farmer)
              </span>
              <p className="font-bold text-neutral-900">{lot.farmerName}</p>
              <p className="text-neutral-600">Mandi: {lot.centerName}</p>
              <p className="font-mono text-neutral-500 text-[11px]">{lot.farmerPhone}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                Buyer / Consignee (Licensed Merchant)
              </span>
              <p className="font-bold text-neutral-900">{lot.highestBidder || 'Garg Roller Flour Mills Ltd'}</p>
              <p className="font-mono text-neutral-600">GSTIN: 06AAACG1928K1Z2</p>
              <p className="text-neutral-500 text-[11px]">APMC Trader License: APMC-KRN-TR-4401</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-neutral-100 text-neutral-700 text-[10px] uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-right">Quantity</th>
                  <th className="py-2 px-3 text-right">Rate / Qtl</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-neutral-900 block">{lot.cropName}</span>
                    <span className="text-[10px] text-neutral-500">
                      Moisture: {lot.moisturePercent}% · Purity: 97.4% · Certified Commercial Grade
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {lot.quantityQtl} Qtl
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    ₹{rate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Breakdown & Mandi Cess */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 font-mono">
            <div className="flex justify-between text-neutral-600 font-sans">
              <span>Gross Produce Value:</span>
              <span className="font-mono font-bold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600 font-sans">
              <span>APMC Mandi Development Cess (1.5%):</span>
              <span className="font-mono text-neutral-800">₹{mandiCess.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-600 font-sans">
              <span>Krishi Kalyan Market Fee (0.5%):</span>
              <span className="font-mono text-neutral-800">₹{marketFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex justify-between font-sans text-sm font-extrabold text-neutral-950">
              <span>Total Payable to Mandi Escrow:</span>
              <span className="font-mono text-emerald-950">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Escrow Status */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="font-bold text-emerald-950 block">Payment Disbursed to Farmer</span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Ref: NEFT-SBIN-MNDI-9921820 · Direct Credited to Farmer A/C
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-xs">PAID</span>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500">
            <div>
              <p>Mandi Board Authorized Officer</p>
              <p className="font-mono">e-NAM / HSAMB Gateway</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-neutral-900">Garg Roller Flour Mills</p>
              <p>Buyer Digital Stamp</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
