export type AppLanguage = 'en' | 'es';

export interface LetterboxdFilm {
  slug: string;
  name: string;
  year?: number;
  letterboxdId?: string;
}

export interface EnrichedFilm extends LetterboxdFilm {
  tmdbId?: number;
  poster?: string;
  backdrop?: string;
  overview?: string;
  genres?: string[];
  runtime?: number; // in minutes
  rating?: number; // TMDB vote_average 0-10
  directors?: string[];
  nameEn?: string; // Title in English (TMDB en-US)
  nameEs?: string; // Title in Spanish (TMDB es-ES)
  originalTitle?: string; // TMDB original_title
  enriched: boolean;
}

export interface WatchlistResponse {
  films: LetterboxdFilm[];
  username: string;
  totalCount: number;
  error?: string;
  errorCode?: 'USER_NOT_FOUND' | 'PRIVATE_WATCHLIST' | 'EMPTY_WATCHLIST' | 'FETCH_ERROR' | 'CLOUDFLARE_BLOCK';
}

export interface Filters {
  genres: string[];
  minRating: number;
  maxRuntime: number; // 0 means no limit
  decade: string; // '' means all, '2020s', '2010s', etc.
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  runtime: number;
  genres: { id: number; name: string }[];
}

export interface TMDBCredits {
  crew: { job: string; name: string }[];
}
