import { NextRequest, NextResponse } from 'next/server';
import { adminApp, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await adminApp.auth().verifyIdToken(token);

    const { originalLocation, newLocation, originalContentId, updatedContent } = await request.json();

    if (!originalLocation || !newLocation || !originalContentId || !updatedContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const oldChapterRef = adminDb
      .collection('courses').doc(originalLocation.courseId)
      .collection('years').doc(originalLocation.yearId)
      .collection('subjects').doc(originalLocation.subjectId)
      .collection('chapters').doc(originalLocation.chapterId);

    const newChapterRef = adminDb
      .collection('courses').doc(newLocation.courseId)
      .collection('years').doc(newLocation.yearId)
      .collection('subjects').doc(newLocation.subjectId)
      .collection('chapters').doc(newLocation.chapterId);

    const [oldChapterSnap, newChapterSnap] = await Promise.all([oldChapterRef.get(), newChapterRef.get()]);

    if (!oldChapterSnap.exists || !newChapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const oldContent = Array.isArray(oldChapterSnap.data()?.content) ? oldChapterSnap.data()?.content : [];
    const newContent = Array.isArray(newChapterSnap.data()?.content) ? newChapterSnap.data()?.content : [];

    const removedFromOld = oldContent.filter((item: any) => item.id !== originalContentId);

    if (originalLocation.courseId === newLocation.courseId &&
        originalLocation.yearId === newLocation.yearId &&
        originalLocation.subjectId === newLocation.subjectId &&
        originalLocation.chapterId === newLocation.chapterId) {
      const replacedContent = oldContent.map((item: any) => item.id === originalContentId ? updatedContent : item);
      await oldChapterRef.update({ content: replacedContent });
    } else {
      await Promise.all([
        oldChapterRef.update({ content: removedFromOld }),
        newChapterRef.update({ content: [...newContent, updatedContent] }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content', details: error.message }, { status: 500 });
  }
}
