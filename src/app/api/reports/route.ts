import { NextRequest, NextResponse } from 'next/server';
import { getDailyReport, getMonthlyReport, getMonthlyStats, getMemberHistory, findMemberById } from '@/lib/db';
import { verifyToken } from '@/app/api/auth/verify-pin/route';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    const date = request.nextUrl.searchParams.get('date');
    const month = request.nextUrl.searchParams.get('month');
    const id = request.nextUrl.searchParams.get('id');
    const role = request.nextUrl.searchParams.get('role') || 'all';

    if (type === 'daily' && date) {
      const records = await getDailyReport(date, role);
      const total = records.length;
      const flagged = records.filter((r) => r.flags && r.flags !== '').length;
      const dispositions: Record<string, number> = {};
      for (const r of records) {
        const d = (r as { disposition?: string }).disposition;
        if (d) dispositions[d] = (dispositions[d] || 0) + 1;
      }
      return NextResponse.json({ records, stats: { total, flagged, dispositions } });
    }

    if (type === 'monthly' && month) {
      const stats = await getMonthlyStats(month, role);
      const records = await getMonthlyReport(month, role);
      return NextResponse.json({ records, stats });
    }

    if (type === 'individual' && id) {
      const member = await findMemberById(id);
      const records = await getMemberHistory(id);
      return NextResponse.json({ member, records });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
