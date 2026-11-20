import { NextResponse } from 'next/server';
import { getBooking, updateBooking, addActivityLog } from '@calendly/database';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const booking = getBooking(params.id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const targetType = data.type || 'manual_followup';
    const nowIso = new Date().toISOString();
    const existing = booking.followUps.find((f) => f.type === targetType);

    if (existing) {
      existing.status = 'sent';
      existing.sentAt = nowIso;
    } else {
      booking.followUps.push({
        type: targetType,
        status: 'sent',
        sentAt: nowIso,
        channel: data.channel || 'email',
        message: data.message,
      });
    }

    updateBooking(booking.id, { followUps: booking.followUps });

    addActivityLog({
      bookingId: booking.id,
      type: `FOLLOWUP_SENT_${targetType.toUpperCase()}`,
      recipient: booking.inviteeEmail,
      description: `Follow-up (${targetType}) dispatched to ${booking.inviteeName}`,
    });

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
