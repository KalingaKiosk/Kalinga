import { NextRequest, NextResponse } from 'next/server';
import { findMemberById } from '@/lib/db';
import { isValidIdAnyRole } from '@/lib/id-validation';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id || !isValidIdAnyRole(id)) {
    return NextResponse.json(
      { error: 'Invalid ID. Must be a 7-digit (employee) or 9-digit (student) number.' },
      { status: 400 },
    );
  }

  try {
    const member = await findMemberById(id);
    if (member) {
      return NextResponse.json({ found: true, member });
    }
    return NextResponse.json({ found: false, member: null });
  } catch (error) {
    console.error('Member lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up member. Please try again.' },
      { status: 500 },
    );
  }
}
