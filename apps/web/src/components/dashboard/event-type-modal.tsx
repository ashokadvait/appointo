'use client';

import React, { useState, useEffect } from 'react';
import { EventType, IntakeQuestion, LocationType, DateAvailabilityType, CustomTimeSlot, CustomBookingForm } from '@calendly/types';
import { X, Plus, Trash2, Check, Calendar, Clock, Info, Sparkles, Sun, Sunset, ExternalLink, Sliders, ClipboardList, Eye, CheckCircle2 } from 'lucide-react';
import { FormBuilder } from '../forms/form-builder';
import { api } from '@/lib/api-client';

import { useDialog } from '@/components/ui/dialog-provider';
import { Booking } from '@calendly/types';

interface EventTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EventType>) => Promise<void>;
  editingEventType?: EventType | null;
  existingBookings?: Booking[];
  existingEventTypes?: EventType[];
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

export function getSlotSpanMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const span = (eh * 60 + em) - (sh * 60 + sm);
  return span > 0 ? span : 0;
}

export function findLeastAvailableTime(
  dateStr: string,
  existingBookings: Booking[] = [],
  existingEventTypes: EventType[] = [],
  excludeEventTypeId?: string
): { startTime: string; endTime: string; conflictReason?: string } {
  if (!dateStr) return { startTime: '09:00', endTime: '17:00' };

  const occupied: { start: string; end: string; label: string }[] = [];

  // Check bookings on this date
  for (const b of existingBookings) {
    if (b.status === 'cancelled') continue;
    try {
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      if (bDate === dateStr) {
        const s = new Date(b.startTime);
        const e = new Date(b.endTime);
        const sHhMm = `${String(s.getHours()).padStart(2, '0')}:${String(s.getMinutes()).padStart(2, '0')}`;
        const eHhMm = `${String(e.getHours()).padStart(2, '0')}:${String(e.getMinutes()).padStart(2, '0')}`;
        occupied.push({ start: sHhMm, end: eHhMm, label: `Appointment with ${b.inviteeName}` });
      }
    } catch {}
  }

  // Check other event types configured on this specific date
  for (const et of existingEventTypes) {
    if (excludeEventTypeId && et.id === excludeEventTypeId) continue;
    if (et.dateType === 'specific_date' && et.specificDate === dateStr && Array.isArray(et.customTimeSlots)) {
      for (const slot of et.customTimeSlots) {
        if (slot.start && slot.end) {
          occupied.push({ start: slot.start, end: slot.end, label: `Meeting "${et.name}"` });
        }
      }
    }
  }

  if (occupied.length === 0) return { startTime: '09:00', endTime: '17:00' };

  occupied.sort((a, b) => a.start.localeCompare(b.start));

  let candidate = '09:00';
  let conflictReason: string | undefined;

  for (const occ of occupied) {
    if (candidate >= occ.start && candidate < occ.end) {
      candidate = occ.end;
      conflictReason = `${occ.start} - ${occ.end} is already booked/configured (${occ.label})`;
    }
  }

  const [ch, cm] = candidate.split(':').map(Number);
  const endTotalMins = ch * 60 + cm + 30;
  const eh = Math.min(23, Math.floor(endTotalMins / 60));
  const em = endTotalMins % 60;
  const endFormatted = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

  return { startTime: candidate, endTime: candidate >= '17:00' ? candidate : endFormatted, conflictReason };
}

