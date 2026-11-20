import { NextResponse } from 'next/server';
import { getCustomForms, saveCustomForm } from '@calendly/database';

export async function GET() {
  try {
    const forms = getCustomForms();
    return NextResponse.json(forms);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Form title is required' }, { status: 400 });
    }
    const saved = saveCustomForm(body);
    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

