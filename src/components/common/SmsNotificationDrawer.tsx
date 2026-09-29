import React from 'react';
import { X, Smartphone, CheckCheck, Trash2, BellRing } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';

interface SmsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsNotificationDrawer: React.FC<SmsDrawerProps> = ({ isOpen, onClose }) => {
  const { smsMessages, markSmsAsRead, unreadSmsCount } = useProcurement();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">
                  Farmer SMS Dispatch Inbox
                </h3>
                {unreadSmsCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                    {unreadSmsCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Direct phone notifications dispatched to farmer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => markSmsAsRead()}
              className="p-1.5 text-xs text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-200/60"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {smsMessages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400 text-center">
              <BellRing className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs font-medium">No SMS dispatches yet</p>
            </div>
          ) : (
            smsMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => markSmsAsRead(msg.id)}
                className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  msg.unread
                    ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                      {msg.senderHeader}
                    </span>
                    <span className="text-neutral-400">→</span>
                    <span className="font-mono text-neutral-600">
                      {msg.recipientPhone}
                    </span>
                  </div>
                  <span className="font-mono text-neutral-400 text-[10px]">
                    {msg.timestamp}
                  </span>
                </div>

                <p className="text-neutral-800 leading-relaxed font-sans">
                  {msg.text}
                </p>

                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-neutral-100 text-[10px] text-neutral-400">
                  <span className="capitalize">{msg.category.replace('_', ' ')}</span>
                  {msg.unread ? (
                    <span className="text-emerald-700 font-semibold">Unread</span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-400">
                      <CheckCheck className="w-3 h-3 text-neutral-400" /> Read
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer simulation tip */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-center">
          <p className="text-[11px] text-neutral-500">
            Simulates DoCA & Telecom Gateway (DLT Certified SMS)
          </p>
        </div>

      </div>
    </div>
  );
};
