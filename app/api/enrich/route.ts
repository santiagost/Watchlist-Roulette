import { NextRequest, NextResponse } from 'next/server';
import { enrichFilm } from '@/lib/tmdb';
import { LetterboxdFilm, AppLanguage } from '@/lib/types';

export const maxDuration = 30; // seconds — Vercel hobby supports up to 60s

export async function POST(request: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { enriched: null, errorCode: 'NO_API_KEY' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const film = body?.film as LetterboxdFilm | undefined;
    const language = (body?.language ?? 'en') as AppLanguage;

    if (!film || typeof film.name !== 'string') {
      return NextResponse.json(
        { enriched: null, errorCode: 'INVALID_FILM' },
        { status: 400 }
      );
    }

    const enriched = await enrichFilm(film, apiKey, language);
    return NextResponse.json({ enriched });
  } catch {
    return NextResponse.json(
      { enriched: null, errorCode: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}
