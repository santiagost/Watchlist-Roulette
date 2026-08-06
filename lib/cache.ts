import { EnrichedFilm, AppLanguage } from './types';

const CACHE_PREFIX = 'lbd_watchlist_';
const PRIMARY_USER_KEY = 'lbd_primary_user';

/** Version bumped when EnrichedFilm shape changes — invalidates old caches */
const CACHE_VERSION = 4; // Bumped to 4 for bilingual titles (nameEn/nameEs/originalTitle)

interface CacheEntry {
  films: EnrichedFilm[];
  timestamp: number;
  version: number;
  language?: AppLanguage;
}

export interface DiffResult {
  /** Slugs of films in the new watchlist that are NOT in the cache */
  added: string[];
  /** Slugs of films in the cache that are NOT in the new watchlist */
  removed: string[];
  /** Cached EnrichedFilm objects that are still in the new watchlist */
  unchanged: EnrichedFilm[];
}

// ── Primary User ───────────────────────────────────────────────

export function setPrimaryUser(username: string): void {
  try {
    const current = getPrimaryUser();
    // If switching to a different user, clear old user's cache
    if (current && current !== username.toLowerCase()) {
      clearCache(current);
    }
    localStorage.setItem(PRIMARY_USER_KEY, username.toLowerCase());
  } catch {
    // localStorage unavailable
  }
}

export function getPrimaryUser(): string | null {
  try {
    return localStorage.getItem(PRIMARY_USER_KEY);
  } catch {
    return null;
  }
}

export function clearPrimaryUser(): void {
  try {
    const current = getPrimaryUser();
    if (current) {
      clearCache(current);
    }
    localStorage.removeItem(PRIMARY_USER_KEY);
  } catch {
    // ignore
  }
}

export function isPrimaryUser(username: string): boolean {
  return getPrimaryUser() === username.toLowerCase();
}

// ── Watchlist Cache ────────────────────────────────────────────

export function saveWatchlist(username: string, films: EnrichedFilm[], language: AppLanguage = 'en'): void {
  // Only cache the primary user
  if (!isPrimaryUser(username)) return;

  try {
    const entry: CacheEntry = {
      films,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      language,
    };
    localStorage.setItem(CACHE_PREFIX + username.toLowerCase(), JSON.stringify(entry));
  } catch {
    // localStorage might be unavailable (SSR, private mode, full)
  }
}

export function loadWatchlist(username: string, currentLanguage: AppLanguage = 'en'): EnrichedFilm[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + username.toLowerCase());
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);

    // Invalidate on version mismatch (structure changed) or language mismatch
    if (entry.version !== CACHE_VERSION || entry.language !== currentLanguage) {
      clearCache(username);
      return null;
    }

    // No TTL — the cache for the primary user never expires by time.
    // It stays until manually refreshed or a diff sync removes stale entries.

    return entry.films;
  } catch {
    return null;
  }
}

export function clearCache(username: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + username.toLowerCase());
  } catch {
    // ignore
  }
}

export function getCacheAge(username: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + username.toLowerCase());
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return Math.floor((Date.now() - entry.timestamp) / 1000 / 60); // age in minutes
  } catch {
    return null;
  }
}

// ── Custom Wheel Pool ──────────────────────────────────────────

const CUSTOM_POOL_PREFIX = 'lbd_custompool_';

/** Persist the custom wheel selection (slugs) for a username. */
export function saveCustomPool(username: string, slugs: string[]): void {
  try {
    localStorage.setItem(CUSTOM_POOL_PREFIX + username.toLowerCase(), JSON.stringify(slugs));
  } catch {
    // ignore
  }
}

/** Load the persisted custom wheel selection (slugs) for a username. */
export function loadCustomPool(username: string): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_POOL_PREFIX + username.toLowerCase());
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** Remove the persisted custom wheel selection for a username. */
export function clearCustomPool(username: string): void {
  try {
    localStorage.removeItem(CUSTOM_POOL_PREFIX + username.toLowerCase());
  } catch {
    // ignore
  }
}

// ── Smart Diffing ──────────────────────────────────────────────

/**
 * Compare a freshly-fetched Letterboxd watchlist (by slugs) against the cached
 * enriched films to determine what changed.
 *
 * - `added`: slugs that need TMDB enrichment (new in watchlist)
 * - `removed`: slugs that were cached but are no longer in the watchlist
 * - `unchanged`: full EnrichedFilm objects from cache that are still current
 */
export function diffWatchlist(username: string, currentSlugs: string[], currentLanguage: AppLanguage = 'en'): DiffResult {
  const cached = loadWatchlist(username, currentLanguage);

  if (!cached || cached.length === 0) {
    // No cache — everything is new
    return { added: currentSlugs, removed: [], unchanged: [] };
  }

  const cachedBySlug = new Map<string, EnrichedFilm>();
  for (const film of cached) {
    cachedBySlug.set(film.slug, film);
  }

  const currentSlugSet = new Set(currentSlugs);

  const added: string[] = [];
  const unchanged: EnrichedFilm[] = [];

  for (const slug of currentSlugs) {
    const cachedFilm = cachedBySlug.get(slug);
    if (cachedFilm) {
      unchanged.push(cachedFilm);
    } else {
      added.push(slug);
    }
  }

  const removed: string[] = [];
  for (const slug of cachedBySlug.keys()) {
    if (!currentSlugSet.has(slug)) {
      removed.push(slug);
    }
  }

  return { added, removed, unchanged };
}
