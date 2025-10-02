import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function getAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google credentials not configured');
  }
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  return response.data.access_token;
}

const cleanObject = (obj: any) => JSON.parse(JSON.stringify(obj));

export async function POST(request: NextRequest) {
  try {
    const { contentItem } = await request.json();
    const { courseId, yearId, subjectId, chapterId, chapterName, ...contentObject } = contentItem;

    if (contentObject.type === 'notes' && contentObject.url.includes('drive.google.com')) {
      const fileIdMatch = contentObject.url.match(/file\/d\/(.*?)\//);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileId = fileIdMatch[1];
        try {
          const accessToken = await getAccessToken();
          await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (driveError: any) {
          console.warn(`Could not delete file from Google Drive (fileId: ${fileId}). It might already be deleted.`, driveError.response?.data || driveError.message);
        }
      }
    }

    const chapterRef = doc(db, `courses/${courseId}/years/${yearId}/subjects/${subjectId}/chapters/${chapterId}`);
    
    await updateDoc(chapterRef, {
      content: arrayRemove(cleanObject(contentObject))
    });

    return NextResponse.json({ success: true, message: 'Content deleted successfully.' });

  } catch (error: any) {
    console.error('Error in delete-content API:', error);
    return NextResponse.json({ error: 'Failed to delete content.', details: error.message }, { status: 500 });
  }
} 