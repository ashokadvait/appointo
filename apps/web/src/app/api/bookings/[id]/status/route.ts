import { NextResponse } from 'next/server';
import { getBooking, updateBooking, addActivityLog } from '@calendly/database';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const booking = getBooking(params.id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const newStatus = data.status || booking.status;
    const updated = updateBooking(booking.id, { status: newStatus });

    addActivityLog({
      bookingId: booking.id,
      type: `STATUS_UPDATED_${newStatus.toUpperCase()}`,
      recipient: booking.inviteeEmail,
      description: `Booking status changed to ${newStatus}`,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
