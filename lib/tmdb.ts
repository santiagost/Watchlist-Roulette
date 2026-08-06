import { LetterboxdFilm, EnrichedFilm, TMDBSearchResult, TMDBMovieDetails, TMDBCredits, AppLanguage } from './types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Genre ID to name mapping (TMDB)
const GENRE_MAP_EN: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

const GENRE_MAP_ES: Record<number, string> = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción', 10770: 'Película de TV',
  53: 'Suspenso', 10752: 'Guerra', 37: 'Western',
};

async function tmdbFetch(path: string, apiKey: string, language: AppLanguage = 'en'): Promise<Response> {
  const separator = path.includes('?') ? '&' : '?';
  const tmdbLang = language === 'es' ? 'es-ES' : 'en-US';
  const url = `${TMDB_BASE}${path}${separator}api_key=${apiKey}&language=${tmdbLang}`;
  return fetch(url);
}

export async function enrichFilm(
  film: LetterboxdFilm,
  apiKey: string,
  language: AppLanguage = 'en'
): Promise<EnrichedFilm> {
  try {
    // Search for the movie
    const query = encodeURIComponent(film.name);
    const yearParam = film.year ? `&year=${film.year}` : '';
    const searchRes = await tmdbFetch(`/search/movie?query=${query}${yearParam}`, apiKey, language);

    if (!searchRes.ok) return { ...film, enriched: false };

    const searchData = await searchRes.json();
    const results: TMDBSearchResult[] = searchData.results ?? [];

    if (results.length === 0) return { ...film, enriched: false };

    const tmdbMovie = results[0];
    const tmdbId = tmdbMovie.id;

    const genreMap = language === 'es' ? GENRE_MAP_ES : GENRE_MAP_EN;

    // The search result's `title`/`overview` are already localized to the app
    // language. Fetch the details in the OTHER language to grab the second
    // title (runtime is language-neutral), keeping the same number of calls.
    const otherLanguage: AppLanguage = language === 'es' ? 'en' : 'es';
    const [otherDetailsRes, creditsRes] = await Promise.all([
      tmdbFetch(`/movie/${tmdbId}`, apiKey, otherLanguage),
      tmdbFetch(`/movie/${tmdbId}/credits`, apiKey, language),
    ]);

    let runtime: number | undefined;
    let otherTitle: string | undefined;

    if (otherDetailsRes.ok) {
      const otherDetails: TMDBMovieDetails = await otherDetailsRes.json();
      runtime = otherDetails.runtime > 0 ? otherDetails.runtime : undefined;
      otherTitle = otherDetails.title;
    }

    // Genres always come from the search result ids (already localized)
    const genreNames: string[] = tmdbMovie.genre_ids.map((id) => genreMap[id]).filter(Boolean);

    // Both-language titles (fall back to the localized one only when needed)
    const nameEn = language === 'en' ? tmdbMovie.title : (otherTitle || undefined);
    const nameEs = language === 'es' ? tmdbMovie.title : (otherTitle || undefined);

    let directors: string[] = [];
    if (creditsRes.ok) {
      const credits: TMDBCredits = await creditsRes.json();
      directors = credits.crew
        ?.filter((c) => c.job === 'Director')
        .map((c) => c.name) ?? [];
    }

    return {
      ...film,
      tmdbId,
      poster: tmdbMovie.poster_path
        ? `${TMDB_IMAGE_BASE}/w500${tmdbMovie.poster_path}`
        : undefined,
      backdrop: tmdbMovie.backdrop_path
        ? `${TMDB_IMAGE_BASE}/w1280${tmdbMovie.backdrop_path}`
        : undefined,
      overview: tmdbMovie.overview || undefined,
      genres: genreNames,
      runtime,
      rating: tmdbMovie.vote_average,
      directors,
      nameEn,
      nameEs,
      originalTitle: tmdbMovie.original_title || undefined,
      enriched: true,
    };
  } catch {
    return { ...film, enriched: false };
  }
}

export async function enrichBatch(
  films: LetterboxdFilm[],
  apiKey: string,
  language: AppLanguage = 'en',
  onProgress?: (enriched: EnrichedFilm) => void
): Promise<EnrichedFilm[]> {
  const results: EnrichedFilm[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < films.length; i += BATCH_SIZE) {
    const batch = films.slice(i, i + BATCH_SIZE);
    const enriched = await Promise.all(batch.map((f) => enrichFilm(f, apiKey, language)));
    enriched.forEach((film) => {
      results.push(film);
      onProgress?.(film);
    });
    // Respect TMDB rate limit (~40 req/10s)
    if (i + BATCH_SIZE < films.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}
