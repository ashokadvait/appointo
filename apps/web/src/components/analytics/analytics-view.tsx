'use client';

import React from 'react';
import { AnalyticsOverview } from '@calendly/types';
import { BarChart3, TrendingUp, DollarSign, CalendarCheck, AlertTriangle, Users, Award } from 'lucide-react';

interface AnalyticsViewProps {
  analytics: AnalyticsOverview | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Analytics, Metrics & Reporting
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              Live BI Insights
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitor conversion rates, cancellation & no-show trends, revenue streams, and team consultant workloads.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <span className="mt-3 block text-3xl font-black text-slate-900">{analytics.totalBookings}</span>
          <span className="mt-1 block text-xs text-slate-500">All-time lifetime calls</span>
        </div>

        {/* Completion Rate */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <span className="mt-3 block text-3xl font-black text-emerald-600">{analytics.completionRate}%</span>
          <span className="mt-1 block text-xs text-slate-500">{analytics.completedBookings} successfully completed</span>
        </div>

        {/* Cancellation & No-Show */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">No-Show / Cancel</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <span className="mt-3 block text-3xl font-black text-slate-900">
            {analytics.cancellationRate}% / {analytics.noShowRate}%
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            {analytics.cancelledBookings} cancelled &bull; {analytics.noShowCount} no-shows
          </span>
        </div>

        {/* Total Revenue */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <span className="mt-3 block text-3xl font-black text-purple-600">
            ${analytics.totalRevenue.toFixed(2)}
          </span>
          <span className="mt-1 block text-xs text-slate-500">Paid strategy & review fees</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Popular Days Distribution */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Booking Volume by Day of Week
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.popularDays.map((d) => {
              const maxCount = Math.max(...analytics.popularDays.map((x) => x.count), 1);
              const percentage = Math.round((d.count / maxCount) * 100);

              return (
                <div key={d.dayName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{d.dayName}</span>
                    <span className="font-bold text-slate-900">{d.count} calls</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Event Types */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Top Performing Event Types
            </h3>
          </div>

          <div className="space-y-3">
            {analytics.topEventTypes.map((et) => (
              <div
                key={et.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{et.name}</h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {et.bookingsCount} scheduled appointments
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600">
                    ${et.revenue.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">
                    Revenue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Workload Distribution */}
      {analytics.teamWorkload && analytics.teamWorkload.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-4 w-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Team Member Appointment Distribution
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analytics.teamWorkload.map((m) => (
              <div
                key={m.userId}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-center gap-3"
              >
                <img
                  src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={m.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                  <span className="text-[11px] text-slate-500 block">
                    {m.totalMeetings} total &bull; {m.completedMeetings} completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
