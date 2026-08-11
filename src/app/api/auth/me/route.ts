import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: session }, { status: 200 });
  } catch (e) {
    console.error('Session retrieval error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
