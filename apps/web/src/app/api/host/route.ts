import { NextResponse } from 'next/server';
import { getHost, updateHost } from '@calendly/database';

export async function GET() {
  try {
    const host = getHost();
    return NextResponse.json(host);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const updates = await req.json();
    const updated = updateHost(updates);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