export const EventTypeModal: React.FC<EventTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEventType,
  existingBookings = [],
  existingEventTypes = [],
}) => {
  const { showAlert } = useDialog();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('google_meet');
  const [locationDetails, setLocationDetails] = useState('https://meet.google.com/new');
  const [bufferBefore, setBufferBefore] = useState(5);
  const [bufferAfter, setBufferAfter] = useState(5);

  // Date Availability Settings
  const [dateType, setDateType] = useState<DateAvailabilityType>('indefinite');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  // Custom Time Slots
  const [useCustomSlots, setUseCustomSlots] = useState(false);
  const [customTimeSlots, setCustomTimeSlots] = useState<CustomTimeSlot[]>([
    { start: '09:00', end: '17:00' },
  ]);

  const [customQuestions, setCustomQuestions] = useState<IntakeQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'availability' | 'form'>('details');

  // Availability Form Integration
  const [availableForms, setAvailableForms] = useState<CustomBookingForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('custom');
  const [showAvailabilityFormCustomizer, setShowAvailabilityFormCustomizer] = useState<boolean>(false);
  const [showAvailabilityFormPreview, setShowAvailabilityFormPreview] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getCustomForms().then((forms) => {
        setAvailableForms(forms);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSelectFormInAvailability = (formId: string) => {
    setSelectedFormId(formId);
    if (formId === 'custom') {
      setShowAvailabilityFormCustomizer(true);
    } else {
      const match = availableForms.find((f) => f.id === formId);
      if (match && match.fields) {
        setCustomQuestions([...match.fields]);
      }
    }
  };

  // Today in local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();

  useEffect(() => {
    if (editingEventType) {
      setName(editingEventType.name || '');
      setDuration(editingEventType.duration || 30);
      setColor(editingEventType.color || '#3b82f6');
      setDescription(editingEventType.description || '');
      setLocationType(editingEventType.locationType || 'google_meet');
      setLocationDetails(editingEventType.locationDetails || '');
      setBufferBefore(editingEventType.bufferBefore || 0);
      setBufferAfter(editingEventType.bufferAfter || 0);

      setDateType(editingEventType.dateType || 'indefinite');
      setStartDate(editingEventType.startDate || '');
      setEndDate(editingEventType.endDate || '');
      setSpecificDate(editingEventType.specificDate || '');

      if (editingEventType.customTimeSlots && editingEventType.customTimeSlots.length > 0) {
        setUseCustomSlots(true);
        setCustomTimeSlots(editingEventType.customTimeSlots);
      } else {
        setUseCustomSlots(false);
        setCustomTimeSlots([{ start: '09:00', end: '17:00' }]);
      }

      setCustomQuestions(editingEventType.customQuestions || []);
    } else {
      setName('');
      setDuration(30);
      setColor('#3b82f6');
      setDescription('');
      setLocationType('google_meet');
      setLocationDetails('https://meet.google.com/new');
      setBufferBefore(5);
      setBufferAfter(5);

      setDateType('indefinite');
      setStartDate('');
      setEndDate('');
      setSpecificDate('');

      setUseCustomSlots(false);
      setCustomTimeSlots([{ start: '09:00', end: '17:00' }]);

      setCustomQuestions([
        {
          id: 'q1',
          label: 'What is the primary topic you would like to discuss?',
          type: 'text',
          required: true,
        },
      ]);
    }
  }, [editingEventType, isOpen]);

  // Least Available Start Time State & Dynamic Detection
  const [leastAvailableNotice, setLeastAvailableNotice] = useState<{
    startTime: string;
    endTime: string;
    conflictReason?: string;
  } | null>(null);

  useEffect(() => {
    const targetDate = dateType === 'specific_date' ? specificDate : dateType === 'range' ? startDate : '';
    if (targetDate) {
      const result = findLeastAvailableTime(targetDate, existingBookings, existingEventTypes, editingEventType?.id);
      if (result.conflictReason) {
        setLeastAvailableNotice(result);
        if (!editingEventType) {
          setCustomTimeSlots([{ start: result.startTime, end: result.endTime }]);
          setUseCustomSlots(true);
        }
      } else {
        setLeastAvailableNotice(null);
      }
    } else {
      setLeastAvailableNotice(null);
    }
  }, [dateType, specificDate, startDate, editingEventType, existingBookings, existingEventTypes]);

  if (!isOpen) return null;

  const handleAddCustomSlot = () => {
    let nextStart = '09:00';
    let nextEnd = '17:00';
    if (customTimeSlots.length > 0) {
      const last = customTimeSlots[customTimeSlots.length - 1];
      if (last.end) {
        nextStart = last.end;
        const [h, m] = nextStart.split(':').map(Number);
        const endMins = h * 60 + m + (duration || 30);
        const eh = Math.min(23, Math.floor(endMins / 60));
        const em = endMins % 60;
        nextEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }
    } else if (leastAvailableNotice) {
      nextStart = leastAvailableNotice.startTime;
      nextEnd = leastAvailableNotice.endTime;
    }
    setCustomTimeSlots([...customTimeSlots, { start: nextStart, end: nextEnd }]);
  };

  const handleUpdateCustomSlot = (index: number, updates: Partial<CustomTimeSlot>) => {
    const updated = [...customTimeSlots];
    updated[index] = { ...updated[index], ...updates };
    setCustomTimeSlots(updated);

    // Auto-adjust duration when a single custom window is entered (e.g. 09:00 - 09:10 = 10 mins)
    if (updated.length === 1) {
      const span = getSlotSpanMinutes(updated[0].start, updated[0].end);
      if (span > 0 && (duration === 30 || duration > span)) {
        setDuration(span);
      }
    }
  };

  const handleRemoveCustomSlot = (index: number) => {
    if (customTimeSlots.length <= 1) {
      setUseCustomSlots(false);
      return;
    }
    setCustomTimeSlots(customTimeSlots.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (start: string, end: string) => {
    setUseCustomSlots(true);
    let effectiveStart = start;
    if (leastAvailableNotice && start < leastAvailableNotice.startTime) {
      showAlert({
        title: 'Time Window Adjusted to Earliest Availability',
        message: `The selected preset started at ${start}, but earlier times on this date are already reserved. Start time has been set to the earliest available: ${leastAvailableNotice.startTime}.`,
        type: 'info',
      });
      effectiveStart = leastAvailableNotice.startTime;
    }
    setCustomTimeSlots([{ start: effectiveStart, end }]);
    const span = getSlotSpanMinutes(effectiveStart, end);
    if (span > 0 && duration > span) {
      setDuration(span);
    }
  };

  const handleAddPreset = (start: string, end: string) => {
    setUseCustomSlots(true);
    setCustomTimeSlots([...customTimeSlots, { start, end }]);
  };

  const handleAddQuestion = () => {
    const newQ: IntakeQuestion = {
      id: `q-${Date.now().toString(36)}`,
      label: '',
      type: 'text',
      required: false,
    };
    setCustomQuestions([...customQuestions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<IntakeQuestion>) => {
    const updated = [...customQuestions];
    updated[index] = { ...updated[index], ...updates };
    setCustomQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Strict Past Date Validations
    if (dateType === 'specific_date') {
      if (!specificDate) {
        showAlert({
          title: 'Date Required',
          message: 'Please select a specific date for this event.',
          type: 'warning',
        });
        return;
      }
      if (specificDate < todayStr) {
        showAlert({
          title: 'Invalid Date',
          message: 'Meeting date cannot be in the past. Please select today or an upcoming date.',
          type: 'warning',
        });
        return;
      }
      // Check if custom time slots are already in the past for today
      if (useCustomSlots && specificDate === todayStr) {
        const now = new Date();
        const currentHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const allPast = customTimeSlots.every((s) => s.end <= currentHhMm);
        if (allPast) {
          showAlert({
            title: 'Time Window Passed',
            message: 'All selected time windows for today have already passed. Please select upcoming time slots or an upcoming date.',
            type: 'warning',
          });
          return;
        }
      }
    }

    if (dateType === 'range') {
      if (!startDate || !endDate) {
        showAlert({
          title: 'Date Range Required',
          message: 'Please specify both a start date and an end date.',
          type: 'warning',
        });
        return;
      }
      if (endDate < todayStr) {
        showAlert({
          title: 'Invalid End Date',
          message: 'End date cannot be in the past. Please select today or an upcoming date.',
          type: 'warning',
        });
        return;
      }
      if (endDate < startDate) {
        showAlert({
          title: 'Invalid Range',
          message: 'End date cannot be earlier than start date.',
          type: 'warning',
        });
        return;
      }
    }

    setLoading(true);
    try {
      await onSave({
        name,
        duration: Number(duration),
        color,
        description,
        locationType,
        locationDetails,
        bufferBefore: Number(bufferBefore),
        bufferAfter: Number(bufferAfter),
        dateType,
        startDate: dateType === 'range' ? startDate : undefined,
        endDate: dateType === 'range' ? endDate : undefined,
        specificDate: dateType === 'specific_date' ? specificDate : undefined,
        customTimeSlots: useCustomSlots ? customTimeSlots : undefined,
        customQuestions,
      });
      onClose();
    } catch (err: any) {
      showAlert({
        title: 'Unable to Save Event Type',
        message: err.message || 'Failed to save event type. Please review the configured date and time windows.',
        type: 'error',
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100 z-10 my-8">
        {/* Header Strip with Color */}
        <div className="h-2 w-full" style={{ backgroundColor: color }} />

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                editingEventType ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {editingEventType ? 'Editing Existing' : 'New Setup'}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {editingEventType ? 'Edit Meeting Details' : 'Create New Meeting Details'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingEventType
                ? `Update settings for "${editingEventType.name}". Changes reflect instantly on your booking links.`
                : 'Configure dates, custom time slots, location, buffers, and dynamic intake questions.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveModalTab('details')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition shrink-0 ${
              activeModalTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>1. Meeting Setup & Location</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('availability')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition shrink-0 ${
              activeModalTab === 'availability'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>2. Availability, Slots & Custom Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('form')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition shrink-0 ${
              activeModalTab === 'form'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>3. Dedicated Form Studio ({customQuestions.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DETAILS & LOCATION */}
          {activeModalTab === 'details' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Helpful callout clarifying Event Type vs Booking */}
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900">
                <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Reusable Scheduling Template:</span> Set your meeting duration, available dates, and custom time slots. Invitees pick a specific slot on your booking link or via the <span className="font-semibold text-blue-700">Booking Wizard</span>.
                </div>
              </div>

              {/* Name & Color */}
              <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 30-Minute Discovery Strategy Sync"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Card Theme Color
              </label>
              <div className="mt-2 flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center text-white ${
                      color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                    }`}
                  >
                    {color === c && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
                />
              </div>
            </div>
          </div>

          {/* Duration & Buffers - Perfectly Aligned Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="h-6 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Duration (Mins)
                </label>
                {useCustomSlots && customTimeSlots[0] && getSlotSpanMinutes(customTimeSlots[0].start, customTimeSlots[0].end) > 0 && (
                  <button
                    type="button"
                    onClick={() => setDuration(getSlotSpanMinutes(customTimeSlots[0].start, customTimeSlots[0].end))}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                    title="Match window span"
                  >
                    Match ({getSlotSpanMinutes(customTimeSlots[0].start, customTimeSlots[0].end)}m)
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <select
                  value={[5, 10, 15, 20, 30, 45, 60, 90].includes(duration) && !isCustomDuration ? duration : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomDuration(true);
                    } else {
                      setIsCustomDuration(false);
                      setDuration(Number(e.target.value));
                    }
                  }}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value="custom">Custom minutes...</option>
                </select>
                {(![5, 10, 15, 20, 30, 45, 60, 90].includes(duration) || isCustomDuration) && (
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                    className="h-10 w-20 rounded-xl border border-slate-300 px-2 py-2 text-sm font-bold text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Mins"
                  />
                )}
              </div>
            </div>

            <div>
              <div className="h-6 flex items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Before Buffer (Mins)
                </label>
              </div>
              <select
                value={bufferBefore}
                onChange={(e) => setBufferBefore(Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={0}>0 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>

            <div>
              <div className="h-6 flex items-center">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  After Buffer (Mins)
                </label>
              </div>
              <select
                value={bufferAfter}
                onChange={(e) => setBufferAfter(Number(e.target.value))}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={0}>0 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Description / Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief agenda, preparation notes, or expectations for your invitee..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Location Provider
              </label>
              <select
                value={locationType}
                onChange={(e) => {
                  const val = e.target.value as LocationType;
                  setLocationType(val);
                  if (val === 'google_meet' && (!locationDetails || locationDetails === 'https://meet.google.com/new' || locationDetails.includes('zoom'))) {
                    const r = () => Math.random().toString(36).substring(2, 6);
                    setLocationDetails(`https://meet.google.com/${r()}-${r()}-${r().slice(0, 3)}`);
                  }
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="phone">Phone Call</option>
                <option value="in_person">In-Person Meeting</option>
                <option value="custom">Custom Web Link</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Location Link or Details
                </label>
                {locationDetails && locationDetails.startsWith('http') && (
                  <button
                    type="button"
                    onClick={() => window.open(locationDetails, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    <span>Test link</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="https://meet.google.com/new"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AVAILABILITY & TIME WINDOWS */}
      {activeModalTab === 'availability' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION: DATE & ACTIVE PERIOD */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Date & Booking Availability
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Specify when this event type is available for booking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDateType('indefinite')}
                className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                  dateType === 'indefinite'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                <span className="block font-bold">All Upcoming Dates</span>
                <span className="block text-[10px] text-slate-500 font-normal">Ongoing (Indefinite)</span>
              </button>

              <button
                type="button"
                onClick={() => setDateType('range')}
                className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                  dateType === 'range'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                <span className="block font-bold">Date Range</span>
                <span className="block text-[10px] text-slate-500 font-normal">Between two dates</span>
              </button>

              <button
                type="button"
                onClick={() => setDateType('specific_date')}
                className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                  dateType === 'specific_date'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
                }`}
              >
                <span className="block font-bold">Specific Date</span>
                <span className="block text-[10px] text-slate-500 font-normal">Single one-off date</span>
              </button>
            </div>

            {/* Inputs for Range */}
            {dateType === 'range' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    min={startDate || todayStr}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                  {endDate && endDate < todayStr && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      ⚠️ End date cannot be in the past.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Input for Specific Date */}
            {dateType === 'specific_date' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Specific Meeting Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                {specificDate && specificDate < todayStr && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600">
                    ⚠️ Meeting date cannot be in the past. Please select today or an upcoming date.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION: CUSTOM TIME SLOTS */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Custom Available Time Slots
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomSlots}
                  onChange={(e) => setUseCustomSlots(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Customize Hours</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              {useCustomSlots
                ? 'Define custom start and end time windows for this meeting. This custom time window will be reserved and automatically disabled for any further bookings.'
                : 'Using default host working hours (09:00 AM - 05:00 PM). Check &quot;Customize Hours&quot; to set custom meeting intervals.'}
            </p>

            {useCustomSlots && (
              <div className="space-y-3 pt-1">
                {/* Custom Timing Disabled in Further Booking Banner */}
                <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50 border border-indigo-200/90 p-3 text-xs text-indigo-900">
                  <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div className="leading-snug">
                    <span className="font-bold">Custom Timing Reservation Active:</span>
                    <span className="text-[11px] text-indigo-700 block mt-0.5">
                      Creating or saving this meeting with custom timing reserves this time slot. The time will be strictly disabled in further bookings in the Booking Wizard.
                    </span>
                  </div>
                </div>
                {/* Dynamic Least Available Start Time Suggestion */}
                {leastAvailableNotice && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200/90 p-3 text-xs text-amber-900 animate-fade-in shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Earliest Available Initial Time: {leastAvailableNotice.startTime}</span>
                        <p className="text-[11px] text-amber-700 mt-0.5">{leastAvailableNotice.conflictReason}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomTimeSlots([{ start: leastAvailableNotice.startTime, end: leastAvailableNotice.endTime }])}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 transition active:scale-95 shadow-xs shrink-0"
                    >
                      Apply {leastAvailableNotice.startTime}
                    </button>
                  </div>
                )}

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('09:00', '12:00')}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Sun className="h-3 w-3 text-amber-500" />
                    Morning (9am-12pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('13:00', '17:00')}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Sunset className="h-3 w-3 text-orange-500" />
                    Afternoon (1pm-5pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('17:00', '21:00')}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Evening (5pm-9pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('09:00', '18:00')}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Full Day (9am-6pm)
                  </button>
                </div>

                {/* Slots Windows List */}
                <div className="space-y-2">
                  {customTimeSlots.map((slot, idx) => {
                    const span = getSlotSpanMinutes(slot.start, slot.end);
                    const format12h = (t: string) => {
                      if (!t) return '';
                      const [h, m] = t.split(':').map(Number);
                      const period = h >= 12 ? 'PM' : 'AM';
                      const hour12 = h % 12 || 12;
                      return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
                    };

                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] uppercase font-bold text-slate-500">
                                  Start Time
                                </label>
                                {slot.start && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                    {format12h(slot.start)}
                                  </span>
                                )}
                              </div>
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => handleUpdateCustomSlot(idx, { start: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] uppercase font-bold text-slate-500">
                                  End Time
                                </label>
                                {slot.end && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                    {format12h(slot.end)}
                                  </span>
                                )}
                              </div>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => handleUpdateCustomSlot(idx, { end: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCustomSlot(idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Remove window"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {span > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-indigo-700 bg-indigo-50/60 rounded px-2 py-0.5 font-medium">
                            <span>Window span: <strong>{span} minutes</strong></span>
                            {duration !== span && (
                              <button
                                type="button"
                                onClick={() => setDuration(span)}
                                className="font-bold underline hover:text-indigo-900"
                              >
                                Set duration to {span}m
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddCustomSlot}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Time Window</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Slots generate within these windows
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: CUSTOM INTAKE FORM FOR THIS AVAILABILITY & SLOTS */}
          <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <ClipboardList className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Booking Intake Form for these Slots
                    </h4>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {customQuestions.length} {customQuestions.length === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed">
                    Select or customize the questionnaire invitees must complete when booking these available dates and time slots.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Customize & Preview */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAvailabilityFormCustomizer(!showAvailabilityFormCustomizer)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    showAvailabilityFormCustomizer
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{showAvailabilityFormCustomizer ? 'Hide Form Editor' : 'Customize Form'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAvailabilityFormPreview(!showAvailabilityFormPreview)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    showAvailabilityFormPreview
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{showAvailabilityFormPreview ? 'Hide Preview' : 'Preview Form'}</span>
                </button>
              </div>
            </div>

            {/* Form Selection Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200/80">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Form for this Meeting Slot Availability:
                </label>
                <select
                  value={selectedFormId}
                  onChange={(e) => handleSelectFormInAvailability(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="custom">-- Custom Questions for this Meeting ({customQuestions.length} fields) --</option>
                  {availableForms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.fields?.length || 0} fields) - {f.organizationName || 'Organization'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fields Summary Tags */}
              <div className="sm:col-span-5 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Active Intake Questions:
                </span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                  {customQuestions.map((q) => (
                    <span
                      key={q.id}
                      className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs"
                    >
                      {q.label.length > 22 ? `${q.label.slice(0, 20)}...` : q.label}
                      {q.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  ))}
                  {customQuestions.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No custom fields selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Embedded Form Customizer when open */}
            {showAvailabilityFormCustomizer && (
              <div className="pt-4 border-t border-slate-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-blue-600" />
                    <span>Customize Intake Questions for these Time Slots</span>
                  </h5>
                  <span className="text-[10px] text-slate-400">
                    Add elements or edit labels
                  </span>
                </div>
                <FormBuilder
                  fields={customQuestions}
                  onChange={(updated) => {
                    setCustomQuestions(updated);
                    setSelectedFormId('custom');
                  }}
                  formTitle={name ? `${name} - Intake Details` : 'Slot Booking Form'}
                  formDescription={description || 'Please provide details below before your scheduled session.'}
                  organizationName="Organization Booking"
                  themeColor={color}
                />
              </div>
            )}

            {/* Embedded Live Preview when open */}
            {showAvailabilityFormPreview && !showAvailabilityFormCustomizer && (
              <div className="pt-4 border-t border-slate-200 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  <span>Live Form Preview for Selected Slots</span>
                </div>
                <FormBuilder
                  fields={customQuestions}
                  onChange={setCustomQuestions}
                  formTitle={name ? `${name} - Intake Details` : 'Slot Booking Form'}
                  formDescription={description || 'Please provide details below before your scheduled session.'}
                  organizationName="Organization Booking"
                  themeColor={color}
                  compact
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM INTAKE FORM BUILDER & LIVE PREVIEW */}
      {activeModalTab === 'form' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900 leading-relaxed flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Organization Intake Form Customizer:</strong> Choose and place input elements from the palette below to customize what details you collect from invitees when they book this meeting. Test and preview the form in real time.
            </span>
          </div>

          <FormBuilder
            fields={customQuestions}
            onChange={setCustomQuestions}
            formTitle={name ? `${name} - Intake Form` : 'Meeting Details'}
            formDescription={description || 'Please provide details below before our scheduled session.'}
            organizationName="Meeting Booking Form"
            themeColor={color}
          />
        </div>
      )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingEventType ? 'Update Meeting Details' : 'Create Meeting Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
