import { NextResponse } from 'next/server';
import { getEventType, getEventTypes, getHost, getBookings, getSchedule } from '@calendly/database';
import { computeAvailableSlots } from '@calendly/core';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get('eventTypeId');
    const date = searchParams.get('date');
    const timezone = searchParams.get('timezone') || undefined;
    const slotDuration = searchParams.get('slotDuration') ? Number(searchParams.get('slotDuration')) : undefined;

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    const host = getHost();
    const bookings = getBookings();
    const allEventTypes = getEventTypes();
    const schedule = getSchedule();

    let eventType = eventTypeId && eventTypeId !== 'default' ? getEventType(eventTypeId) : undefined;
    if (!eventType) {
      if (eventTypeId && eventTypeId !== 'default') {
        return NextResponse.json({ error: 'Event type not found', slots: [] }, { status: 404 });
      }
      eventType = {
        id: 'default',
        slug: 'meeting',
        name: 'Meeting',
        duration: slotDuration || schedule?.defaultSlotDuration || host?.defaultSlotDuration || 30,
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

    const result = computeAvailableSlots(eventType, host, bookings, date, timezone, allEventTypes, slotDuration, schedule);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
