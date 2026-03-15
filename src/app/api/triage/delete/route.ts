import { NextRequest, NextResponse } from 'next/server';
import { deleteTriageRecord, deleteMemberHistory, getTriageRecord } from '@/lib/db';
import { verifyToken } from '@/app/api/auth/verify-pin/route';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { triageId, institutionId, deleteAll } = await request.json();

    if (deleteAll && institutionId) {
      await deleteMemberHistory(institutionId);
      return NextResponse.json({ success: true, message: 'All history deleted' });
    }

    if (!triageId) {
      return NextResponse.json({ error: 'Triage ID is required' }, { status: 400 });
    }

    const existing = await getTriageRecord(triageId);
    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await deleteTriageRecord(triageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Triage delete error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
