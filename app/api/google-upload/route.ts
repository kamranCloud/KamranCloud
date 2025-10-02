import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// Get fresh access token using refresh token
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

// Find or create folder in Google Drive
async function findOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  try {
    // Search for existing folder
    let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const searchResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: query, fields: 'files(id, name)' },
    });

    // If folder exists, return its ID
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].id;
    }

    // Create new folder
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const createResponse = await axios.post(
      'https://www.googleapis.com/drive/v3/files',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return createResponse.data.id;
  } catch (error) {
    console.error('Error in findOrCreateFolder:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const { fileName, mimeType, fileSize, courseId, yearId, subjectId, chapterId } = await request.json();

    if (!fileName || !courseId || !yearId || !subjectId || !chapterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get fresh access token
    const accessToken = await getAccessToken();

    // Create folder hierarchy: Course > Year > Subject > Chapter
    const courseFolderId = await findOrCreateFolder(accessToken, courseId);
    const yearFolderId = await findOrCreateFolder(accessToken, yearId, courseFolderId);
    const subjectFolderId = await findOrCreateFolder(accessToken, subjectId, yearFolderId);
    const chapterFolderId = await findOrCreateFolder(accessToken, chapterId, subjectFolderId);

    // Initiate resumable upload session
    const metadata = {
      name: fileName,
      parents: [chapterFolderId],
    };

    const initiateResponse = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
          'X-Upload-Content-Length': fileSize || '',
          'Origin': origin || '',
        },
      }
    );

    const uploadUrl = initiateResponse.headers.location;

    // Return upload URL and access token to client
    return NextResponse.json({
      success: true,
      uploadUrl: uploadUrl,
      accessToken: accessToken,
    });
  } catch (error: any) {
    console.error('Upload initialization error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Failed to initialize upload',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
} 