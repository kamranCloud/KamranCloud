import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new NextResponse('Authorization code is missing.', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return new NextResponse('Google OAuth not configured properly.', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token } = tokenResponse.data;

    if (!refresh_token) {
      const html = `
        <html>
          <head><title>Refresh Token Missing</title></head>
          <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #d32f2f;">⚠️ Refresh Token Not Received</h1>
            <p>This usually happens if you've already authorized this app before.</p>
            <h3>To fix this:</h3>
            <ol>
              <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
              <li>Remove "Kamran's Cloud - Drive Upload" from the list</li>
              <li>Try the authorization again: <a href="/api/google-auth">/api/google-auth</a></li>
            </ol>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Display the refresh token to the user
    const html = `
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .token-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
            .success { color: #4caf50; }
            code { background: #e8f5e9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            button { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #45a049; }
          </style>
        </head>
        <body>
          <h1 class="success">✅ Authorization Successful!</h1>
          <p>Copy the refresh token below and add it to your <code>.env.local</code> file:</p>
          
          <div class="token-box">
            <strong>Your Refresh Token:</strong><br><br>
            <code id="refreshToken">${refresh_token}</code>
          </div>

          <button onclick="copyToken()">📋 Copy Refresh Token</button>

          <h3>Next Steps:</h3>
          <ol>
            <li>Open your <code>.env.local</code> file</li>
            <li>Add: <code>GOOGLE_REFRESH_TOKEN="${refresh_token}"</code></li>
            <li>Save the file and restart your dev server</li>
            <li>Add the same variable to Vercel environment variables for production</li>
          </ol>

          <p><a href="/admin/add">← Back to Admin Panel</a></p>

          <script>
            function copyToken() {
              const token = document.getElementById('refreshToken').innerText;
              navigator.clipboard.writeText(token).then(() => {
                alert('✅ Refresh token copied to clipboard!');
              });
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return new NextResponse('Failed to get authorization tokens.', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
} 