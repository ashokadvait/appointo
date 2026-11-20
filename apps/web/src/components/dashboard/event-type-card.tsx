'use client';

import React, { useState } from 'react';
import { EventType } from '@calendly/types';
import { Clock, Video, Phone, MapPin, Copy, ExternalLink, Edit2, Trash2, Check, ShieldCheck, Calendar, CalendarCheck } from 'lucide-react';

interface EventTypeCardProps {
  eventType: EventType;
  bookingCount?: number;
  onEdit: (eventType: EventType) => void;
  onDelete: (id: string) => void;
  onPreview: (eventType: EventType) => void;
  onNotify: (msg: string) => void;
  onViewBookings?: (eventType: EventType) => void;
}

export const EventTypeCard: React.FC<EventTypeCardProps> = ({
  eventType,
  bookingCount = 0,
  onEdit,
  onDelete,
  onPreview,
  onNotify,
  onViewBookings,
}) => {
  const [copied, setCopied] = useState(false);
  const [meetCopied, setMeetCopied] = useState(false);

  const meetUrl =
    eventType.locationDetails ||
    (eventType.locationType === 'google_meet' ? 'https://meet.google.com/new' : '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const url = `${window.location.origin}/book?id=${eventType.id}&timezone=${encodeURIComponent(userTz)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    onNotify(`Share link copied: /book?id=${eventType.id}&timezone=${userTz}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMeet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!meetUrl) return;
    navigator.clipboard.writeText(meetUrl);
    setMeetCopied(true);
    onNotify(`Meeting link copied to clipboard: ${meetUrl}`);
    setTimeout(() => setMeetCopied(false), 2000);
  };

  const handleOpenMeet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meetUrl) {
      window.open(meetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const url = `${window.location.origin}/book?id=${eventType.id}&timezone=${encodeURIComponent(userTz)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onPreview(eventType);
  };

  const renderLocationIcon = () => {
    switch (eventType.locationType) {
      case 'google_meet':
      case 'zoom':
        return <Video className="h-3.5 w-3.5 text-blue-600" />;
      case 'phone':
        return <Phone className="h-3.5 w-3.5 text-emerald-600" />;
      default:
        return <MapPin className="h-3.5 w-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      {/* Brand Color Top Banner */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
        style={{ backgroundColor: eventType.color || '#3b82f6' }}
      />

      <div>
        {/* Header Ribbon */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {eventType.duration} mins
            </span>

            {/* Location Type Badge */}
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 capitalize border border-blue-200/50">
              {renderLocationIcon()}
              {eventType.locationType.replace('_', ' ')}
            </span>

            {/* Bookings Count Badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewBookings?.(eventType);
              }}
              title={
                bookingCount > 0
                  ? `${bookingCount} appointment${bookingCount === 1 ? '' : 's'} scheduled for this event type. Click to view.`
                  : '0 appointments scheduled yet'
              }
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
                bookingCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                  : 'bg-slate-50 text-slate-500 border border-slate-200/60'
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>
                {bookingCount} {bookingCount === 1 ? 'Booking' : 'Bookings'}
              </span>
            </button>
          </div>

          {/* Prominent Action Buttons: Explicit Edit and Delete */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(eventType)}
              title="Edit Meeting Details"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
            >
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(eventType.id)}
              title="Delete Event Type"
              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition">
          {eventType.name}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {eventType.description || 'No description provided.'}
        </p>

        {/* Prominent Meeting Link Box - Ensures Meeting Link is Never Missing */}
        <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl bg-blue-50/70 border border-blue-200/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {renderLocationIcon()}
            <div className="truncate">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Meeting Link / Details
              </span>
              <span className="block font-semibold text-blue-700 truncate" title={meetUrl || 'Location details'}>
                {meetUrl || (eventType.locationType === 'phone' ? 'Phone Call' : 'Auto-generated upon booking')}
              </span>
            </div>
          </div>
          {meetUrl && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyMeet}
                title="Copy Meeting Link"
                className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100 transition"
              >
                {meetCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleOpenMeet}
                title="Open / Test Meeting Link"
                className="rounded-md p-1.5 text-blue-600 hover:bg-blue-100 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Buffers, Dates & Intake Questions info */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            Buffer: +{eventType.bufferBefore || 0}m / +{eventType.bufferAfter || 0}m
          </span>

          {eventType.dateType === 'specific_date' && eventType.specificDate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-700 font-semibold border border-amber-200/60">
              <Calendar className="h-3 w-3" />
              {eventType.specificDate}
            </span>
          )}

          {eventType.dateType === 'range' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-purple-700 font-semibold border border-purple-200/60">
              <Calendar className="h-3 w-3" />
              {eventType.startDate || 'Any'} to {eventType.endDate || 'Any'}
            </span>
          )}

          {eventType.customTimeSlots && eventType.customTimeSlots.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700 font-semibold border border-indigo-200/60">
              <Clock className="h-3 w-3" />
              {eventType.customTimeSlots.length} custom {eventType.customTimeSlots.length === 1 ? 'window' : 'windows'}
            </span>
          )}

          {eventType.dateType === 'specific_date' && eventType.customTimeSlots && eventType.customTimeSlots.length > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-bold border border-emerald-200/60 text-[10px]"
              title="This custom timing is reserved and disabled for other bookings in Booking Wizard"
            >
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Reserved in Booking Wizard
            </span>
          )}

          {eventType.customQuestions && eventType.customQuestions.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 font-semibold">
              {eventType.customQuestions.length} intake {eventType.customQuestions.length === 1 ? 'question' : 'questions'}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          {bookingCount > 0 && onViewBookings && (
            <button
              onClick={() => onViewBookings(eventType)}
              title="View all appointments booked for this event type"
              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95"
            >
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>View ({bookingCount})</span>
            </button>
          )}
        </div>

        <button
          onClick={handleBookNow}
          title="Open live invitee booking page in new tab to test or book"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20"
        >
          <span>Book Now</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
