import { NextResponse } from 'next/server';
import { getBookings, getEventType, getEventTypes, getHost, saveBooking, addActivityLog } from '@calendly/database';
import { createDefaultFollowUpPipeline, parseDateTimeInTimezone } from '@calendly/core';
import { Booking } from '@calendly/types';

export async function GET() {
  try {
    const bookings = getBookings();
    return NextResponse.json(bookings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const host = getHost();
    let eventType = data.eventTypeId && data.eventTypeId !== 'default' ? getEventType(data.eventTypeId) : undefined;

    if (!eventType) {
      if (data.eventTypeId && data.eventTypeId !== 'default') {
        return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
      }
      eventType = {
        id: 'default',
        slug: 'meeting',
        name: 'Meeting',
        duration: Number(data.duration) || host?.defaultSlotDuration || 30,
        color: '#3b82f6',
        description: '',
        locationType: 'google_meet',
        locationDetails: 'https://meet.google.com/new',
        bufferBefore: 0,
        bufferAfter: 0,
        dateType: 'indefinite',
        customTimeSlots: [],
        customQuestions: [],
      };
    }

    if (!data.startTime || !data.inviteeName || !data.inviteeEmail) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    const durationMinutes = Number(data.duration) || eventType.duration || 15;
    const start = new Date(data.startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    // Past Date / Time Validation: strictly reject creating meetings in the past
    if (start.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Cannot book meetings for past dates or times. Please select an upcoming slot.' },
        { status: 400 }
      );
    }

    // Conflict Check 1: prevent double booking scheduled bookings
    const existingBookings = getBookings();
    const bufferBeforeMs = (eventType.bufferBefore || 0) * 60 * 1000;
    const bufferAfterMs = (eventType.bufferAfter || 0) * 60 * 1000;
    const startMs = start.getTime();
    const endMs = end.getTime();

    const conflictBooking = existingBookings.find((b) => {
      if (b.status !== 'scheduled') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return (
        startMs - bufferBeforeMs < bEnd &&
        endMs + bufferAfterMs > bStart
      );
    });

    if (conflictBooking) {
      const conflictDate = new Date(conflictBooking.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return NextResponse.json(
        { error: `This time slot is already booked for "${conflictBooking.eventTypeName}" at ${conflictDate}. Please select another time.` },
        { status: 409 }
      );
    }

    // Conflict Check 2: check collision with other meetings configured with custom timing
    const allEventTypes = getEventTypes();
    const targetTimezone = data.inviteeTimezone || host.timezone || 'Asia/Kolkata';
    let dateStr = '';
    try {
      dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: targetTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(start);
    } catch {
      dateStr = start.toISOString().split('T')[0];
    }

    for (const otherEt of allEventTypes) {
      if (otherEt.id === eventType.id) continue;
      const applies =
        (otherEt.dateType === 'specific_date' && otherEt.specificDate === dateStr) ||
        (otherEt.dateType === 'range' && otherEt.startDate && otherEt.endDate && dateStr >= otherEt.startDate && dateStr <= otherEt.endDate);

      if (applies && otherEt.customTimeSlots && otherEt.customTimeSlots.length > 0) {
        const otherBufBeforeMs = (otherEt.bufferBefore || 0) * 60 * 1000;
        const otherBufAfterMs = (otherEt.bufferAfter || 0) * 60 * 1000;
        for (const slot of otherEt.customTimeSlots) {
          const slotStartMs = parseDateTimeInTimezone(dateStr, slot.start, targetTimezone).getTime();
          const slotEndMs = parseDateTimeInTimezone(dateStr, slot.end, targetTimezone).getTime();

          const directOverlap = startMs < slotEndMs && endMs > slotStartMs;
          const bufferOverlap = startMs - bufferBeforeMs < slotEndMs + otherBufAfterMs && endMs + bufferAfterMs > slotStartMs - otherBufBeforeMs;

          if (directOverlap || bufferOverlap) {
            return NextResponse.json(
              { error: `This time slot is disabled because another meeting "${otherEt.name}" is scheduled at this time. Please select another slot.` },
              { status: 409 }
            );
          }
        }
      }
    }

    const bookingId = `bk-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const followUps = createDefaultFollowUpPipeline(start.toISOString(), end.toISOString(), nowIso);

    // Ensure meeting link is never missing
    const randCode = () => Math.random().toString(36).substring(2, 6);
    let resolvedLocation = eventType.locationDetails;
    if (!resolvedLocation || resolvedLocation === 'https://meet.google.com/new') {
      if (eventType.locationType === 'google_meet') {
        resolvedLocation = `https://meet.google.com/${randCode()}-${randCode()}-${randCode().slice(0, 3)}`;
      } else if (eventType.locationType === 'zoom') {
        resolvedLocation = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
      } else {
        resolvedLocation = eventType.locationDetails || 'Phone Call';
      }
    }

    const newBooking: Booking = {
      id: bookingId,
      eventTypeId: eventType.id,
      eventTypeName: eventType.name,
      inviteeName: data.inviteeName,
      inviteeEmail: data.inviteeEmail,
      inviteeTimezone: data.inviteeTimezone || host.timezone,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: resolvedLocation,
      status: 'scheduled',
      customAnswers: data.customAnswers || {},
      createdAt: nowIso,
      followUps,
    };

    saveBooking(newBooking);

    addActivityLog({
      bookingId,
      type: 'BOOKING_CREATED',
      recipient: data.inviteeEmail,
      description: `Booking confirmed for ${eventType.name} on ${start.toDateString()} with automated confirmation sent`,
    });

    return NextResponse.json(
      {
        booking: newBooking,
        icsUrl: `/api/bookings/${bookingId}/ics`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
