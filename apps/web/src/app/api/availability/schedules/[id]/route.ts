import { NextResponse } from 'next/server';
import { getSchedule, updateSchedule } from '@calendly/database';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schedule = getSchedule(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }
    return NextResponse.json(schedule);
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
    const updated = updateSchedule(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Attempt to also sync with Prisma/Express backend in background (best-effort)
    try {
      fetch(`http://localhost:4000/api/availability/schedules/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    } catch {}

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
