import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function diagnose(html: string, status: number) {
  return {
    status,
    htmlLength: html.length,
    // ── Old attributes (pre-redesign) ──────────────────────
    has_data_film_slug:    html.includes('data-film-slug'),
    has_data_film_name:    html.includes('data-film-name'),
    // ── New attributes (current Letterboxd) ────────────────
    has_data_item_slug:    html.includes('data-item-slug'),
    has_data_item_name:    html.includes('data-item-name'),
    has_LazyPoster:        html.includes('LazyPoster'),
    // ── Structural hints ───────────────────────────────────
    has_poster_container:  html.includes('poster-container'),
    has_poster_list:       html.includes('poster-list'),
    has_film_href:         html.includes('/film/'),
    film_href_count:       (html.match(/href="\/film\//g) ?? []).length,
    item_slug_count:       (html.match(/data-item-slug/g) ?? []).length,
    // ── Block signals ──────────────────────────────────────
    has_cf_challenge:      html.includes('cf-browser-verification') || html.includes('Enable JavaScript and cookies'),
    is_tiny_response:      html.length < 20000,
    // ── Sample around "data-item" if present ───────────────
    item_slug_sample: (() => {
      const idx = html.indexOf('data-item-slug');
      return idx >= 0 ? html.slice(Math.max(0, idx - 60), idx + 200) : null;
    })(),
    // ── First 800 chars ───────────────────────────────────
    html_start: html.slice(0, 800),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? 'test';
  const page = searchParams.get('page') ?? '1';

  const url = page === '1'
    ? `https://letterboxd.com/${username}/watchlist/`
    : `https://letterboxd.com/${username}/watchlist/page/${page}/`;

  try {
    // ── Attempt A: bare Node fetch (same as our original code) ──
    const resA = await fetch(url, { headers: BROWSER_HEADERS });
    const htmlA = await resA.text();

    // ── Attempt B: with Referer ──────────────────────────────────
    const resB = await fetch(url, {
      headers: { ...BROWSER_HEADERS, Referer: 'https://letterboxd.com/' },
    });
    const htmlB = await resB.text();

    return NextResponse.json({
      url,
      bare_fetch:     diagnose(htmlA, resA.status),
      with_referer:   diagnose(htmlB, resB.status),
      same_content:   htmlA.length === htmlB.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
