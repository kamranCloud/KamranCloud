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

    const { courseId, yearId, subjectId, chapterId, pendingContents } = await request.json();

    if (!courseId || !yearId || !subjectId || !chapterId) {
      return NextResponse.json({ error: 'Missing location fields' }, { status: 400 });
    }

    if (!Array.isArray(pendingContents) || pendingContents.length === 0) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const chapterRef = adminDb
      .collection('courses')
      .doc(courseId)
      .collection('years')
      .doc(yearId)
      .collection('subjects')
      .doc(subjectId)
      .collection('chapters')
      .doc(chapterId);

    const chapterSnap = await chapterRef.get();

    if (!chapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const existingContent = Array.isArray(chapterSnap.data()?.content) ? chapterSnap.data()?.content : [];

    await chapterRef.update({
      content: [...existingContent, ...pendingContents],
    });

    return NextResponse.json({ success: true, count: pendingContents.length });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error submitting content:', error);
    return NextResponse.json(
      { error: 'Failed to submit content', details: err.message },
      { status: 500 }
    );
  }
}
