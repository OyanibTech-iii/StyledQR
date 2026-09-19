import { NextResponse } from 'next/server';

interface Provider {
  name: string;
  shorten: (url: string) => Promise<string>;
}

const PROVIDERS: Provider[] = [
  // 1. TinyURL - Fast and globally recognized
  {
    name: 'TinyURL',
    shorten: async (url: string) => {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/plain, */*'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`TinyURL HTTP ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('TinyURL returned non-URL response');
    }
  },
  // 2. CleanURI - JSON API, excellent cloud / datacenter reliability
  {
    name: 'CleanURI',
    shorten: async (url: string) => {
      const res = await fetch('https://cleanuri.com/api/v1/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`CleanURI HTTP ${res.status}`);
      const data = await res.json();
      if (data?.result_url && typeof data.result_url === 'string' && data.result_url.startsWith('http')) {
        return data.result_url;
      }
      throw new Error('CleanURI returned invalid data');
    }
  },
  // 3. da.gd - Open privacy-oriented shortener
  {
    name: 'da.gd',
    shorten: async (url: string) => {
      const res = await fetch(`https://da.gd/s?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`da.gd HTTP ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('da.gd returned non-URL response');
    }
  },
  // 4. clck.ru - High-uptime global shortener
  {
    name: 'clck.ru',
    shorten: async (url: string) => {
      const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`clck.ru HTTP ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('clck.ru returned non-URL response');
    }
  },
  // 5. Spoo.me - Modern JSON API
  {
    name: 'Spoo.me',
    shorten: async (url: string) => {
      const res = await fetch('https://spoo.me/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`Spoo.me HTTP ${res.status}`);
      const data = await res.json();
      if (data?.short_url && typeof data.short_url === 'string') {
        return data.short_url.replace(/^http:\/\//i, 'https://');
      }
      throw new Error('Spoo.me returned invalid data');
    }
  },
  // 6. Is.gd
  {
    name: 'Is.gd',
    shorten: async (url: string) => {
      const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`Is.gd HTTP ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Is.gd returned non-URL response');
    }
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return NextResponse.json({ error: 'URL cannot be empty' }, { status: 400 });
    }

    // Automatically prepend https:// if missing protocol (e.g. "google.com" -> "https://google.com")
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    // URL validation
    try {
      const parsed = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json({ error: 'URL must start with http:// or https://' }, { status: 400 });
      }
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return NextResponse.json({ error: 'Please enter a valid domain name (e.g., example.com)' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Please check the address.' }, { status: 400 });
    }

    // Execute providers in parallel with Promise.any to return whichever finishes first
    const winner = await Promise.any(
      PROVIDERS.map(async (provider) => {
        const shortUrl = await provider.shorten(trimmedUrl);
        return { shortUrl, provider: provider.name };
      })
    );

    return NextResponse.json({
      shortUrl: winner.shortUrl,
      provider: winner.provider,
      originalUrl: trimmedUrl
    });

  } catch (error: any) {
    if (error?.errors) {
      const details = (error.errors as Error[]).map(e => e.message).join(', ');
      return NextResponse.json({
        error: 'URL shortening services are currently unreachable. Please try again.',
        details
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'Internal server error while shortening URL',
      details: error.message
    }, { status: 500 });
  }
}
