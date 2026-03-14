import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getAccessToken } from '@/lib/google-tokens';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl || !fileUrl.includes('drive.google.com')) {
        return NextResponse.json({ error: 'A valid Google Drive file URL is required.' }, { status: 400 });
    }

    const fileIdMatch = fileUrl.match(/file\/d\/(.*?)\//);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      try {
        const accessToken = await getAccessToken();
        await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json({ success: true, message: 'File deleted from Google Drive.' });
      } catch (driveError: any) {
        console.warn(`Could not delete file from Google Drive (fileId: ${fileId}). It might already be deleted.`, driveError.response?.data || driveError.message);
        // Still return success if it's already deleted (404 error)
        if (driveError.response?.status === 404) {
          return NextResponse.json({ success: true, message: 'File was already deleted from Google Drive.' });
        }
        throw driveError; // Re-throw other errors
      }
    } else {
        return NextResponse.json({ error: 'Could not extract file ID from the URL.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in google-delete API:', error);
    return NextResponse.json({ error: 'Failed to delete file from Google Drive.', details: error.message }, { status: 500 });
  }
} 