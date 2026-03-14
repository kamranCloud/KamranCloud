import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import { getAccessToken } from '@/lib/google-tokens';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminApp.auth().verifyIdToken(token);

    const { contentItem } = await request.json();
    const { courseId, yearId, subjectId, chapterId, ...contentObject } = contentItem;

    if (!courseId || !yearId || !subjectId || !chapterId || !contentObject?.id) {
      return NextResponse.json({ error: 'Missing required content fields' }, { status: 400 });
    }

    if (contentObject.type === 'notes' && typeof contentObject.url === 'string' && contentObject.url.includes('drive.google.com')) {
      const fileIdMatch = contentObject.url.match(/file\/d\/(.*?)\//);
      if (fileIdMatch?.[1]) {
        try {
          const accessToken = await getAccessToken();
          await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileIdMatch[1]}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (driveError: unknown) {
          const driveErr = driveError as { response?: { data?: unknown }; message?: string };
          console.warn('Could not delete file from Google Drive.', driveErr.response?.data || driveErr.message);
        }
      }
    }

    const chapterRef = adminDb
      .collection('courses').doc(courseId)
      .collection('years').doc(yearId)
      .collection('subjects').doc(subjectId)
      .collection('chapters').doc(chapterId);

    const chapterSnap = await chapterRef.get();
    if (!chapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const existingContent = Array.isArray(chapterSnap.data()?.content) ? chapterSnap.data()?.content : [];
    const updatedContent = existingContent.filter((item: { id: string }) => item.id !== contentObject.id);

    await chapterRef.update({ content: updatedContent });

    return NextResponse.json({ success: true, message: 'Content deleted successfully.' });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content.', details: err.message }, { status: 500 });
  }
}
