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

    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    
    if (response.ok) {
      const shortUrl = await response.text();
      return NextResponse.json({ shortUrl });
    } else {
      const errorText = await response.text();
      console.error('TinyURL error:', errorText);
      return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
    }
  } catch (error) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
