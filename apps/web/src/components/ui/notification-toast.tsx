'use client';

import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-slate-900/40 animate-slide-up border border-slate-700">
      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
      <button
        onClick={onClose}
        className="rounded-full p-1 text-slate-400 hover:text-white transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
