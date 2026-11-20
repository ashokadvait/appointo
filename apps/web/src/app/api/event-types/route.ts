import { NextResponse } from 'next/server';
import { getEventTypes, createEventType } from '@calendly/database';

export async function GET() {
  try {
    const eventTypes = getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (body.dateType === 'specific_date' && body.specificDate && body.specificDate < todayStr) {
      return NextResponse.json(
        { error: 'Cannot create event for a past date. Please select today or an upcoming date.' },
        { status: 400 }
      );
    }

    if (body.dateType === 'range' && body.endDate && body.endDate < todayStr) {
      return NextResponse.json(
        { error: 'End date cannot be in the past. Please select today or an upcoming date.' },
        { status: 400 }
      );
    }

    // Conflict Check: Prevent creating multiple meetings/event-types with the same specific date and overlapping time slots
    const existing = getEventTypes();
    if (body.dateType === 'specific_date' && body.specificDate && Array.isArray(body.customTimeSlots) && body.customTimeSlots.length > 0) {
      for (const slot of body.customTimeSlots) {
        if (!slot.start || !slot.end) continue;
        const conflict = existing.find((e) => {
          if (e.dateType === 'specific_date' && e.specificDate === body.specificDate && Array.isArray(e.customTimeSlots)) {
            return e.customTimeSlots.some((s) => slot.start < s.end && slot.end > s.start);
          }
          return false;
        });

        if (conflict) {
          const times = (conflict.customTimeSlots || []).map((s) => `${s.start}-${s.end}`).join(', ');
          return NextResponse.json(
            {
              error: `Conflict: A meeting named "${conflict.name}" is already configured on ${body.specificDate} for time window (${times}). Cannot create multiple meetings with overlapping time. Please edit the existing meeting or choose another time.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Auto-generate a dedicated Google Meet room if google_meet is selected and details is empty or generic
    if (body.locationType === 'google_meet') {
      if (!body.locationDetails || body.locationDetails === 'https://meet.google.com/new') {
        const randPart = () => Math.random().toString(36).substring(2, 6);
        body.locationDetails = `https://meet.google.com/${randPart()}-${randPart()}-${randPart().slice(0, 3)}`;
      }
    }

    const created = createEventType(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
