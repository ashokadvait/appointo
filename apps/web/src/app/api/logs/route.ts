import { NextResponse } from 'next/server';
import { getActivityLogs } from '@calendly/database';

export async function GET() {
  try {
    const logs = getActivityLogs();
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
