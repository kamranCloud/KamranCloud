import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAccessToken } from '@/lib/google-tokens';

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    await axios.post(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        role: 'reader',
        type: 'anyone',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({ success: true, message: 'File permissions updated to public.' });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error('Error setting file permissions:', err.response?.data || err.message);
    return NextResponse.json(
      { 
        error: 'Failed to set file permissions',
        details: err.response?.data || err.message 
      },
      { status: 500 }
    );
  }
}
