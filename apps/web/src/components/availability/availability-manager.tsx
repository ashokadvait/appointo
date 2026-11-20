'use client';

import React, { useState, useEffect } from 'react';
import { AvailabilitySchedule, ConnectedCalendar, DayAvailability, TimeInterval, DateOverride, CustomBookingForm } from '@calendly/types';
import { api } from '@/lib/api-client';
import { useDialog } from '@/components/ui/dialog-provider';
import {
  Calendar,
  Plus,
  Trash2,
  Check,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  ClipboardList,
  ExternalLink,
  X,
  Link2,
  Copy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { FormBuilder } from '../forms/form-builder';

interface AvailabilityManagerProps {
  schedules: AvailabilitySchedule[];
  calendars: ConnectedCalendar[];
  onRefresh: () => void;
  onNotify: (msg: string) => void;
  onNavigateToForms?: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  schedules,
  calendars,
  onRefresh,
  onNotify,
  onNavigateToForms,
}) => {
  const { showAlert, showToast } = useDialog();
  const [activeSchedule, setActiveSchedule] = useState<AvailabilitySchedule | null>(
    schedules.length > 0 ? schedules[0] : null
  );
  const [localDays, setLocalDays] = useState<DayAvailability[]>(
    activeSchedule ? activeSchedule.days : []
  );
  const [localOverrides, setLocalOverrides] = useState<DateOverride[]>(
    activeSchedule ? activeSchedule.overrides : []
  );
  const [saving, setSaving] = useState(false);

  // Slot Division & Time Slot Declaration State
  const [slotDivision, setSlotDivision] = useState<number>(
    activeSchedule?.defaultSlotDuration || 15
  );
  const [isCustomDivision, setIsCustomDivision] = useState<boolean>(false);
  const [customDivisionInput, setCustomDivisionInput] = useState<string>(
    String(activeSchedule?.defaultSlotDuration || 15)
  );
  const [expandedDaySlots, setExpandedDaySlots] = useState<number | null>(null);

  // Custom Intake Forms Integration in Availability
  const [customForms, setCustomForms] = useState<CustomBookingForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [previewingForm, setPreviewingForm] = useState<CustomBookingForm | null>(null);

  useEffect(() => {
    api.getCustomForms().then((forms) => {
      setCustomForms(forms);
      const def = forms.find((f) => f.isDefault) || forms[0];
      if (def) setSelectedFormId(def.id);
    }).catch(() => {});
  }, []);

  const selectedForm = customForms.find((f) => f.id === selectedFormId) || customForms[0] || null;

  // Connected Calendar Selection for Link Generation
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [origin, setOrigin] = useState<string>('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (calendars.length > 0 && !selectedCalendarId) {
      const primary = calendars.find((c) => c.isPrimary) || calendars[0];
      if (primary) setSelectedCalendarId(primary.id);
    }
  }, [calendars, selectedCalendarId]);

  const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId) || calendars.find((c) => c.isPrimary) || calendars[0] || null;

  const generatedBookingUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (slotDivision) params.set('duration', String(slotDivision));
    if (selectedFormId) params.set('form', selectedFormId);
    if (selectedCalendar?.email) params.set('calendar', selectedCalendar.email);
    return `${origin}/book?${params.toString()}`;
  }, [origin, slotDivision, selectedFormId, selectedCalendar]);

  const handleCopyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedBookingUrl);
    setCopiedLink(true);
    showToast(`Shareable booking link copied! (${slotDivision}m slot • ${selectedForm?.title || 'Form'} • ${selectedCalendar?.email || 'Calendar'})`, 'success');
    if (onNotify) {
      onNotify(`Shareable link copied: ${generatedBookingUrl}`);
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  useEffect(() => {
    if (schedules.length > 0 && !activeSchedule) {
      setActiveSchedule(schedules[0]);
    }
  }, [schedules]);

  useEffect(() => {
    if (activeSchedule) {
      setLocalDays(activeSchedule.days || []);
      setLocalOverrides(activeSchedule.overrides || []);
      const dur = activeSchedule.defaultSlotDuration || 15;
      setSlotDivision(dur);
      setCustomDivisionInput(String(dur));
    }
  }, [activeSchedule]);

  // New Override State
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideReason, setNewOverrideReason] = useState('Out of Office / Blackout');

  // New Calendar State
  const [newCalEmail, setNewCalEmail] = useState('');
  const [newCalProvider, setNewCalProvider] = useState<'google' | 'outlook' | 'apple'>('google');

  const getDeclaredSlotsForDay = (intervals: TimeInterval[], dur: number) => {
    const result: string[] = [];
    for (const interval of intervals) {
      if (!interval.start || !interval.end) continue;
      const [sH, sM] = interval.start.split(':').map(Number);
      const [eH, eM] = interval.end.split(':').map(Number);
      let startMin = sH * 60 + sM;
      const endMin = eH * 60 + eM;
      while (startMin + dur <= endMin) {
        const h = Math.floor(startMin / 60);
        const m = startMin % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = String(m).padStart(2, '0');
        result.push(`${displayH}:${displayM} ${period}`);
        startMin += dur;
      }
    }
    return result;
  };

  const handleToggleDay = (dayIndex: number) => {
    const updated = localDays.map((d) =>
      d.dayOfWeek === dayIndex ? { ...d, enabled: !d.enabled } : d
    );
    setLocalDays(updated);
  };

  const handleAddTimeInterval = (dayIndex: number) => {
    const updated = localDays.map((d) => {
      if (d.dayOfWeek === dayIndex) {
        return {
          ...d,
          intervals: [...d.intervals, { start: '13:00', end: '17:00' }],
        };
      }
      return d;
    });
    setLocalDays(updated);
  };

  const handleRemoveInterval = (dayIndex: number, intervalIndex: number) => {
    const updated = localDays.map((d) => {
      if (d.dayOfWeek === dayIndex) {
        return {
          ...d,
          intervals: d.intervals.filter((_, i) => i !== intervalIndex),
        };
      }
      return d;
    });
    setLocalDays(updated);
  };

  const handleUpdateInterval = (
    dayIndex: number,
    intervalIndex: number,
    field: 'start' | 'end',
    val: string
  ) => {
    const updated = localDays.map((d) => {
      if (d.dayOfWeek === dayIndex) {
        const newIntervals = [...d.intervals];
        newIntervals[intervalIndex] = { ...newIntervals[intervalIndex], [field]: val };
        return { ...d, intervals: newIntervals };
      }
      return d;
    });
    setLocalDays(updated);
  };

  const handleAddOverride = () => {
    if (!newOverrideDate) return;
    const newOv: DateOverride = {
      date: newOverrideDate,
      enabled: false,
      intervals: [],
      reason: newOverrideReason,
    };
    setLocalOverrides([...localOverrides, newOv]);
    setNewOverrideDate('');
  };

  const handleRemoveOverride = (idx: number) => {
    setLocalOverrides(localOverrides.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!activeSchedule) return;
    setSaving(true);
    try {
      await api.updateSchedule(activeSchedule.id, {
        days: localDays,
        overrides: localOverrides,
        defaultSlotDuration: slotDivision,
      });
      onNotify(`Availability schedule & declared ${slotDivision}m time slots saved successfully!`);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Save Failed',
        message: err.message || 'Failed to save schedule',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCalendarConflict = async (cal: ConnectedCalendar) => {
    try {
      await api.toggleCalendar(cal.id, { checkConflicts: !cal.checkConflicts });
      onNotify(`Conflict checking ${cal.checkConflicts ? 'disabled' : 'enabled'} for ${cal.email}`);
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Failed to update conflict checking',
        type: 'error',
      });
    }
  };

  const handleAddCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalEmail) return;
    try {
      await api.addConnectedCalendar(newCalProvider, newCalEmail);
      onNotify(`Connected ${newCalProvider} calendar for ${newCalEmail}`);
      setNewCalEmail('');
      onRefresh();
    } catch (err: any) {
      showAlert({
        title: 'Connection Failed',
        message: err.message || 'Failed to connect calendar',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* TOP: DYNAMIC SHAREABLE LINK GENERATOR (Based on Time Slot, Intake Form, Connected Calendar) */}
      <div className="rounded-3xl border-2 border-blue-500/80 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white p-6 sm:p-7 shadow-lg shadow-blue-500/10 space-y-5">
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-200/70 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight text-blue-950">
                  Dynamic Shareable Booking Link
                </h2>
                <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  Live Free Slots
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 font-medium leading-relaxed">
                Automatically generated from your <strong>selected time slot duration</strong>, <strong>intake questionnaire</strong>, and <strong>connected calendar</strong>. Anyone with this link can self-schedule an appointment on your free slots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyGeneratedLink}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition active:scale-95"
            >
              {copiedLink ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}</span>
            </button>
            <a
              href={generatedBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
              title="Test invitee booking experience in new tab"
            >
              <ExternalLink className="h-4 w-4 text-slate-500" />
              <span>Test Link</span>
            </a>
          </div>
        </div>

        {/* 3 Parameter Selection Controls: Time Slot, Intake Form, Connected Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parameter 1: Time Slot Duration */}
          <div className="rounded-2xl border border-blue-200/90 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>1. Time Slot Duration</span>
              </label>
              <span className="rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2 py-0.5">
                {slotDivision} min
              </span>
            </div>
            <select
              value={slotDivision}
              onChange={(e) => {
                const nextDur = Number(e.target.value);
                setSlotDivision(nextDur);
                setCustomDivisionInput(String(nextDur));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              <option value="10">10 minutes per slot</option>
              <option value="15">15 minutes per slot (Default)</option>
              <option value="20">20 minutes per slot</option>
              <option value="30">30 minutes per slot</option>
              <option value="45">45 minutes per slot</option>
              <option value="60">60 minutes per slot</option>
            </select>
            <p className="text-[10px] text-slate-500">
              Divides host working hours into {slotDivision}m bookable units.
            </p>
          </div>

          {/* Parameter 2: Intake Form */}
          <div className="rounded-2xl border border-blue-200/90 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-indigo-600" />
                <span>2. Intake Form / Purpose</span>
              </label>
              <span className="rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2 py-0.5">
                {selectedForm?.fields?.length || 0} fields
              </span>
            </div>
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              {customForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.fields?.length || 0} fields)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 truncate" title={selectedForm?.description || ''}>
              {selectedForm?.description || 'Custom questions presented to invitee.'}
            </p>
          </div>

          {/* Parameter 3: Connected Calendar */}
          <div className="rounded-2xl border border-blue-200/90 bg-white p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>3. Connected Calendar</span>
              </label>
              <span className="rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 capitalize">
                {selectedCalendar?.provider || 'Calendar'}
              </span>
            </div>
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.provider.toUpperCase()} ({c.email}) {c.isPrimary ? '• Primary' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">
              Cross-references external events to prevent double-booking.
            </p>
          </div>
        </div>

        {/* Live Generated URL Box */}
        <div className="rounded-2xl bg-white border border-blue-200 p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Generated Link for Distribution</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Click Copy or Test to share
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedBookingUrl}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono font-medium text-slate-800 select-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleCopyGeneratedLink}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95 shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
            <a
              href={generatedBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 shrink-0"
              title="Open and test booking this slot"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Open</span>
            </a>
          </div>

          {/* Configuration Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              <Clock className="h-3 w-3 text-blue-600" />
              Slot: {slotDivision} mins
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              <ClipboardList className="h-3 w-3 text-indigo-600" />
              Form: {selectedForm?.title || 'Selected Intake'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <Calendar className="h-3 w-3 text-emerald-600" />
              Sync: {selectedCalendar?.provider.toUpperCase() || 'CALENDAR'} ({selectedCalendar?.email || 'Active'})
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 ml-auto">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Real-Time Free Slots Active
            </span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              Calendar Integration & Availability Rules
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              Multi-Interval
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure recurring weekly time intervals, date overrides (blackout/vacation), and Google/Outlook conflict sync.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span>{saving ? 'Saving...' : 'Save Availability'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Matrix Column */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Declared Time Slot Duration & Slot Division Mode */}
          <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <Sliders className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Time Slot Division & Slot Duration
                    </h4>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Booking Engine
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed">
                    Declare how your weekly working hours are partitioned into bookable slots. The Booking Wizard will automatically divide your time into these slots and display them accordingly.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto shrink-0 rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-extrabold shadow-sm shadow-blue-500/20">
                {slotDivision} min / slot
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100/70">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Presets:</span>
              {[10, 15, 20, 30, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setIsCustomDivision(false);
                    setSlotDivision(dur);
                    setCustomDivisionInput(String(dur));
                  }}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    slotDivision === dur && !isCustomDivision
                      ? 'bg-blue-600 text-white shadow-xs scale-102'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {dur}m {dur === 15 && <span className="text-[9px] font-normal opacity-85">(Default)</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomDivision(!isCustomDivision)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all flex items-center gap-1 ${
                  isCustomDivision
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Custom Mode</span>
              </button>
            </div>

            {isCustomDivision && (
              <div className="flex items-center gap-2 pt-1 animate-fade-in bg-white/95 border border-blue-200 rounded-xl p-2.5 shadow-2xs">
                <span className="text-xs font-bold text-slate-700">Custom Slot Size:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(5, slotDivision - 5);
                      setSlotDivision(next);
                      setCustomDivisionInput(String(next));
                    }}
                    className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={customDivisionInput}
                    onChange={(e) => {
                      setCustomDivisionInput(e.target.value);
                      const val = Number(e.target.value);
                      if (val >= 5 && val <= 360) {
                        setSlotDivision(val);
                      }
                    }}
                    className="h-7 w-16 rounded-lg border border-slate-300 bg-white px-2 text-center text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(360, slotDivision + 5);
                      setSlotDivision(next);
                      setCustomDivisionInput(String(next));
                    }}
                    className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    +5
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">minutes per meeting slot</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Working Hours</h3>
              <p className="text-xs text-slate-500">
                Set recurring hours when you are free to accept appointments.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Timezone: {activeSchedule?.timezone || 'America/New_York'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
              const day = localDays.find((d) => d.dayOfWeek === dayNum) || {
                dayOfWeek: dayNum,
                enabled: false,
                intervals: [],
              };
              const daySlots = day.enabled ? getDeclaredSlotsForDay(day.intervals, slotDivision) : [];

              return (
                <div key={dayNum} className="pt-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Day Toggle */}
                    <div className="flex items-center gap-3 w-36">
                      <input
                        type="checkbox"
                        id={`day-${dayNum}`}
                        checked={day.enabled}
                        onChange={() => handleToggleDay(dayNum)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`day-${dayNum}`}
                        className={`text-xs font-bold uppercase tracking-wider cursor-pointer ${
                          day.enabled ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {DAY_NAMES[dayNum]}
                      </label>
                    </div>

                    {/* Intervals */}
                    <div className="flex-1 space-y-2">
                      {day.enabled ? (
                        day.intervals.map((interval, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={interval.start}
                              onChange={(e) =>
                                handleUpdateInterval(dayNum, iIdx, 'start', e.target.value)
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono font-medium text-slate-800"
                            />
                            <span className="text-xs text-slate-400">-</span>
                            <input
                              type="time"
                              value={interval.end}
                              onChange={(e) =>
                                handleUpdateInterval(dayNum, iIdx, 'end', e.target.value)
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono font-medium text-slate-800"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveInterval(dayNum, iIdx)}
                              className="rounded-md p-1 text-slate-400 hover:text-red-500 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Unavailable</span>
                      )}

                      {day.enabled && day.intervals.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No intervals defined</span>
                      )}
                    </div>
                  </div>

                  {/* Day Slots info & Add interval controls */}
                  {day.enabled && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-7 sm:pl-39 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {daySlots.length} declared slots ({slotDivision}m each)
                        </span>
                        {daySlots.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedDaySlots(expandedDaySlots === dayNum ? null : dayNum)}
                            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-0.5 transition"
                          >
                            <span>{expandedDaySlots === dayNum ? 'Hide Slot Times' : 'Preview Slot Times'}</span>
                            {expandedDaySlots === dayNum ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddTimeInterval(dayNum)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Interval</span>
                      </button>
                    </div>
                  )}

                  {/* Expandable Declared Slot Times Chip Grid */}
                  {expandedDaySlots === dayNum && daySlots.length > 0 && (
                    <div className="pl-7 sm:pl-39 pt-1">
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {daySlots.map((slotTime, sIdx) => (
                          <span key={sIdx} className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[10px] font-mono font-bold text-slate-700 shadow-2xs">
                            {slotTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Date Overrides Section */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Date-Specific Overrides & Blackouts</h3>
                <p className="text-xs text-slate-500">
                  Override recurring hours for vacations, conferences, or specific days off.
                </p>
              </div>
            </div>

            {/* Add Override Form */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-200">
              <input
                type="date"
                value={newOverrideDate}
                onChange={(e) => setNewOverrideDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 font-medium"
              />
              <input
                type="text"
                placeholder="Reason: Vacation / Company Holiday"
                value={newOverrideReason}
                onChange={(e) => setNewOverrideReason(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={handleAddOverride}
                disabled={!newOverrideDate}
                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
              >
                Add Blackout
              </button>
            </div>

            {/* Overrides List */}
            <div className="space-y-2">
              {localOverrides.map((ov, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{ov.date}</span>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-200">
                      Unavailable
                    </span>
                    <span className="text-slate-500">&bull; {ov.reason}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveOverride(idx)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {localOverrides.length === 0 && (
                <p className="text-xs text-slate-400 italic">No date overrides configured.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Forms & Calendars */}
        <div className="lg:col-span-4 space-y-6">
          {/* Intake Form for Available Slots Card */}
          <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Intake Form for Slots
                </h3>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Active Form
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose which custom intake questionnaire invitees must complete when booking slots generated from these availability hours.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Selected Questionnaire
                </label>
                <select
                  value={selectedFormId}
                  onChange={async (e) => {
                    const nextId = e.target.value;
                    setSelectedFormId(nextId);
                    const target = customForms.find((f) => f.id === nextId);
                    if (target) {
                      await api.saveCustomForm({ ...target, isDefault: true });
                      showToast(`Set "${target.title}" as default slot intake form`, 'success');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none"
                >
                  {customForms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.fields?.length || 0} fields)
                    </option>
                  ))}
                </select>
              </div>

              {selectedForm && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{selectedForm.title}</span>
                    <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                      {selectedForm.fields?.length || 0} fields
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selectedForm.fields?.map((f) => (
                      <span key={f.id} className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 border border-slate-200">
                        {f.label}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewingForm(selectedForm)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview Form</span>
                    </button>
                    {onNavigateToForms && (
                      <button
                        type="button"
                        onClick={onNavigateToForms}
                        className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        <span>Open Studio</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Connected Calendars
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              We cross-reference external events so you are never double-booked.
            </p>

            <div className="space-y-3">
              {calendars.map((cal) => (
                <div
                  key={cal.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs capitalize text-slate-800">
                      {cal.provider} Calendar
                    </span>
                    {cal.isPrimary && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                        Primary
                      </span>
                    )}
                  </div>
                  <span className="block text-xs font-mono text-slate-600 truncate">{cal.email}</span>

                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={cal.checkConflicts}
                      onChange={() => handleToggleCalendarConflict(cal)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Check for conflicts</span>
                  </label>
                </div>
              ))}
            </div>

            {/* Connect another calendar */}
            <form onSubmit={handleAddCalendar} className="border-t border-slate-100 pt-3 space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Connect Another Calendar
              </span>
              <select
                value={newCalProvider}
                onChange={(e) => setNewCalProvider(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
              >
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook 365</option>
                <option value="apple">Apple iCloud</option>
              </select>
              <input
                type="email"
                placeholder="account@company.com"
                value={newCalEmail}
                onChange={(e) => setNewCalEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
              />
              <button
                type="submit"
                disabled={!newCalEmail}
                className="w-full rounded-xl bg-blue-50 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition disabled:opacity-50"
              >
                + Connect Calendar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Form Preview Modal in Availability Manager */}
      {previewingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewingForm(null)}
          />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 z-10 my-8 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Form Preview: {previewingForm.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingForm(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-2">
              <FormBuilder
                fields={previewingForm.fields || []}
                onChange={() => {}}
                formTitle={previewingForm.title}
                formDescription={previewingForm.description}
                organizationName={previewingForm.organizationName || 'Availability Slot Form'}
                themeColor="#3b82f6"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
