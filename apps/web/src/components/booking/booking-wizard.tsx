'use client';

import React, { useState, useEffect } from 'react';
import { EventType, HostProfile, AvailableSlot, Booking, AvailabilitySchedule, CustomBookingForm, IntakeQuestion } from '@calendly/types';
import { api } from '@/lib/api-client';
import {
  Clock,
  Video,
  Globe,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  CalendarPlus,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  Ban,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDialog } from '@/components/ui/dialog-provider';

interface BookingWizardProps {
  eventTypes: EventType[];
  host: any;
  schedules?: AvailabilitySchedule[];
  selectedEventTypeId?: string;
  selectedFormId?: string;
  selectedDuration?: number;
  connectedCalendar?: string;
  isPublicView?: boolean;
  existingBookings?: Booking[];
  onBookingCreated?: (booking: Booking) => void;
  onEditEventType?: (eventType: EventType) => void;
  onDeleteEventType?: (id: string) => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - Asia/Kolkata (UTC+5:30)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada) - EST (UTC-5/UTC-4)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada) - CST (UTC-6/UTC-5)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada) - MST (UTC-7/UTC-6)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) - PST (UTC-8/UTC-7)' },
  { value: 'Europe/London', label: 'London, Dublin, Lisbon - GMT/BST (UTC+0/UTC+1)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome, Madrid - CET (UTC+1/UTC+2)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time - GST (UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong - SGT/HKT (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka, Seoul - JST/KST (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne - AEST (UTC+10/UTC+11)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({
  eventTypes,
  host,
  schedules = [],
  selectedEventTypeId,
  selectedFormId,
  selectedDuration,
  connectedCalendar,
  isPublicView = false,
  existingBookings = [],
  onBookingCreated,
  onEditEventType,
  onDeleteEventType,
}) => {
  const { showAlert, showConfirm, showToast } = useDialog();
  const [currentEventType, setCurrentEventType] = useState<EventType | null>(null);

  const handleDeleteCurrentMeeting = async () => {
    if (!currentEventType) return;
    const confirmed = await showConfirm({
      title: 'Delete Meeting?',
      message: `Are you sure you want to permanently delete "${currentEventType.name}"? This will cancel any scheduled sessions for this event.`,
      confirmText: 'Delete Meeting',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.deleteEventType(currentEventType.id);
      showToast('Meeting deleted successfully', 'success');
      if (onDeleteEventType) {
        onDeleteEventType(currentEventType.id);
      }
    } catch (err: any) {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Failed to delete meeting',
        type: 'error',
      });
    }
  };

  // Auto-detect invitee's local browser timezone or read from URL param
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlTz = sp.get('timezone');
      if (urlTz) return urlTz;
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) return detected;
      } catch {}
    }
    return host?.timezone || 'Asia/Kolkata';
  });

  const [meetCopied, setMeetCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Schedules State with fallback to API
  const [internalSchedules, setInternalSchedules] = useState<AvailabilitySchedule[]>(schedules || []);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      setInternalSchedules(schedules);
    } else {
      api.getSchedules().then((sch) => {
        if (sch && sch.length > 0) setInternalSchedules(sch);
      }).catch(() => {});
    }
  }, [schedules]);

  // Custom Organization Forms
  const [customForms, setCustomForms] = useState<CustomBookingForm[]>([]);
  useEffect(() => {
    api.getCustomForms().then(setCustomForms).catch(() => {});
  }, []);

  const [activeFormId, setActiveFormId] = useState<string | undefined>(selectedFormId);

  useEffect(() => {
    if (selectedFormId) {
      setActiveFormId(selectedFormId);
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const formParam = sp.get('form') || sp.get('formId');
      if (formParam) setActiveFormId(formParam);
    }
  }, [selectedFormId]);

  const activeForm = React.useMemo(() => {
    if (!activeFormId || customForms.length === 0) return null;
    return (
      customForms.find((f) => f.id === activeFormId) ||
      customForms.find(
        (f) =>
          f.title &&
          f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeFormId.toLowerCase()
      ) ||
      null
    );
  }, [activeFormId, customForms]);

  // Read duration and calendar parameters from props or URL
  const [overrideDuration, setOverrideDuration] = useState<number | undefined>(selectedDuration);
  const [targetCalendar, setTargetCalendar] = useState<string | undefined>(connectedCalendar);

  useEffect(() => {
    if (selectedDuration) {
      setOverrideDuration(selectedDuration);
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const d = sp.get('duration') || sp.get('slotDuration');
      if (d && Number(d) > 0) setOverrideDuration(Number(d));
    }
    if (connectedCalendar) {
      setTargetCalendar(connectedCalendar);
    } else if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const cal = sp.get('calendar') || sp.get('cal');
      if (cal) setTargetCalendar(cal);
    }
  }, [selectedDuration, connectedCalendar]);

  // Active Availability Schedule & Meeting Slot Duration
  const allSchedules = (internalSchedules.length > 0 ? internalSchedules : schedules) || [];
  const activeSchedule = allSchedules.find((s) => s.isDefault) || allSchedules[0] || null;
  // An explicitly requested slot duration (from Availability tab link or query param) overrides defaults!
  const slotDuration = overrideDuration || ((currentEventType && Number(currentEventType.duration) > 0)
    ? Number(currentEventType.duration)
    : (activeSchedule?.defaultSlotDuration || host?.defaultSlotDuration || 15));

  const eventDisplayName = activeForm
    ? activeForm.title
    : (currentEventType?.name || 'Meeting Details');

  // Slots State
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);

  // Form State
  const [step, setStep] = useState<'datetime' | 'form' | 'confirmed'>('datetime');
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const activeQuestions: IntakeQuestion[] = React.useMemo(() => {
    // 1. If an active form is selected via link/prop, its fields are authoritative!
    if (activeForm && activeForm.fields && activeForm.fields.length > 0) {
      return activeForm.fields;
    }
    // 2. If event type has its own custom questions defined
    if (currentEventType?.customQuestions && currentEventType.customQuestions.length > 0) {
      return currentEventType.customQuestions;
    }
    // 3. If a form is targeted to this event type
    const matchingForm = customForms.find((f) => f.targetEventTypeIds?.includes(currentEventType?.id || ''));
    if (matchingForm && matchingForm.fields?.length > 0) {
      return matchingForm.fields;
    }
    // 4. Default form
    const defaultForm = customForms.find((f) => f.isDefault);
    if (defaultForm && defaultForm.fields?.length > 0) {
      return defaultForm.fields;
    }
    return [];
  }, [activeForm, currentEventType, customForms]);

  // Select initial event type or connect to activeForm target event types
  useEffect(() => {
    if (selectedEventTypeId && eventTypes.length > 0) {
      const match = eventTypes.find((e) => e.id === selectedEventTypeId || e.slug === selectedEventTypeId);
      if (match) {
        setCurrentEventType(match);
        return;
      }
    }
    if (activeForm && eventTypes.length > 0) {
      if (activeForm.targetEventTypeIds && activeForm.targetEventTypeIds.length > 0) {
        if (!currentEventType || !activeForm.targetEventTypeIds.includes(currentEventType.id)) {
          const matchFromForm = eventTypes.find((e) => activeForm.targetEventTypeIds?.includes(e.id));
          if (matchFromForm) {
            setCurrentEventType(matchFromForm);
            return;
          }
        }
      }
    }
    if (eventTypes.length > 0 && !currentEventType) {
      setCurrentEventType(eventTypes[0]);
    }
  }, [selectedEventTypeId, activeForm, eventTypes, currentEventType]);

  // Set default date or handle eventType date restrictions
  useEffect(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (currentEventType?.dateType === 'specific_date' && currentEventType.specificDate) {
      if (currentEventType.specificDate >= todayStr) {
        setSelectedDate(currentEventType.specificDate);
        const [sYear, sMonth] = currentEventType.specificDate.split('-').map(Number);
        setCurrentMonth(new Date(sYear, sMonth - 1, 1));
        return;
      }
    }

    if (currentEventType?.dateType === 'range' && currentEventType.startDate) {
      const target = currentEventType.startDate > todayStr ? currentEventType.startDate : todayStr;
      setSelectedDate(target);
      const [sYear, sMonth] = target.split('-').map(Number);
      setCurrentMonth(new Date(sYear, sMonth - 1, 1));
      return;
    }

    if (!selectedDate || selectedDate < todayStr) {
      setSelectedDate(todayStr);
    }
  }, [currentEventType]);

  // Fetch slots whenever selectedDate, currentEventType, timezone, or slotDuration changes
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);

    api
      .getAvailableSlots(currentEventType?.id || 'default', selectedDate, timezone, slotDuration)
      .then((res) => {
        if (isMounted) {
          setSlots(res.slots || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load slots:', err);
        if (isMounted) setSlots([]);
      })
      .finally(() => {
        if (isMounted) setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentEventType, selectedDate, timezone, slotDuration]);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const isoDate = `${year}-${mStr}-${dStr}`;
    setSelectedDate(isoDate);
  };

  const isDaySelectable = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const isoDate = `${year}-${mStr}-${dStr}`;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Disable past dates (previous days)
    if (isoDate < todayStr) return false;

    // 2. Event Type specific date / date range
    if (currentEventType?.dateType === 'specific_date' && currentEventType.specificDate) {
      if (isoDate !== currentEventType.specificDate) return false;
    } else if (currentEventType?.dateType === 'range') {
      if (currentEventType.startDate && isoDate < currentEventType.startDate) return false;
      if (currentEventType.endDate && isoDate > currentEventType.endDate) return false;
    }

    // 3. Check host working days and availability schedule
    const dayOfWeek = new Date(year, month, day).getDay();
    if (activeSchedule?.days && activeSchedule.days.length > 0) {
      const dayConfig = activeSchedule.days.find((d) => d.dayOfWeek === dayOfWeek);
      if (!dayConfig || !dayConfig.enabled) return false;
    } else if (host?.workingDays && !host.workingDays.includes(dayOfWeek)) {
      return false;
    }

    // 4. Check schedule date overrides (e.g. Blackout / Out of Office)
    if (activeSchedule?.overrides && activeSchedule.overrides.length > 0) {
      const override = activeSchedule.overrides.find((o) => o.date === isoDate);
      if (override && !override.enabled) return false;
    }

    return true;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (new Date(selectedSlot.timeUtc).getTime() <= Date.now()) {
      showAlert({
        title: 'Time Slot Expired',
        message: 'This time slot is in the past. Please select an upcoming meeting time.',
        type: 'warning',
      });
      return;
    }

    // Validate required custom intake questions
    const missing: string[] = [];
    activeQuestions.forEach((q) => {
      if (q.required) {
        const val = customAnswers[q.id];
        if (!val || (typeof val === 'string' && !val.trim())) {
          missing.push(q.label);
        }
      }
    });

    if (missing.length > 0) {
      showAlert({
        title: 'Missing Required Information',
        message: `Please complete the following required details:\n• ${missing.join('\n• ')}`,
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const activeEventTypeId = currentEventType?.id || 'default';
      const res = await api.createBooking({
        eventTypeId: activeEventTypeId,
        inviteeName,
        inviteeEmail,
        inviteeTimezone: timezone,
        startTime: selectedSlot.timeUtc,
        duration: selectedSlot.duration || slotDuration,
        customAnswers,
      });

      setConfirmedBooking(res.booking);
      setStep('confirmed');
      if (onBookingCreated) {
        onBookingCreated(res.booking);
      }

      // Immediately re-fetch slots and clear chosen slot so it cannot be selected again
      api.getAvailableSlots(activeEventTypeId, selectedDate, timezone, slotDuration).then((r) => {
        setSlots(r.slots || []);
      });
      setSelectedSlot(null);

      // Trigger Confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      showAlert({
        title: 'Booking Failed',
        message: err.message || 'Failed to submit booking: this slot may have already been reserved. Please choose another time.',
        type: 'error',
      });
      // Refresh slots in case slot was just taken
      api.getAvailableSlots(currentEventType?.id || 'default', selectedDate, timezone, slotDuration).then((r) => {
        setSlots(r.slots || []);
      });
      setSelectedSlot(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Calendar Link generator
  const getGoogleCalendarUrl = (booking: Booking) => {
    const formatGDate = (d: string) =>
      new Date(d).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const start = formatGDate(booking.startTime);
    const end = formatGDate(booking.endTime);
    const title = encodeURIComponent(`${booking.eventTypeName} with ${host?.name || 'Host'}`);
    const details = encodeURIComponent(
      `Meeting link: ${booking.location}\nAttendee: ${booking.inviteeName}`
    );
    const location = encodeURIComponent(booking.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  // Outlook Calendar Link generator
  const getOutlookCalendarUrl = (booking: Booking) => {
    const start = new Date(booking.startTime).toISOString();
    const end = new Date(booking.endTime).toISOString();
    const title = encodeURIComponent(booking.eventTypeName);
    const body = encodeURIComponent(`Meeting Location: ${booking.location}`);
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${body}&location=${encodeURIComponent(booking.location)}`;
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden transition-all">
      {/* Top Header Actions (Clean single bar, no other meetings ribbon) */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: currentEventType?.color || '#3b82f6' }}
          />
          <span className="text-xs font-bold text-slate-800">
            {eventDisplayName}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({slotDuration}m)
          </span>
        </div>

        {/* Quick Actions for Current Meeting: Single Edit Details, Delete, and Share */}
        {currentEventType && (
          <div className="flex items-center gap-2">
            {!isPublicView && onEditEventType && (
              <button
                type="button"
                onClick={() => onEditEventType(currentEventType)}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition active:scale-95"
                title="Edit this meeting details, duration, dates, or link"
              >
                <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Edit Meeting Details</span>
              </button>
            )}
            {!isPublicView && onDeleteEventType && (
              <button
                type="button"
                onClick={handleDeleteCurrentMeeting}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-2xs hover:bg-red-50 transition active:scale-95"
                title="Delete this meeting"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete Meeting</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const targetUrl = activeForm
                  ? `${window.location.origin}/book?form=${activeForm.id}&timezone=${encodeURIComponent(timezone)}`
                  : `${window.location.origin}/book?id=${currentEventType.id}&timezone=${encodeURIComponent(timezone)}`;
                navigator.clipboard.writeText(targetUrl);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              title="Copy public booking link"
            >
              {shareCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{shareCopied ? 'Link Copied' : 'Share Booking Link'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Booking Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Host & Event Summary */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 sm:p-8 bg-slate-50/30 flex flex-col justify-between">
          <div>
            {/* Host Info */}
            <div className="flex items-center gap-3">
              {host?.avatar ? (
                <img
                  src={host.avatar}
                  alt={host?.name || 'Host'}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-xs"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-white shadow-xs">
                  {(host?.name || 'H').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-xs font-semibold text-slate-500">Scheduling with</span>
                <h4 className="text-sm font-bold text-slate-900">{host?.name || 'Host'}</h4>
              </div>
            </div>

            {/* Purpose Form Callout Banner */}
            {activeForm && (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/80 border border-indigo-200/80 p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    {activeForm.organizationName || 'Specialized Purpose'}
                  </span>
                  <span className="rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 border border-indigo-200">
                    Form Intake
                  </span>
                </div>
                <h3 className="text-sm font-black text-indigo-950 leading-tight">
                  {activeForm.title}
                </h3>
                {activeForm.description && (
                  <p className="text-[11px] text-indigo-700/90 leading-relaxed pt-0.5">
                    {activeForm.description}
                  </p>
                )}
                {/* Available meeting duration options for this form */}
                {activeForm.targetEventTypeIds && activeForm.targetEventTypeIds.length > 1 && (
                  <div className="pt-2 border-t border-indigo-200/50 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Choose Duration:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeForm.targetEventTypeIds.map((etId) => {
                        const et = eventTypes.find((e) => e.id === etId);
                        if (!et) return null;
                        const isSelected = currentEventType?.id === et.id;
                        return (
                          <button
                            key={et.id}
                            type="button"
                            onClick={() => setCurrentEventType(et)}
                            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white/80 border border-indigo-200 text-indigo-800 hover:bg-white'
                            }`}
                          >
                            {et.duration}m
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Event Info */}
            <div className="mt-5">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {eventDisplayName}
              </h2>
              <div className="mt-4 space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{slotDuration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-slate-400" />
                  <span className="capitalize">{currentEventType?.locationType.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span>Timezone: {timezone.split('/')[1]?.replace('_', ' ') || timezone}</span>
                </div>
                {targetCalendar && (
                  <div className="flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold truncate" title={targetCalendar}>
                      Calendar: {targetCalendar}
                    </span>
                  </div>
                )}
              </div>

              {/* Prominent Meeting Link Box - Ensures Meeting Link is Never Missing */}
              {(() => {
                const meetUrl =
                  currentEventType?.locationDetails ||
                  (currentEventType?.locationType === 'google_meet' ? 'https://meet.google.com/new' : '');
                return (
                  <div className="mt-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-blue-600" />
                        Meeting Link
                      </span>
                      {meetUrl && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(meetUrl);
                              setMeetCopied(true);
                              setTimeout(() => setMeetCopied(false), 2000);
                            }}
                            title="Copy meeting link"
                            className="rounded-md p-1 text-blue-600 hover:bg-blue-100 transition"
                          >
                            {meetCopied ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open meeting room"
                            className="rounded-md p-1 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-blue-700 break-all select-all leading-tight">
                      {meetUrl || (currentEventType?.locationType === 'phone' ? 'Phone call details provided upon booking' : 'Auto-generated meeting room link')}
                    </div>
                  </div>
                );
              })()}

              {currentEventType?.description && (
                <p className="mt-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                  {currentEventType.description}
                </p>
              )}
            </div>
          </div>

          {/* Timezone Switcher in Left Bar */}
          <div className="mt-8 border-t border-slate-100 pt-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Display Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-blue-500 focus:outline-none"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Dynamic Steps */}
        <div className="lg:col-span-8 p-6 sm:p-8">
          {/* STEP 1: Date & Slot Selection */}
          {step === 'datetime' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar Column */}
              <div>
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 pb-2">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9 w-9" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(Date.UTC(year, month, day));
                    const iso = dateObj.toISOString().split('T')[0];
                    const isSelected = selectedDate === iso;
                    const selectable = isDaySelectable(day);

                    return (
                      <button
                        key={day}
                        disabled={!selectable}
                        onClick={() => handleDateClick(day)}
                        className={`h-9 w-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                            : selectable
                            ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-600 font-medium'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Picker Column */}
              <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                {/* Available Times Header (Clean header with declared slot size badge and filter toggle) */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      Available Times
                    </h4>
                    {selectedDate && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                      {slotDuration} min slots
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                    >
                      {showOnlyAvailable ? 'Show All' : 'Available Only'}
                    </button>
                  </div>
                </div>

                {(() => {
                  const nowMs = Date.now();
                  const availableSlots = slots.filter((slot) => {
                    const slotTimeMs = new Date(slot.timeUtc).getTime();
                    return !slot.disabled && slot.available !== false && slotTimeMs > nowMs;
                  });

                  const disabledSlots = slots.filter((slot) => {
                    const slotTimeMs = new Date(slot.timeUtc).getTime();
                    return slot.disabled || slot.available === false || slotTimeMs <= nowMs;
                  });

                  const displaySlots = showOnlyAvailable ? availableSlots : slots;

                  // Detect existing booked appointments on this day
                  const bookingsOnThisDay = (existingBookings || []).filter((b) => {
                    if (b.status === 'cancelled') return false;
                    const bDate = b.startTime.split('T')[0];
                    return bDate === selectedDate;
                  });

                  // Detect other scheduled meetings on this date
                  const otherEventsOnThisDay = (eventTypes || []).filter((e) => {
                    if (e.id === currentEventType?.id) return false;
                    return (
                      e.dateType === 'specific_date' &&
                      e.specificDate === selectedDate &&
                      e.customTimeSlots &&
                      e.customTimeSlots.length > 0
                    );
                  });

                  if (loadingSlots) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                        <span className="text-xs font-medium">Calculating {slotDuration}-minute slots...</span>
                      </div>
                    );
                  }

                  if (slots.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
                        No meeting slots scheduled for this day.
                      </div>
                    );
                  }

                  if (availableSlots.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center text-xs text-amber-800 space-y-1.5">
                        <p className="font-bold">All {slotDuration}-minute slots for this day are currently booked or unavailable.</p>
                        <p className="text-[11px] text-amber-700">Please choose another date on the calendar.</p>
                      </div>
                    );
                  }

                  const leastAvailableSlot = availableSlots[0];
                  const leastMs = new Date(leastAvailableSlot.timeUtc).getTime();

                  // Prior meetings strictly before this earliest available slot
                  const priorBookings = bookingsOnThisDay.filter((b) => new Date(b.startTime).getTime() < leastMs);
                  const priorMeetingDescs: string[] = [];
                  priorBookings.forEach((b) => {
                    const st = new Date(b.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    const et = new Date(b.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    priorMeetingDescs.push(`${st} – ${et}`);
                  });
                  otherEventsOnThisDay.forEach((e) => {
                    e.customTimeSlots?.forEach((s) => {
                      priorMeetingDescs.push(`${s.start} – ${s.end}`);
                    });
                  });

                  return (
                    <div className="space-y-3">
                      {/* Least Time of Availability Banner */}
                      <div className="rounded-xl border border-blue-200/90 bg-blue-50/80 p-3 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                            Default Initial Time:
                          </span>
                          <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-black text-white shadow-xs">
                            {leastAvailableSlot.timeFormatted}
                          </span>
                        </div>
                        {priorMeetingDescs.length > 0 ? (
                          <p className="text-[11px] text-blue-800 leading-tight">
                            Prior meeting(s) on this day ({priorMeetingDescs.join(', ')}). First non-conflicting time starts at <strong className="underline">{leastAvailableSlot.timeFormatted}</strong>.
                          </p>
                        ) : (
                          <p className="text-[11px] text-blue-700/90 leading-tight">
                            Earliest available meeting time for this day starts at {leastAvailableSlot.timeFormatted}.
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-blue-800/80 border-t border-blue-200/60 font-medium">
                          <span>{availableSlots.length} available slots ({slotDuration}m each)</span>
                          {disabledSlots.length > 0 && (
                            <span className="text-slate-500">{disabledSlots.length} disabled/reserved</span>
                          )}
                        </div>
                      </div>

                      {/* Slots list */}
                      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {displaySlots.map((slot) => {
                          const slotTimeMs = new Date(slot.timeUtc).getTime();
                          const isPast = slotTimeMs <= nowMs;
                          const isDisabled = slot.disabled || isPast || slot.available === false;
                          const isChosen = selectedSlot?.timeUtc === slot.timeUtc;
                          const isMorning = slot.timeFormatted.includes('AM');

                          if (isDisabled) {
                            return (
                              <div key={slot.timeUtc} className="space-y-1">
                                <button
                                  type="button"
                                  disabled
                                  className="w-full rounded-xl border border-slate-200/80 bg-slate-100/70 py-2.5 px-4 text-xs font-medium text-slate-400 cursor-not-allowed flex items-center justify-between opacity-75"
                                  title={slot.disabledReason || (isPast ? 'Past time' : 'Reserved / Disabled in further booking')}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="line-through text-slate-400 font-bold">{slot.timeFormatted}</span>
                                    <span className="text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300/60 flex items-center gap-1">
                                      <Ban className="h-2.5 w-2.5 text-slate-500" />
                                      Disabled
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                                    {slot.disabledReason || (isPast ? 'Past time' : 'Reserved')}
                                  </span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div key={slot.timeUtc} className="space-y-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedSlot(isChosen ? null : slot)}
                                className={`w-full rounded-xl border py-2.5 px-4 text-xs font-bold transition-all flex items-center justify-between ${
                                  isChosen
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{slot.timeFormatted}</span>
                                  {slot.timeUtc === leastAvailableSlot.timeUtc && (
                                    <span
                                      className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded ${
                                        isChosen ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      Earliest
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      isChosen ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {slot.duration || slotDuration}m
                                  </span>
                                </span>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                    isChosen
                                      ? 'bg-blue-700 text-white'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {isMorning ? 'Morning' : 'Afternoon'}
                                </span>
                              </button>

                              {/* Slot Inspection Card */}
                              {isChosen && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs space-y-2 animate-fade-in shadow-2xs">
                                  <div className="flex items-center justify-between text-blue-950 font-bold">
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                                      {slot.timeFormatted} ({slot.duration || slotDuration}m slot)
                                    </span>
                                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                                      Selected Slot
                                    </span>
                                  </div>
                                  <div className="pt-1 border-t border-blue-200/60">
                                    <button
                                      type="button"
                                      onClick={() => setStep('form')}
                                      className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition flex items-center justify-center gap-1 active:scale-95"
                                    >
                                      <span>Book This Slot ({slot.timeFormatted} • {slot.duration || slotDuration}m)</span>
                                      <span>→</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 2: Intake Questionnaire Form (Booking Wizard Tab) */}
          {step === 'form' && !selectedSlot && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3 animate-fade-in">
              <CalendarIcon className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No time slot selected yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please pick a date and an available time slot from the Available Time Slots tab to complete the booking form.
              </p>
              <button
                type="button"
                onClick={() => setStep('datetime')}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>View Available Time Slots</span>
              </button>
            </div>
          )}

          {step === 'form' && selectedSlot && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setStep('datetime')}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Enter Details & Confirmation</h3>
                  <p className="text-xs text-slate-500">
                    Selected:{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedSlot.timeFormatted} ({selectedSlot.duration || slotDuration} min) on {new Date(selectedSlot.timeUtc).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteeName}
                      onChange={(e) => setInviteeName(e.target.value)}
                      placeholder="Jane Doe"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteeEmail}
                      onChange={(e) => setInviteeEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Custom Intake Questions Rendered Dynamically */}
                {activeQuestions && activeQuestions.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Organization Intake Details
                      </span>
                      <span className="rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                        {activeQuestions.length} Questions
                      </span>
                    </div>

                    {activeQuestions.map((q) => {
                      const currentVal = customAnswers[q.id];

                      return (
                        <div key={q.id} className="space-y-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            {q.label} {q.required && <span className="text-red-500">*</span>}
                          </label>
                          {q.helpText && (
                            <p className="text-[11px] text-slate-500 leading-tight mb-1">
                              {q.helpText}
                            </p>
                          )}

                          {q.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              required={q.required}
                              placeholder={q.placeholder || 'Type your response here...'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : q.type === 'select' ? (
                            <select
                              required={q.required}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="">Select an option...</option>
                              {q.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : q.type === 'radio' ? (
                            <div className="space-y-2 pt-1">
                              {q.options?.map((opt) => {
                                const isChecked = currentVal === opt;
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                                      isChecked
                                        ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={q.id}
                                      required={q.required && !currentVal}
                                      checked={isChecked}
                                      onChange={() =>
                                        setCustomAnswers({ ...customAnswers, [q.id]: opt })
                                      }
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : q.type === 'checkbox' ? (
                            <div className="space-y-2 pt-1">
                              {q.options?.map((opt) => {
                                const selectedArr = currentVal ? currentVal.split(', ').filter(Boolean) : [];
                                const isChecked = selectedArr.includes(opt);
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                                      isChecked
                                        ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const nextArr = e.target.checked
                                          ? [...selectedArr, opt]
                                          : selectedArr.filter((s) => s !== opt);
                                        setCustomAnswers({ ...customAnswers, [q.id]: nextArr.join(', ') });
                                      }}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : q.type === 'email' ? (
                            <input
                              type="email"
                              required={q.required}
                              placeholder={q.placeholder || 'contact@example.com'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : q.type === 'phone' ? (
                            <input
                              type="tel"
                              required={q.required}
                              placeholder={q.placeholder || '+1 (555) 000-0000'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : q.type === 'number' ? (
                            <input
                              type="number"
                              min={q.min}
                              max={q.max}
                              required={q.required}
                              placeholder={q.placeholder || 'e.g. 10'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : q.type === 'date' ? (
                            <input
                              type="date"
                              required={q.required}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : q.type === 'url' ? (
                            <input
                              type="url"
                              required={q.required}
                              placeholder={q.placeholder || 'https://example.com'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : (
                            <input
                              type="text"
                              required={q.required}
                              placeholder={q.placeholder || 'Your answer'}
                              value={currentVal || ''}
                              onChange={(e) =>
                                setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    By booking, an automated confirmation & calendar invite will be sent.
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Confirming...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Confirmed Screen */}
          {step === 'confirmed' && confirmedBooking && (
            <div className="py-8 text-center animate-fade-in space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 mb-2">
                  Booking Confirmed!
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  You are scheduled with {host?.name || 'Host'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A calendar invitation and confirmation email have been dispatched to{' '}
                  <span className="font-semibold text-slate-700">{confirmedBooking.inviteeEmail}</span>.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 text-left text-xs font-medium text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-bold text-slate-900">{confirmedBooking.eventTypeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(confirmedBooking.startTime).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: confirmedBooking.inviteeTimezone,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">
                    {Math.round((new Date(confirmedBooking.endTime).getTime() - new Date(confirmedBooking.startTime).getTime()) / (60 * 1000))} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <span className="text-slate-500">Join Link:</span>
                  <div className="flex items-center gap-2 truncate">
                    <a
                      href={confirmedBooking.location}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-600 hover:underline truncate max-w-[220px]"
                    >
                      {confirmedBooking.location}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(confirmedBooking.location);
                        setMeetCopied(true);
                        setTimeout(() => setMeetCopied(false), 2000);
                      }}
                      className="rounded p-1 text-blue-600 hover:bg-blue-100 transition"
                      title="Copy meeting link"
                    >
                      {meetCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submitted Custom Intake Details */}
              {confirmedBooking.customAnswers && Object.keys(confirmedBooking.customAnswers).length > 0 && (
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-4 text-left text-xs font-medium text-slate-700 space-y-2 shadow-xs">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                    Your Provided Information
                  </span>
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(confirmedBooking.customAnswers).map(([k, val]) => {
                      const matchedQ = activeQuestions.find((q) => q.id === k);
                      const displayLabel = matchedQ ? matchedQ.label : k;
                      return (
                        <div key={k} className="flex flex-col gap-0.5 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{displayLabel}</span>
                          <span className="font-semibold text-slate-800 break-words">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Direct Join Button */}
              {confirmedBooking.location && confirmedBooking.location.startsWith('http') && (
                <div className="pt-2">
                  <a
                    href={confirmedBooking.location}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition active:scale-95"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Meeting Room Now</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* 1-Click Calendar Add Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={`/api/bookings/${confirmedBooking.id}/ics`}
                  download
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Download .ICS</span>
                </a>

                <a
                  href={getGoogleCalendarUrl(confirmedBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <CalendarPlus className="h-4 w-4 text-emerald-600" />
                  <span>Google Calendar</span>
                </a>

                <a
                  href={getOutlookCalendarUrl(confirmedBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition"
                >
                  <CalendarPlus className="h-4 w-4 text-indigo-600" />
                  <span>Outlook</span>
                </a>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep('datetime')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Schedule Another Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
