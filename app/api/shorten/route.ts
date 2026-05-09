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

    // List of providers to try. TinyURL is primary, but cloud environments (like Render) 
    // are sometimes blocked by TinyURL's classic API. Is.gd is a highly reliable fallback.
    const providers = [
      {
        name: 'TinyURL',
        endpoint: `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
      },
      {
        name: 'Is.gd',
        endpoint: `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`
      }
    ];

    let lastError = null;

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per provider

        const response = await fetch(provider.endpoint, {
          signal: controller.signal,
          headers: {
            // Adding a real-looking User-Agent helps bypass some cloud provider blocks
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/plain, */*',
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const shortUrl = (await response.text()).trim();
          
          if (shortUrl && shortUrl.startsWith('http')) {
            console.log(`${provider.name} success:`, shortUrl);
            return NextResponse.json({ shortUrl, provider: provider.name });
          }
        }
        
        console.warn(`${provider.name} failed with status: ${response.status}`);
      } catch (err: any) {
        lastError = err;
        console.error(`${provider.name} error:`, err.message);
        // Continue to next provider
      }
    }

    // If all providers fail
    return NextResponse.json({ 
      error: 'URL shortening services are currently unavailable in this environment.',
      details: lastError?.message || 'All providers failed'
    }, { status: 502 });

  } catch (error: any) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while shortening URL',
      details: error.message 
    }, { status: 500 });
  }
}
