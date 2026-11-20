import { NextResponse } from 'next/server';
import { getEventType, updateEventType, deleteEventType, getHost } from '@calendly/database';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventType = getEventType(params.id);
    if (!eventType) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }
    const host = getHost();
    return NextResponse.json({ eventType, host });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Conflict Check: Prevent updating this event type to overlap with another event type
    const { getEventTypes } = await import('@calendly/database');
    const existing = getEventTypes();
    if (body.dateType === 'specific_date' && body.specificDate && Array.isArray(body.customTimeSlots) && body.customTimeSlots.length > 0) {
      for (const slot of body.customTimeSlots) {
        if (!slot.start || !slot.end) continue;
        const conflict = existing.find((e) => {
          if (e.id === params.id) return false;
          if (e.dateType === 'specific_date' && e.specificDate === body.specificDate && Array.isArray(e.customTimeSlots)) {
            return e.customTimeSlots.some((s) => slot.start < s.end && slot.end > s.start);
          }
          return false;
        });

        if (conflict) {
          const times = (conflict.customTimeSlots || []).map((s) => `${s.start}-${s.end}`).join(', ');
          return NextResponse.json(
            {
              error: `Conflict: Another meeting named "${conflict.name}" is already configured on ${body.specificDate} for time window (${times}). Cannot set overlapping meeting times.`,
            },
            { status: 409 }
          );
        }
      }
    }

    if (body.locationType === 'google_meet' && (!body.locationDetails || body.locationDetails === 'https://meet.google.com/new')) {
      const randPart = () => Math.random().toString(36).substring(2, 6);
      body.locationDetails = `https://meet.google.com/${randPart()}-${randPart()}-${randPart().slice(0, 3)}`;
    }

    const updated = updateEventType(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteEventType(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
