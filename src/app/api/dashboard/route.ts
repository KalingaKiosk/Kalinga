import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentTriageRecords,
  getFlaggedRecords,
  getMemberHistory,
  getDashboardStats,
  getPendingReviewRecords, // Add this import
} from '@/lib/db.ts';

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get('view') || 'recent';
  const id = request.nextUrl.searchParams.get('id');

  try {
    if (view === 'stats') {
      const stats = await getDashboardStats();
      return NextResponse.json(stats);
    }

    if (view === 'flagged') {
      const records = await getFlaggedRecords();
      return NextResponse.json({ records });
    }

    if (view === 'pending') { // New pending review view
      const records = await getPendingReviewRecords();
      return NextResponse.json({ records });
    }

    if (view === 'history' && id) {
      const records = await getMemberHistory(id);
      return NextResponse.json({ records });
    }

    const records = await getRecentTriageRecords();
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
