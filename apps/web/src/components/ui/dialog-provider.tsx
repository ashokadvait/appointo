'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  X,
  HelpCircle,
} from 'lucide-react';

export type DialogType = 'info' | 'warning' | 'error' | 'success';

export interface AlertOptions {
  title?: string;
  message: string | ReactNode;
  type?: DialogType;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  icon?: 'trash' | 'question' | 'alert';
}

interface DialogContextValue {
  showAlert: (options: AlertOptions | string) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return ctx;
}

interface AlertState extends AlertOptions {
  resolve: () => void;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        setAlertState({
          message: options,
          title: 'Notice',
          type: 'info',
          confirmText: 'OK',
          resolve,
        });
      } else {
        setAlertState({
          title: options.title || 'Notice',
          message: options.message,
          type: options.type || 'info',
          confirmText: options.confirmText || 'OK',
          resolve,
        });
      }
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || 'Please Confirm',
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'primary',
        icon: options.icon || (options.variant === 'danger' ? 'trash' : 'question'),
        resolve,
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const closeAlert = () => {
    if (alertState) {
      alertState.resolve();
      setAlertState(null);
    }
  };

  const closeConfirm = (confirmed: boolean) => {
    if (confirmState) {
      confirmState.resolve(confirmed);
      setConfirmState(null);
    }
  };

  const renderAlertIcon = (type?: DialogType) => {
    switch (type) {
      case 'error':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-4 ring-red-50">
            <AlertCircle className="h-6 w-6 stroke-[2.2]" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-4 ring-amber-50">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>
        );
      case 'success':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
            <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
          </div>
        );
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 ring-4 ring-blue-50">
            <Info className="h-6 w-6 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}

      {/* ALERT POPUP MODAL */}
      {alertState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={closeAlert}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {renderAlertIcon(alertState.type)}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {alertState.title}
                </h3>
                <div className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {alertState.message}
                </div>
              </div>
              <button
                type="button"
                onClick={closeAlert}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={closeAlert}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                  alertState.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : alertState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : alertState.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {alertState.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL */}
      {confirmState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-4 ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-100 text-red-600 ring-red-50'
                    : 'bg-blue-100 text-blue-600 ring-blue-50'
                }`}
              >
                {confirmState.variant === 'danger' ? (
                  <Trash2 className="h-6 w-6 stroke-[2.2]" />
                ) : (
                  <HelpCircle className="h-6 w-6 stroke-[2.2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {confirmState.title}
                </h3>
                <div className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {confirmState.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOASTS NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-3.5 shadow-xl transition-all animate-fade-in"
          >
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <span className="flex-1 text-xs font-semibold text-slate-800 leading-snug">
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
};
