import { NextResponse } from 'next/server';
import { getBooking, getHost } from '@calendly/database';
import { generateIcs } from '@calendly/core';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const booking = getBooking(params.id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const host = getHost();
    const icsContent = generateIcs(booking, host);

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${booking.id}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
