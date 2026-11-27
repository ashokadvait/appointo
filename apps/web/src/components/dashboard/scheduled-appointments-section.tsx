'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Booking, EventType, AvailableSlot } from '@calendly/types';
import { api } from '@/lib/api-client';
import { formatDate, formatTime, getRelativeTimeString } from '@/lib/utils';
import { useDialog } from '@/components/ui/dialog-provider';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  FileText,
  User,
  Mail,
  Globe,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ScheduledAppointmentsSectionProps {
  bookings: Booking[];
  eventTypes: EventType[];
  selectedEventTypeId?: string | null;
  onSelectEventType?: (id: string | null) => void;
  onRefresh: () => void;
  onNotify: (msg: string) => void;
  onNavigateToBooking?: (eventTypeId?: string) => void;
}

export const ScheduledAppointmentsSection: React.FC<ScheduledAppointmentsSectionProps> = ({
  bookings,
  eventTypes,
  selectedEventTypeId = null,
  onSelectEventType,
  onRefresh,
  onNotify,
  onNavigateToBooking,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();

  const [activeEventTypeFilter, setActiveEventTypeFilter] = useState<string | null>(selectedEventTypeId);
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLinkBookingId, setCopiedLinkBookingId] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  // Calendar & Future Slots State
  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);
  const [showCalendar, setShowCalendar] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => toLocalDateStr(new Date()));
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [loadingDaySlots, setLoadingDaySlots] = useState(false);
  const [userTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editStatus, setEditStatus] = useState('scheduled');
  const [savingEdit, setSavingEdit] = useState(false);

  // Sync external filter if parent passes it
  React.useEffect(() => {
    if (selectedEventTypeId !== undefined) {
      setActiveEventTypeFilter(selectedEventTypeId);
    }
  }, [selectedEventTypeId]);

  // Lookup map for event types
  const eventTypesMap = useMemo(() => {
    const map = new Map<string, EventType>();
    eventTypes.forEach((et) => map.set(et.id, et));
    return map;
  }, [eventTypes]);

  // Booking counts per event type
  const bookingCountByEventType = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      counts[b.eventTypeId] = (counts[b.eventTypeId] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Event type filter
      if (activeEventTypeFilter && b.eventTypeId !== activeEventTypeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.inviteeName.toLowerCase().includes(q);
        const matchesEmail = b.inviteeEmail.toLowerCase().includes(q);
        const matchesEventName = (b.eventTypeName || '').toLowerCase().includes(q);
        const matchesLocation = (b.location || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesEventName || matchesLocation;
      }
      return true;
    });
  }, [bookings, activeEventTypeFilter, statusFilter, searchQuery]);

  const handleCopyLink = (booking: Booking) => {
    if (!booking.location) return;
    navigator.clipboard.writeText(booking.location);
    setCopiedLinkBookingId(booking.id);
    onNotify(`Meeting link copied: ${booking.location}`);
    setTimeout(() => setCopiedLinkBookingId(null), 2000);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      showToast(`Appointment status updated to ${newStatus}`, 'success');
      onNotify(`Appointment status updated to ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Status Update Failed',
        message: err.message || 'Failed to update status',
        type: 'error',
      });
    }
  };

  const handleDeleteBooking = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: 'Cancel & Delete Appointment?',
      message: `Are you sure you want to cancel the scheduled meeting with ${name}? This will free up the time slot.`,
      confirmText: 'Delete Appointment',
      cancelText: 'Keep Appointment',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteBooking(id);
      showToast('Appointment cancelled and removed', 'success');
      onNotify('Appointment cancelled and removed');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Unable to delete appointment.',
        type: 'error',
      });
    }
  };

  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    setEditName(b.inviteeName);
    setEditEmail(b.inviteeEmail);
    setEditLocation(b.location || '');
    setEditStartTime(b.startTime ? new Date(b.startTime).toISOString().slice(0, 16) : '');
    setEditStatus(b.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
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
        updates.endTime = new Date(d.getTime() + (oldDurationMs > 0 ? oldDurationMs : 15 * 60 * 1000)).toISOString();
      }
      await api.updateBooking(editingBooking.id, updates);
      showToast(`Meeting with ${editName} updated successfully`, 'success');
      onNotify(`Meeting with ${editName} updated successfully`);
      setEditingBooking(null);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Update Failed',
        message: err.message || 'Failed to update meeting details',
        type: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleAnswers = (id: string) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Human-readable question label resolver
  const getQuestionLabel = (etId: string, qId: string) => {
    const et = eventTypesMap.get(etId);
    if (et && et.customQuestions) {
      const found = et.customQuestions.find((q) => q.id === qId);
      if (found) return found.label;
    }
    // Clean up generic IDs like "q-company" -> "Company"
    return qId.replace(/^q[-_]?/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const scheduledCount = bookings.filter((b) => b.status === 'scheduled').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  // Group bookings by local YYYY-MM-DD date string for calendar badges
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      if (activeEventTypeFilter && b.eventTypeId !== activeEventTypeFilter) return;
      const d = new Date(b.startTime);
      if (isNaN(d.getTime())) return;
      const key = toLocalDateStr(d);
      const list = map.get(key) || [];
      list.push(b);
      map.set(key, list);
    });
    return map;
  }, [bookings, activeEventTypeFilter]);

  const selectedDayBookings = useMemo(() => {
    return (bookingsByDate.get(selectedDateStr) || []).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [bookingsByDate, selectedDateStr]);

  // Fetch available future slots for the selected calendar date
  useEffect(() => {
    if (!showCalendar || !selectedDateStr) return;
    let mounted = true;
    setLoadingDaySlots(true);
    const targetEtId = activeEventTypeFilter || eventTypes[0]?.id || 'default';
    api
      .getAvailableSlots(targetEtId, selectedDateStr, userTimezone)
      .then((res) => {
        if (mounted) {
          setDaySlots(res.slots || []);
        }
      })
      .catch(() => {
        if (mounted) setDaySlots([]);
      })
      .finally(() => {
        if (mounted) setLoadingDaySlots(false);
      });
    return () => {
      mounted = false;
    };
  }, [showCalendar, selectedDateStr, activeEventTypeFilter, eventTypes, userTimezone, bookings]);

  // Calendar grid calculations
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const calFirstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calMonthLabel = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateDisplay = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  return (
    <div id="scheduled-appointments-section" className="space-y-6 pt-4 border-t border-slate-200/80">
      {/* Section Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Scheduled Appointments & Bookings
                </h2>
                <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  {bookings.length} {bookings.length === 1 ? 'Booking' : 'Total'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                All client reservations booked across your active event types, including intake responses and meeting links.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCalendar((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-2xs transition active:scale-95 ${
              showCalendar
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle calendar and future slots view"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{showCalendar ? 'Hide Calendar' : 'Calendar & Slots'}</span>
          </button>
          <button
            onClick={onRefresh}
            title="Refresh bookings from server"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          {onNavigateToBooking && (
            <button
              onClick={() => onNavigateToBooking(activeEventTypeFilter || undefined)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Calendar & Future Slots Panel */}
      {showCalendar && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
          {/* Left: Monthly Calendar Grid */}
          <div className="lg:col-span-5 lg:border-r lg:border-slate-100 lg:pr-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{calMonthLabel}</h3>
                <p className="text-[11px] text-slate-500">Pick any date to inspect bookings & future slots</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedDateStr(toLocalDateStr(now));
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calFirstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {Array.from({ length: calDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = dateKey === selectedDateStr;
                const isToday = dateKey === todayStr;
                const isPast = dateKey < todayStr;
                const dayBookingsList = bookingsByDate.get(dateKey) || [];
                const activeCount = dayBookingsList.filter((b) => b.status !== 'cancelled').length;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`relative flex flex-col items-center justify-center h-10 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : isToday
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        : isPast
                        ? 'text-slate-300 hover:bg-slate-50'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {activeCount > 0 && (
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                        title={`${activeCount} booked`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Has Bookings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Selected
                </span>
              </div>
              <span className="font-medium text-slate-400 truncate max-w-[140px]">{userTimezone}</span>
            </div>
          </div>

          {/* Right: Selected Day's Bookings & Future Open Slots */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{selectedDateDisplay}</h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedDayBookings.length} booked • {loadingDaySlots ? 'Checking slots...' : `${daySlots.length} open future slots`}
                  </p>
                </div>
                {onNavigateToBooking && (
                  <button
                    type="button"
                    onClick={() => onNavigateToBooking(activeEventTypeFilter || undefined)}
                    className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Book Slot</span>
                  </button>
                )}
              </div>

              {/* Booked on this day */}
              {selectedDayBookings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Booked Appointments ({selectedDayBookings.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedDayBookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-emerald-800 shrink-0">
                            {formatTime(b.startTime, b.inviteeTimezone)} – {formatTime(b.endTime, b.inviteeTimezone)}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">{b.inviteeName}</span>
                          {b.eventTypeName && (
                            <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                              {b.eventTypeName}
                            </span>
                          )}
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold capitalize text-emerald-700 shrink-0">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Future Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Available Future Slots
                  </span>
                  {!loadingDaySlots && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                    </span>
                  )}
                </div>

                {loadingDaySlots ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-xs text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span>Loading available slots...</span>
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-6 px-4 text-center text-xs text-slate-500">
                    {selectedDateStr < todayStr
                      ? 'Past date — select today or a future date to see open slots.'
                      : 'No open slots available on this date (outside working hours or fully booked).'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.timeUtc}
                        type="button"
                        onClick={() => onNavigateToBooking?.(activeEventTypeFilter || undefined)}
                        className="flex items-center justify-center gap-1 rounded-xl border border-blue-200/80 bg-blue-50/40 px-2.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
                        title={`Open slot at ${slot.timeFormatted} — click to book`}
                      >
                        <Clock className="h-3 w-3 shrink-0 opacity-70" />
                        <span>{slot.timeFormatted}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        {/* Row 1: Event Type Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Event Type:
          </span>
          <button
            onClick={() => {
              setActiveEventTypeFilter(null);
              onSelectEventType?.(null);
            }}
            className={`rounded-xl px-3 py-1.5 font-bold transition shrink-0 ${
              activeEventTypeFilter === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Event Types ({bookings.length})
          </button>
          {eventTypes.map((et) => {
            const count = bookingCountByEventType[et.id] || 0;
            const isSelected = activeEventTypeFilter === et.id;
            return (
              <button
                key={et.id}
                onClick={() => {
                  const next = isSelected ? null : et.id;
                  setActiveEventTypeFilter(next);
                  onSelectEventType?.(next);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 border ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: et.color || '#3b82f6' }}
                />
                <span className="truncate max-w-[140px]">{et.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Status Pills & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/60 self-start">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition ${
                statusFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition ${
                statusFilter === 'scheduled'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition ${
                statusFilter === 'completed'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition ${
                statusFilter === 'cancelled'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings List / Cards */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No appointments found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {bookings.length === 0
              ? 'You have not booked any appointments yet. Open the Booking Wizard or share your booking link to schedule one.'
              : 'No appointments match your active filter or search query. Try clearing filters.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {activeEventTypeFilter || statusFilter !== 'all' || searchQuery ? (
              <button
                onClick={() => {
                  setActiveEventTypeFilter(null);
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                Reset All Filters
              </button>
            ) : null}
            {onNavigateToBooking && (
              <button
                onClick={() => onNavigateToBooking(activeEventTypeFilter || undefined)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                Book An Appointment
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const et = eventTypesMap.get(b.eventTypeId);
            const etColor = et?.color || '#3b82f6';
            const hasAnswers = b.customAnswers && Object.keys(b.customAnswers).length > 0;
            const answersCount = hasAnswers ? Object.keys(b.customAnswers).length : 0;
            const isAnswersOpen = !!expandedAnswers[b.id];
            const isCopied = copiedLinkBookingId === b.id;

            return (
              <div
                key={b.id}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-slate-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Invitee & Meeting Details */}
                  <div className="space-y-3 min-w-0 flex-1">
                    {/* Invitee Header */}
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs"
                        style={{ backgroundColor: etColor }}
                      >
                        {b.inviteeName ? b.inviteeName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                            {b.inviteeName}
                          </h3>
                          <span className="text-xs text-slate-400">•</span>
                          <a
                            href={`mailto:${b.inviteeEmail}`}
                            className="text-xs text-slate-600 hover:text-blue-600 truncate transition font-medium"
                          >
                            {b.inviteeEmail}
                          </a>
                        </div>

                        {/* Event Type & Date Row */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
                          {/* Event Type Pill */}
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border"
                            style={{
                              backgroundColor: `${etColor}15`,
                              borderColor: `${etColor}40`,
                              color: etColor,
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: etColor }} />
                            {b.eventTypeName || et?.name || 'Meeting'}
                          </span>

                          <span className="text-slate-300">•</span>

                          {/* Date and Time */}
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {formatDate(b.startTime, b.inviteeTimezone)}
                          </span>

                          <span className="text-slate-300">•</span>

                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {formatTime(b.startTime, b.inviteeTimezone)} - {formatTime(b.endTime, b.inviteeTimezone)}
                          </span>

                          {b.inviteeTimezone && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              <Globe className="h-3 w-3" />
                              {b.inviteeTimezone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meeting Link Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-blue-50/70 border border-blue-200/60 px-3.5 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-700 shrink-0">Meeting Link:</span>
                        <span className="font-mono text-blue-700 truncate" title={b.location}>
                          {b.location || 'Location details provided upon request'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {b.location && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(b)}
                            title="Copy Meeting Link"
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 transition"
                          >
                            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                          </button>
                        )}
                        {b.location && b.location.startsWith('http') && (
                          <a
                            href={b.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition"
                          >
                            <span>Join Meeting</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Custom Intake Form Responses Display */}
                    {hasAnswers && (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleAnswers(b.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            <span>
                              Intake Form Responses ({answersCount} {answersCount === 1 ? 'question' : 'questions'})
                            </span>
                            {isAnswersOpen ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Custom Form
                          </span>
                        </div>

                        {/* Expanded Answers Grid */}
                        {isAnswersOpen && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60 animate-fade-in">
                            {Object.entries(b.customAnswers).map(([key, val]) => (
                              <div
                                key={key}
                                className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-2xs text-xs"
                              >
                                <span className="block font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                                  {getQuestionLabel(b.eventTypeId, key)}
                                </span>
                                <span className="mt-0.5 block font-semibold text-slate-800 break-words">
                                  {typeof val === 'string' ? val : JSON.stringify(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status & Action Buttons */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Status Selector */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={b.status}
                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition shadow-2xs focus:outline-hidden ${
                          b.status === 'scheduled'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : b.status === 'completed'
                            ? 'border-blue-300 bg-blue-50 text-blue-800'
                            : 'border-slate-300 bg-slate-100 text-slate-600'
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(b)}
                        title="Edit Meeting Details"
                        className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition active:scale-95"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      <a
                        href={`/api/bookings/${b.id}/ics`}
                        download
                        title="Download .ics Calendar File"
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(b.id, b.inviteeName)}
                        title="Cancel & Delete Appointment"
                        className="rounded-xl border border-red-200/60 bg-white p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition shadow-2xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Edit Scheduled Appointment</h3>
                <p className="text-xs text-slate-500">
                  Update meeting parameters for {editingBooking.eventTypeName || 'Appointment'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invitee Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invitee Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting Location / Video Link</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. https://meet.google.com/xyz"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingEdit ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

