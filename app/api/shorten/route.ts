import { NextResponse } from 'next/server';

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

    // Use a direct fetch to TinyURL's classic API for maximum reliability
    // Added a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TinyURL API responded with status: ${response.status}`);
      }

      const shortUrl = await response.text();
      
      console.log('TinyURL response:', shortUrl);
      
      if (shortUrl && shortUrl.startsWith('http')) {
        return NextResponse.json({ shortUrl });
      } else {
        console.error('TinyURL returned invalid response:', shortUrl);
        return NextResponse.json({ error: 'TinyURL returned an invalid response format' }, { status: 500 });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: 'TinyURL service timed out' }, { status: 504 });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while shortening URL',
      details: error.message 
    }, { status: 500 });
  }
}
