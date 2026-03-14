import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/google-tokens';

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    return NextResponse.json({ accessToken });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('Failed to get new access token:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to refresh access token',
        details: err.response?.data || err.message 
      },
      { status: 500 }
    );
  }
}