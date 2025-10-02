import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
    hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
  };

  const allConfigured = Object.values(config).every(v => v);

  return NextResponse.json({
    configured: allConfigured,
    details: config,
    message: allConfigured 
      ? '✅ All Google credentials are configured!' 
      : '❌ Some Google credentials are missing. Check .env.local file.',
  });
} 