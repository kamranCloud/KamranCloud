import { NextRequest, NextResponse } from 'next/server';

// Detect YouTube video or playlist from URL
function detectYouTubeType(url: string): { type: 'video' | 'playlist'; id: string } | null {
  try {
    const urlObj = new URL(url);
    
    // Check for playlist
    if (urlObj.searchParams.has('list')) {
      const playlistId = urlObj.searchParams.get('list');
      if (playlistId) {
        return { type: 'playlist', id: playlistId };
      }
    }
    
    // Check for video
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return { type: 'video', id: videoId };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Detect video or playlist
    const youtubeData = detectYouTubeType(url);
    
    if (!youtubeData) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Fetch video/playlist details using oEmbed API (no API key needed!)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch YouTube details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // For videos, use SD quality thumbnail
    // For playlists, use the thumbnail from oEmbed response
    let thumbnail: string;
    if (youtubeData.type === 'video') {
      thumbnail = `https://img.youtube.com/vi/${youtubeData.id}/sddefault.jpg`;
    } else {
      // oEmbed returns thumbnail_url for playlists
      thumbnail = data.thumbnail_url || '';
    }

    return NextResponse.json({
      success: true,
      type: youtubeData.type,
      id: youtubeData.id,
      title: data.title,
      thumbnail: thumbnail,
      author: data.author_name,
    });
  } catch (error: any) {
    console.error('YouTube info error:', error.message);
    return NextResponse.json(
      { 
        error: 'Failed to fetch YouTube details',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 