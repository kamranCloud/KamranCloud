import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Prevent Next.js from aggressively caching this route
export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const docRef = adminDb.collection('analytics').doc('site_visits');
        // Atomically increment the visit count
        await docRef.set({ count: FieldValue.increment(1) }, { merge: true });

        // Fetch the new value
        const docSnap = await docRef.get();
        const count = docSnap.data()?.count || 1;

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Error incrementing visits:', error);
        return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const docRef = adminDb.collection('analytics').doc('site_visits');
        const docSnap = await docRef.get();
        const count = docSnap.data()?.count || 0;

        return NextResponse.json({ count });
    } catch (error) {
        console.error('Error fetching visits:', error);
        return NextResponse.json({ error: 'Failed to fetch visit count' }, { status: 500 });
    }
}
