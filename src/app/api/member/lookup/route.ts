import { NextRequest, NextResponse } from 'next/server';
import { findMemberById } from '@/lib/db';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id || id.length !== 9 || !/^\d{9}$/.test(id)) {
    return NextResponse.json(
      { error: 'Invalid Institution ID. Must be a 9-digit number.' },
      { status: 400 }
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
      { status: 500 }
    );
  }
}
