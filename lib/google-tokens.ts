import axios from 'axios';
import { adminDb } from '@/lib/firebase-admin';

export async function saveRefreshToken(token: string) {
  const ref = adminDb.collection('settings').doc('googleAuth');
  await ref.set({ refreshToken: token }, { merge: true });
}

export async function getRefreshTokenFromDb(): Promise<string | null> {
  try {
    const snap = await adminDb.collection('settings').doc('googleAuth').get();
    if (snap.exists && snap.data()?.refreshToken) {
      return snap.data()?.refreshToken as string;
    }
  } catch (e) {
    console.error("Error reading refresh token from DB", e);
  }
  return process.env.GOOGLE_REFRESH_TOKEN || null;
}

export async function getAccessToken(): Promise<string> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REFRESH_TOKEN = await getRefreshTokenFromDb();

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google credentials or refresh token not configured. Please authorize the app first.');
  }

  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  return response.data.access_token;
}
