import { NextRequest, NextResponse } from 'next/server';
import { updateMember, findMemberById } from '@/lib/db';
import { verifyToken } from '@/app/api/auth/verify-pin/route';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { institutionId, member_name, sex, age, grade_level, section, department, address, contact_number, guardian_name, guardian_contact, allergies } = await request.json();
    if (!institutionId) {
      return NextResponse.json({ error: 'Institution ID is required' }, { status: 400 });
    }

    const existing = await findMemberById(institutionId);
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await updateMember(institutionId, { member_name, sex, age, grade_level, section, department, address, contact_number, guardian_name, guardian_contact, allergies });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Member update error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
