import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return new NextResponse('Google OAuth not configured properly in environment variables.', { status: 500 });
  }

  // Construct the Google OAuth 2.0 authorization URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent', // Force consent screen to always get a fresh refresh token
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Debug mode: return the URL instead of redirecting
  const urlObj = new URL(request.url);
  if (urlObj.searchParams.get('debug') === '1') {
    return NextResponse.json({ authUrl, redirectUri: GOOGLE_REDIRECT_URI, clientId: GOOGLE_CLIENT_ID });
  }

  // Redirect the user to the authorization URL
  return NextResponse.redirect(authUrl);
}
