import { NextRequest, NextResponse } from 'next/server';
import { updateTriageRecord, getTriageRecord } from '@/lib/db';
import { verifyToken } from '@/app/api/auth/verify-pin/route';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { triageId, ...updateData } = body;

    if (!triageId) {
      return NextResponse.json({ error: 'Triage ID is required' }, { status: 400 });
    }

    const existing = await getTriageRecord(triageId);
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await updateTriageRecord(triageId, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Triage update error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
