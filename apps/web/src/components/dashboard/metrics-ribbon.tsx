'use client';

import React from 'react';
import { CalendarCheck2, BellRing, Sparkles, TrendingUp } from 'lucide-react';

interface MetricsRibbonProps {
  activeCount: number;
  remindersCount: number;
  followupsCount: number;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({
  activeCount,
  remindersCount,
  followupsCount,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Active Bookings */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-xs transition hover:shadow-md hover:border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Bookings
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600">
            <CalendarCheck2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">{activeCount}</span>
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            <TrendingUp className="h-3 w-3 mr-0.5 inline" /> 100% scheduled
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Upcoming client syncs with buffer protections</p>
      </div>

      {/* Reminders Dispatched */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-xs transition hover:shadow-md hover:border-indigo-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Automated Notices
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100/70 text-indigo-600">
            <BellRing className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">{remindersCount}</span>
          <span className="text-xs font-semibold text-indigo-600">24h & 1h alerts</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Instant confirmations & zero no-show safeguard</p>
      </div>

      {/* Follow-Ups Sent */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-xs transition hover:shadow-md hover:border-emerald-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Follow-Ups Completed
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-600">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">{followupsCount}</span>
          <span className="text-xs font-semibold text-emerald-600">Automated post-call</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Summary notes & survey links sent automatically</p>
      </div>
    </div>
  );
};
