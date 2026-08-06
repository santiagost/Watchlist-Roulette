import * as cheerio from 'cheerio';
import { LetterboxdFilm } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 
 * Parse film list from HTML using multiple selector strategies.
 * Returns films found + which strategy worked.
 */
function parseFilmsFromHtml(html: string): {
  films: LetterboxdFilm[];
  strategy: string;
} {
  const $ = cheerio.load(html);
  const films: LetterboxdFilm[] = [];
  let strategy = 'none';

  // ── Strategy 0: current structure — LazyPoster react-component ──
  // Letterboxd rewrote posters as <div data-component-class="LazyPoster">
  // with data-item-slug / data-item-name="Title (YYYY)" (name+year combined).
  $('[data-item-slug]').each((_, el) => {
    const slug = $(el).attr('data-item-slug');
    const rawName = $(el).attr('data-item-full-display-name') ?? $(el).attr('data-item-name');
    if (!slug || !rawName) return;

    // rawName looks like "Three Billboards Outside Ebbing, Missouri (2017)"
    const match = rawName.match(/^(.*)\s\((\d{4})\)$/);
    const name = match ? match[1] : rawName;
    const year = match ? parseInt(match[2], 10) : undefined;

    if (!films.find((f) => f.slug === slug)) {
      films.push({ slug, name, year });
    }
  });

  if (films.length > 0) return { films, strategy: 'data-item-slug' };

  // ── Strategy 1: Standard data-film-slug on div ─────────────
  $('div[data-film-slug]').each((_, el) => {
    const slug = $(el).attr('data-film-slug');
    const name = $(el).attr('data-film-name') ?? $(el).attr('data-film-slug-name');
    const yearStr = $(el).attr('data-film-release-year');
    const letterboxdId = $(el).attr('data-film-id');

    if (slug && name && !films.find((f) => f.slug === slug)) {
      films.push({
        slug,
        name,
        year: yearStr ? parseInt(yearStr, 10) : undefined,
        letterboxdId,
      });
    }
  });

  if (films.length > 0) return { films, strategy: 'data-film-slug' };

  // ── Strategy 2: li[data-target-link] ───────────────────────
  $('li[data-target-link]').each((_, el) => {
    const targetLink = $(el).attr('data-target-link') ?? '';
    const slugMatch = targetLink.match(/^\/film\/([^/]+)\//);
    if (!slugMatch) return;

    const slug = slugMatch[1];
    const name =
      $(el).find('img').attr('alt') ||
      $(el).find('[data-film-name]').attr('data-film-name') ||
      slug.replace(/-+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (!films.find((f) => f.slug === slug)) {
      films.push({ slug, name });
    }
  });

  if (films.length > 0) return { films, strategy: 'li[data-target-link]' };

  // ── Strategy 3: <a href="/film/SLUG/"> inside a poster/list context ──
  // We restrict to elements inside a poster-list or content area 
  // to avoid picking up nav/sidebar film links
  const listContainer = 
    $('ul.poster-list, .js-list-entries, [data-js="poster-list"], #content .films-list, .watchlist-content').first();

  const searchRoot = listContainer.length > 0 ? listContainer : $('body');

  searchRoot.find('a[href^="/film/"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const slugMatch = href.match(/^\/film\/([^/]+)\/$/);
    if (!slugMatch) return;

    const slug = slugMatch[1];
    const name =
      $(el).find('img').attr('alt') ||
      $(el).attr('title') ||
      slug.replace(/-+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (!films.find((f) => f.slug === slug)) {
      films.push({ slug, name });
    }
  });

  if (films.length > 0) return { films, strategy: 'a[href^="/film/"]' };

  strategy = 'none';
  return { films, strategy };
}

/** Check if response looks like a real Cloudflare JS challenge page */
function isCloudflareChallenge(html: string): boolean {
  // Only true CF challenge pages — NOT regular 403s from Letterboxd or ScraperAPI
  return (
    html.includes('cf-browser-verification') ||
    html.includes('Enable JavaScript and cookies to continue') ||
    (html.includes('Just a moment') && html.length < 20000)
  );
}

/** Check if page indicates a private/inaccessible profile */
function isPrivateProfile(html: string): boolean {
  const $ = cheerio.load(html);
  // Letterboxd shows a specific message or empty state for private profiles
  return (
    $('section.error').length > 0 ||
    html.includes('This member has set their account to private') ||
    html.includes('is not public') ||
    (html.includes('watchlist') && html.includes('not available'))
  );
}

/** Check if a successful page has no films at all (truly empty watchlist) */
function hasNoFilms(html: string): boolean {
  const $ = cheerio.load(html);
  return (
    $('section.watchlist-empty, .empty-watchlist, .no-results').length > 0 ||
    html.includes('No films in your watchlist') ||
    html.includes('hasn\'t added any films')
  );
}

/** 
 * Check for a "next" page link — handles multiple known Letterboxd pagination patterns
 */
function detectNextPage(html: string): boolean {
  const $ = cheerio.load(html);
  return (
    $('a.next').length > 0 ||
    $('link[rel="next"]').length > 0 ||
    $('[data-js="load-more-button"]').length > 0
  );
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
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

/**
 * Fetch a Letterboxd watchlist page directly.
 *
 * The issue that led us to try ScraperAPI was a false negative:
 * the code was looking for `data-film-slug` which Letterboxd renamed to
 * `data-item-slug`. A plain Node.js fetch returns the full HTML including
 * all film data — no proxy or external service needed.
 */
async function fetchPage(username: string, page: number): Promise<{
  html: string;
  status: number;
  strategy: string;
}> {
  const url =
    page === 1
      ? `https://letterboxd.com/${username}/watchlist/`
      : `https://letterboxd.com/${username}/watchlist/page/${page}/`;

  const res = await fetch(url, { headers: BROWSER_HEADERS });
  const html = await res.text();
  return { html, status: res.status, strategy: 'direct' };
}

export async function getFullWatchlist(username: string): Promise<{
  films: LetterboxdFilm[];
  errorCode?: 'USER_NOT_FOUND' | 'PRIVATE_WATCHLIST' | 'EMPTY_WATCHLIST' | 'FETCH_ERROR' | 'CLOUDFLARE_BLOCK';
  debugInfo?: object;
}> {
  const allFilms: LetterboxdFilm[] = [];
  let page = 1;
  let hasMore = true;
  const MAX_PAGES = 50; // guard against infinite pagination loops
  const debugPages: object[] = [];
  try {
    while (hasMore && page <= MAX_PAGES) {
      const { html, status, strategy: fetchStrategy } = await fetchPage(username, page);

      if (status === 404) {
        return { films: [], errorCode: 'USER_NOT_FOUND' };
      }

      if (status !== 200) {
        return { films: [], errorCode: 'FETCH_ERROR', debugInfo: { status, page } };
      }

      if (isCloudflareChallenge(html)) {
        return {
          films: [],
          errorCode: 'CLOUDFLARE_BLOCK',
          debugInfo: { page, fetchStrategy, htmlLength: html.length, htmlStart: html.slice(0, 300) },
        };
      }

      if (page === 1 && isPrivateProfile(html)) {
        return { films: [], errorCode: 'PRIVATE_WATCHLIST' };
      }

      const { films, strategy: parseStrategy } = parseFilmsFromHtml(html);
      const hasNextPage = detectNextPage(html);

      debugPages.push({
        page,
        fetchStrategy,
        parseStrategy,
        filmsFound: films.length,
        hasNextPage,
        htmlLength: html.length,
      });

      // First page with 0 results
      if (page === 1 && films.length === 0) {
        if (hasNoFilms(html)) {
          return { films: [], errorCode: 'EMPTY_WATCHLIST' };
        }
        // Return debug info so we can diagnose the issue
        return {
          films: [],
          errorCode: 'FETCH_ERROR',
          debugInfo: {
            message: 'Films not found in HTML — possible structure change',
            page,
            fetchStrategy,
            htmlLength: html.length,
            hasDataFilm: html.includes('data-film'),
            hasFilmHref: html.includes('/film/'),
            filmHrefCount: (html.match(/href="\/film\//g) || []).length,
            htmlSample: html.slice(50000, 53000), // middle of doc
            debugPages,
          },
        };
      }
      allFilms.push(...films);
      hasMore = hasNextPage;
      page++;

      if (hasMore) await sleep(300);
    }
  } catch (e) {
    return { films: [], errorCode: 'FETCH_ERROR', debugInfo: { error: String(e) } };
  }
  return { films: allFilms, debugInfo: { pages: debugPages } };
}