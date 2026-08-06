import { NextRequest, NextResponse } from 'next/server';
import { getFullWatchlist } from '@/lib/letterboxd';

export const maxDuration = 30; // seconds — Vercel hobby supports up to 60s

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json(
      { error: 'Missing username parameter', errorCode: 'MISSING_USERNAME' },
      { status: 400 }
    );
  }

  // Basic username validation
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username)) {
    return NextResponse.json(
      { error: 'Invalid username format', errorCode: 'INVALID_USERNAME' },
      { status: 400 }
    );
  }

  const { films, errorCode, debugInfo } = await getFullWatchlist(username);

  if (errorCode) {
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      PRIVATE_WATCHLIST: 403,
      EMPTY_WATCHLIST: 200,
      FETCH_ERROR: 502,
      CLOUDFLARE_BLOCK: 503,
    };
    return NextResponse.json(
      { films: [], errorCode, totalCount: 0, debugInfo },
      { status: statusMap[errorCode] ?? 500 }
    );
  }

  return NextResponse.json(
    { films, username, totalCount: films.length },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
