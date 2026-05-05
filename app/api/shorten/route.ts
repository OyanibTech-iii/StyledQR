import { NextResponse } from 'next/server';
import TinyURL from 'tinyurl-api';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Please include http:// or https://' }, { status: 400 });
    }

    console.log('Attempting to shorten URL:', url);
    const shortUrl = await TinyURL(url);
    console.log('TinyURL response:', shortUrl);
    
    if (shortUrl && typeof shortUrl === 'string' && shortUrl.startsWith('http')) {
      return NextResponse.json({ shortUrl });
    } else {
      console.error('TinyURL returned invalid response:', shortUrl);
      return NextResponse.json({ error: 'TinyURL returned an invalid response' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while shortening URL',
      details: error.message 
    }, { status: 500 });
  }
}
