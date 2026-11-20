import { NextResponse } from 'next/server';
import { getBooking, updateBooking, readDb, writeDb, addActivityLog } from '@calendly/database';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const booking = getBooking(params.id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(booking);
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
    const updated = updateBooking(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    addActivityLog({
      bookingId: params.id,
      type: 'BOOKING_RESCHEDULED',
      recipient: updated.inviteeEmail,
      description: `Meeting details updated for ${updated.eventTypeName} with ${updated.inviteeName}`,
    });

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
    const db = readDb();
    const idx = db.bookings.findIndex((b) => b.id === params.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const removed = db.bookings.splice(idx, 1)[0];
    writeDb(db);

    addActivityLog({
      bookingId: params.id,
      type: 'BOOKING_CANCELLED',
      recipient: removed.inviteeEmail,
      description: `Meeting cancelled for ${removed.eventTypeName}`,
    });

    return NextResponse.json({ success: true, removedId: params.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
