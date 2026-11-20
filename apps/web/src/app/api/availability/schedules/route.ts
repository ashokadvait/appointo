import { NextResponse } from 'next/server';
import { getSchedules, updateSchedule } from '@calendly/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const schedules = getSchedules();
    return NextResponse.json(schedules);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || `sch-${Date.now().toString(36)}`;
    const saved = updateSchedule(id, body);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
