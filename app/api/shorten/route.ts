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

    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const shortUrl = await response.text();
      return NextResponse.json({ shortUrl });
    } else {
      const errorText = await response.text();
      console.error('TinyURL API error status:', response.status, 'Text:', errorText);
      return NextResponse.json({ 
        error: `TinyURL API failed with status ${response.status}`,
        details: errorText.slice(0, 100)
      }, { status: response.status });
    }
  } catch (error: any) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while shortening URL',
      details: error.message 
    }, { status: 500 });
  }
}
