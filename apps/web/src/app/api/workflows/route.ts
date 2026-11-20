import { NextResponse } from 'next/server';
import { getWorkflows, updateWorkflows } from '@calendly/database';

export async function GET() {
  try {
    const workflows = getWorkflows();
    return NextResponse.json(workflows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const updates = await req.json();
    const updated = updateWorkflows(updates);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
