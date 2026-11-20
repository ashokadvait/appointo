import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const targetUrl = data.url;

    if (!targetUrl) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    const testPayload = {
      event: 'booking.created',
      timestamp: new Date().toISOString(),
      payload: {
        booking_id: `bk-test-${Date.now().toString(36)}`,
        event_type: '30-Minute Discovery Call',
        attendee_name: 'Webhook Tester',
        attendee_email: 'tester@example.com',
        meeting_time: new Date(Date.now() + 86400000).toISOString(),
        status: 'confirmed',
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Webhook payload formatted and dispatched successfully',
      targetUrl,
      dispatchedPayload: testPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
