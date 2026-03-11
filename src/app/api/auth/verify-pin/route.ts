import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { getClinicPin } from '@/lib/db';

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

function generateToken(): string {
  const secret = process.env.DATABASE_URL || 'fallback-secret';
  const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  const hmac = createHmac('sha256', secret).update(String(expiry)).digest('hex');
  return `${expiry}.${hmac}`;
}

export function verifyToken(token: string): boolean {
  if (!token) return false;
  const [expiryStr, hmac] = token.split('.');
  if (!expiryStr || !hmac) return false;
  const expiry = parseInt(expiryStr);
  if (isNaN(expiry) || Date.now() > expiry) return false;
  const secret = process.env.DATABASE_URL || 'fallback-secret';
  const expected = createHmac('sha256', secret).update(String(expiry)).digest('hex');
  return hmac === expected;
}

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const storedHash = await getClinicPin();
    if (!storedHash) {
      return NextResponse.json({ error: 'Clinic PIN not configured' }, { status: 500 });
    }

    if (hashPin(pin) !== storedHash) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = generateToken();
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
