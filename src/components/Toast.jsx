import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, message: propMessage, type: propType = 'success', onClose }) {
  const message = toast?.message ?? propMessage;
  const type = toast?.type ?? propType;

  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200" role="status" aria-live="polite">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium ${
        type === 'success'
          ? 'bg-[#123D32] text-white border-emerald-500/40'
          : type === 'error'
          ? 'bg-red-900 text-white border-red-700'
          : type === 'warning'
          ? 'bg-amber-900 text-white border-amber-600'
          : 'bg-[#176B50] text-white border-emerald-400'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
        ) : type === 'warning' ? (
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-emerald-200 shrink-0" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white ml-2 p-0.5"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
