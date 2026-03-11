import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getClinicPin, setClinicPin } from '@/lib/db';
import { verifyToken } from '@/app/api/auth/verify-pin/route';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPin, newPin } = await request.json();
    if (!currentPin || !newPin) {
      return NextResponse.json({ error: 'Current PIN and new PIN are required' }, { status: 400 });
    }

    if (newPin.length < 4 || newPin.length > 8) {
      return NextResponse.json({ error: 'PIN must be 4-8 digits' }, { status: 400 });
    }

    const storedHash = await getClinicPin();
    if (hashPin(currentPin) !== storedHash) {
      return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
    }

    await setClinicPin(hashPin(newPin));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PIN change error:', error);
    return NextResponse.json({ error: 'Failed to change PIN' }, { status: 500 });
  }
}
