import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/google-tokens';

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    return NextResponse.json({ accessToken });
  } catch (error: any) {
    console.error('Failed to get new access token:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Failed to refresh access token',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
} 