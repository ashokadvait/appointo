'use client';

import React, { useState } from 'react';
import { Booking, ActivityLog } from '@calendly/types';
import { api } from '@/lib/api-client';
import {
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  User,
  Activity,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Video,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate, formatTime, getRelativeTimeString } from '@/lib/utils';
import { useDialog } from '@/components/ui/dialog-provider';

interface FollowUpCommandCenterProps {
  bookings: Booking[];
  logs: ActivityLog[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
}

export const FollowUpCommandCenter: React.FC<FollowUpCommandCenterProps> = ({
  bookings,
  logs,
  onRefresh,
  onNotify,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Booking Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editStatus, setEditStatus] = useState('scheduled');
  const [savingEdit, setSavingEdit] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleDispatchFollowUp = async (bookingId: string, stageType: string) => {
    setActionLoading(`${bookingId}-${stageType}`);
    try {
      await api.dispatchFollowUp(bookingId, stageType);
      showToast(`Follow-up alert (${stageType}) successfully dispatched!`, 'success');
      onNotify(`Follow-up alert (${stageType}) successfully dispatched!`);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Dispatch Failed',
        message: err.message || 'Failed to dispatch follow-up notification.',
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      showToast(`Booking status changed to ${newStatus}`, 'info');
      onNotify(`Booking status changed to ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Status Update Failed',
        message: err.message || 'Failed to update status',
        type: 'error',
      });
    }
  };

  const handleOpenEditBooking = (b: Booking) => {
    setEditingBooking(b);
    setEditName(b.inviteeName);
    setEditEmail(b.inviteeEmail);
    setEditLocation(b.location || '');
    setEditStartTime(b.startTime ? new Date(b.startTime).toISOString().slice(0, 16) : '');
    setEditStatus(b.status);
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSavingEdit(true);
    try {
      const updates: Partial<Booking> = {
        inviteeName: editName,
        inviteeEmail: editEmail,
        location: editLocation,
        status: editStatus as any,
      };
      if (editStartTime) {
        const d = new Date(editStartTime);
        updates.startTime = d.toISOString();
        const oldDurationMs =
          new Date(editingBooking.endTime).getTime() - new Date(editingBooking.startTime).getTime();
        updates.endTime = new Date(d.getTime() + (oldDurationMs > 0 ? oldDurationMs : 30 * 60 * 1000)).toISOString();
      }
      await api.updateBooking(editingBooking.id, updates);
      showToast(`Meeting with ${editName} updated successfully`, 'success');
      onNotify(`Meeting with ${editName} updated successfully`);
      setEditingBooking(null);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Meeting Update Failed',
        message: err.message || 'Failed to update meeting',
        type: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Scheduled Booking?',
      message: 'Are you sure you want to permanently delete this scheduled appointment? All associated automated follow-ups and notifications will also be removed.',
      confirmText: 'Delete Booking',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteBooking(id);
      showToast('Booking removed successfully', 'success');
      onNotify('Booking removed successfully');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Failed to Delete Booking',
        message: err.message || 'Unable to delete booking.',
        type: 'error',
      });
    }
  };

  const getStageStatus = (booking: Booking, type: string) => {
    return booking.followUps?.find((f) => f.type === type);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Automated Follow-Up Command Center
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Active Pipeline
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitor the 4-stage lifecycle for all meetings. Trigger on-demand notices, edit meeting details, or automate post-call follow-ups.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bookings Table Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Bookings ({filteredBookings.length})
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                4-Stage Pipeline Tracker
              </span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No bookings found matching filter &quot;{filter}&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const conf = getStageStatus(b, 'confirmation');
                  const r24 = getStageStatus(b, 'reminder_24h');
                  const r1h = getStageStatus(b, 'reminder_1h');
                  const post = getStageStatus(b, 'followup_post');

                  return (
                    <div key={b.id} className="p-6 transition hover:bg-slate-50/40 space-y-4">
                      {/* Invitee & Time row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{b.inviteeName}</span>
                            <span className="text-xs text-slate-400">&bull;</span>
                            <span className="text-xs text-slate-500">{b.inviteeEmail}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1 text-blue-600 font-bold">
                              <Calendar className="h-3.5 w-3.5" />
                              {b.eventTypeName}
                            </span>
                            <span>&bull;</span>
                            <span>{formatDate(b.startTime, b.inviteeTimezone)}</span>
                            <span>&bull;</span>
                            <span>{formatTime(b.startTime, b.inviteeTimezone)}</span>
                          </div>
                        </div>

                        {/* Status badge & action buttons */}
                        <div className="flex items-center gap-2">
                          <select
                            value={b.status}
                            onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold capitalize transition ${
                              b.status === 'scheduled'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : b.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          {/* Explicit Edit Meeting Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditBooking(b)}
                            title="Edit Meeting Details"
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <a
                            href={`/api/bookings/${b.id}/ics`}
                            download
                            title="Download .ics calendar"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          >
                            <Download className="h-4 w-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b.id)}
                            title="Delete / Cancel Meeting"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent Meeting Link Box */}
                      <div className="flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-200/70 px-3.5 py-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Video className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-700 shrink-0">Meeting Link:</span>
                          <span className="font-mono text-blue-700 truncate" title={b.location}>
                            {b.location || 'Location provided upon request'}
                          </span>
                        </div>
                        {b.location && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(b.location);
                                onNotify(`Meeting link copied: ${b.location}`);
                              }}
                              className="rounded-md p-1 text-blue-600 hover:bg-blue-100 transition"
                              title="Copy meeting link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {b.location.startsWith('http') && (
                              <a
                                href={b.location}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md p-1 text-blue-600 hover:bg-blue-100 transition"
                                title="Open meeting room"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 4-Stage Follow-Up Progress Tracker */}
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Automated Lifecycle Pipeline
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* 1. Confirmation */}
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700">1. Confirm</span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                              Sent automatically
                            </span>
                          </div>

                          {/* 2. 24h Notice */}
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700">2. 24h Notice</span>
                              {r24?.status === 'sent' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            {r24?.status === 'sent' ? (
                              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                                Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDispatchFollowUp(b.id, 'reminder_24h')}
                                disabled={actionLoading === `${b.id}-reminder_24h`}
                                className="mt-1 flex items-center justify-center gap-1 rounded bg-blue-50 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Dispatch</span>
                              </button>
                            )}
                          </div>

                          {/* 3. 1h Urgent Notice */}
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700">3. 1h Call</span>
                              {r1h?.status === 'sent' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            {r1h?.status === 'sent' ? (
                              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                                Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDispatchFollowUp(b.id, 'reminder_1h')}
                                disabled={actionLoading === `${b.id}-reminder_1h`}
                                className="mt-1 flex items-center justify-center gap-1 rounded bg-blue-50 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Dispatch</span>
                              </button>
                            )}
                          </div>

                          {/* 4. Post-Meeting Action Items */}
                          <div className="rounded-lg bg-white p-2 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700">4. Post-Call</span>
                              {post?.status === 'sent' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            {post?.status === 'sent' ? (
                              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                                Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDispatchFollowUp(b.id, 'followup_post')}
                                disabled={actionLoading === `${b.id}-followup_post`}
                                className="mt-1 flex items-center justify-center gap-1 rounded bg-blue-50 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Send className="h-2.5 w-2.5" />
                                <span>Send Followup</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Automation Activity
              </h3>
            </div>

            <div className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs space-y-1 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-blue-600">
                      {log.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">{getRelativeTimeString(log.timestamp)}</span>
                  </div>
                  <p className="font-medium text-slate-800 leading-snug">{log.description}</p>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    To: {log.recipient}
                  </span>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No automated logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingBooking(null)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100 z-10 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Edit Scheduled Meeting
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {editingBooking.eventTypeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Invitee Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Invitee Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meeting Date & Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meeting Link / Location
                </label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Booking Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Update Meeting Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
