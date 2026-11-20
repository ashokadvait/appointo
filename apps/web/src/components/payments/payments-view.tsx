'use client';

import React, { useState } from 'react';
import { Payment } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import { CreditCard, DollarSign, CheckCircle2, RotateCcw, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PaymentsViewProps {
  payments: Payment[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  onRefresh,
  onNotify,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();
  const [loadingRefund, setLoadingRefund] = useState<string | null>(null);

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleRefund = async (paymentId: string) => {
    const confirmed = await showConfirm({
      title: 'Refund Payment?',
      message: 'Are you sure you want to process a full refund for this booking payment? This action cannot be reversed.',
      confirmText: 'Process Refund',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    setLoadingRefund(paymentId);
    try {
      await api.refundPayment(paymentId);
      showToast('Payment refunded successfully', 'success');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Refund Failed',
        message: err.message || 'Refund failed',
        type: 'error',
      });
    } finally {
      setLoadingRefund(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Payments, Deposits & Billing
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Stripe Simulation
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Accept payments for paid consultations and strategy reviews with automated booking confirmation.
          </p>
        </div>

        {/* Revenue Ribbon */}
        <div className="rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 px-6 py-3 text-white shadow-md shadow-emerald-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
            Total Revenue Collected
          </span>
          <span className="text-2xl font-black tracking-tight">
            ${totalRevenue.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Transaction Ledger ({payments.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Provider: Stripe Checkout
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No payments recorded yet. Paid event types will appear here upon booking.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      ${p.amount.toFixed(2)} {p.currency}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'refunded'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-500 mt-1">
                    Customer: <span className="font-medium text-slate-700">{p.customerEmail}</span> &bull; {formatDate(p.createdAt)}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-400">
                    TxID: {p.transactionId || p.id}
                  </span>
                </div>

                {p.status === 'paid' && (
                  <button
                    onClick={() => handleRefund(p.id)}
                    disabled={loadingRefund === p.id}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                    <span>{loadingRefund === p.id ? 'Refunding...' : 'Issue Refund'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
