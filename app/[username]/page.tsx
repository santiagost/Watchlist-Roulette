'use client';

import { useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Lock, Film, Zap, KeyRound, ShieldAlert,
  Disc3, User, RefreshCw, CircleCheck, HardDrive, ArrowLeft,
} from 'lucide-react';
import { EnrichedFilm, LetterboxdFilm, Filters, WatchlistResponse } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { enrichFilm } from '@/lib/tmdb';
import {
  saveWatchlist,
  loadWatchlist,
  isPrimaryUser,
  diffWatchlist,
  getCacheAge,
  loadCustomPool,
  saveCustomPool,
  clearCustomPool,
} from '@/lib/cache';
import RouletteWheel from '@/components/RouletteWheel';
import MovieModal from '@/components/MovieModal';
import FilterBar from '@/components/FilterBar';
import WatchlistGrid from '@/components/WatchlistGrid';
import CustomPoolBar from '@/components/CustomPoolBar';
import CustomWheelPicker from '@/components/CustomWheelPicker';
import styles from './page.module.css';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';

type PageState = 'loading' | 'enriching' | 'ready' | 'error';
type SyncState = 'idle' | 'syncing' | 'done';
type ErrorCode = 'USER_NOT_FOUND' | 'PRIVATE_WATCHLIST' | 'EMPTY_WATCHLIST' | 'FETCH_ERROR' | 'NO_API_KEY' | 'CLOUDFLARE_BLOCK';

const ERROR_ICONS: Record<ErrorCode, ReactNode> = {
  USER_NOT_FOUND: <Search size={48} />,
  PRIVATE_WATCHLIST: <Lock size={48} />,
  EMPTY_WATCHLIST: <Film size={48} />,
  FETCH_ERROR: <Zap size={48} />,
  NO_API_KEY: <KeyRound size={48} />,
  CLOUDFLARE_BLOCK: <ShieldAlert size={48} />,
};

const FALLBACK_ICON = <Zap size={48} />;

function getErrorCopy(t: (key: keyof typeof import('@/lib/i18n').translations.en) => string) {
  const ERRORS: Record<ErrorCode, { icon: ReactNode; title: string; text: string }> = {
    USER_NOT_FOUND: { icon: ERROR_ICONS.USER_NOT_FOUND, title: t('errUserNotFoundTitle'), text: t('errUserNotFoundText') },
    PRIVATE_WATCHLIST: { icon: ERROR_ICONS.PRIVATE_WATCHLIST, title: t('errPrivateTitle'), text: t('errPrivateText') },
    EMPTY_WATCHLIST: { icon: ERROR_ICONS.EMPTY_WATCHLIST, title: t('errEmptyTitle'), text: t('errEmptyText') },
    FETCH_ERROR: { icon: ERROR_ICONS.FETCH_ERROR, title: t('errFetchTitle'), text: t('errFetchText') },
    NO_API_KEY: { icon: ERROR_ICONS.NO_API_KEY, title: t('errNoKeyTitle'), text: t('errNoKeyText') },
    CLOUDFLARE_BLOCK: { icon: ERROR_ICONS.CLOUDFLARE_BLOCK, title: t('errCloudflareTitle'), text: t('errCloudflareText') },
  };
  return { ERRORS, FALLBACK: { icon: FALLBACK_ICON, title: t('errFallbackTitle'), text: t('errFallbackText') } };
}

const DEFAULT_FILTERS: Filters = {
  genres: [],
  minRating: 0,
  maxRuntime: 0,
  decade: '',
};

function applyFilters(films: EnrichedFilm[], filters: Filters): EnrichedFilm[] {
  return films.filter((film) => {
    // Genre filter: film must have at least one of the selected genres
    if (filters.genres.length > 0) {
      if (!film.genres || !filters.genres.some((g) => film.genres!.includes(g))) {
        return false;
      }
    }

    // Rating filter
    if (filters.minRating > 0) {
      if (!film.rating || film.rating < filters.minRating) return false;
    }

    // Max runtime filter
    if (filters.maxRuntime > 0) {
      if (!film.runtime || film.runtime > filters.maxRuntime) return false;
    }

    // Decade filter
    if (filters.decade) {
      const decadeStart = parseInt(filters.decade);
      if (!film.year || film.year < decadeStart || film.year >= decadeStart + 10) return false;
    }
    return true;
  });
}

export default function UsernamePage() {
  const params = useParams();
  const username = typeof params.username === 'string' ? decodeURIComponent(params.username) : '';
  const { t, language } = useLanguage();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const [allFilms, setAllFilms] = useState<EnrichedFilm[]>([]);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeModalFilm, setActiveModalFilm] = useState<{ film: EnrichedFilm; isWinner: boolean } | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(true);

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const [customPool, setCustomPool] = useState<string[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isPrimary = useRef(false);

  const fetchLetterboxdWatchlist = useCallback(async (): Promise<{
    films: LetterboxdFilm[] | null;
    errorCode?: ErrorCode;
  }> => {
    try {
      const res = await fetch(`/api/watchlist?username=${encodeURIComponent(username)}`);
      const data: WatchlistResponse = await res.json();

      if (!res.ok || data.error) {
        return { films: null, errorCode: data.errorCode ?? 'FETCH_ERROR' };
      }

      return { films: data.films };
    } catch {
      return { films: null, errorCode: 'FETCH_ERROR' };
    }
  }, [username]);

  const enrichFilms = useCallback(
    async (
      rawFilms: LetterboxdFilm[],
      onBatchDone?: (done: number, total: number) => void
    ): Promise<EnrichedFilm[]> => {
      if (!TMDB_API_KEY) {
        return rawFilms.map((f) => ({ ...f, enriched: false }));
      }

      const enriched: EnrichedFilm[] = [];
      const BATCH = 5;

      for (let i = 0; i < rawFilms.length; i += BATCH) {
        const batch = rawFilms.slice(i, i + BATCH);
        const results = await Promise.all(batch.map((f) => enrichFilm(f, TMDB_API_KEY, language)));
        enriched.push(...results);
        onBatchDone?.(enriched.length, rawFilms.length);

        if (i + BATCH < rawFilms.length) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      return enriched;
    },
    [language]
  );

  const loadPrimaryWithDiff = useCallback(async () => {
    const cached = loadWatchlist(username, language);

    if (cached && cached.length > 0) {
      setAllFilms(cached);
      setTotalCount(cached.length);
      setEnrichedCount(cached.filter((f) => f.enriched).length);
      setCacheAge(getCacheAge(username));
      setPageState('ready');
      setIsBusy(false);

      setSyncState('syncing');
      setSyncMessage(t('syncing'));

      const { films: freshFilms, errorCode: fetchErr } = await fetchLetterboxdWatchlist();

      if (!freshFilms) {
        setSyncState('done');
        setSyncMessage(fetchErr === 'CLOUDFLARE_BLOCK' ? t('syncBlocked') : t('syncFailed'));
        setTimeout(() => setSyncState('idle'), 4000);
        return;
      }

      const currentSlugs = freshFilms.map((f) => f.slug);
      const diff = diffWatchlist(username, currentSlugs, language);

      if (diff.added.length === 0 && diff.removed.length === 0) {
        setSyncState('done');
        setSyncMessage(t('upToDate'));
        setTimeout(() => setSyncState('idle'), 3000);
        return;
      }

      const newRawFilms = freshFilms.filter((f) => diff.added.includes(f.slug));
      let newEnriched: EnrichedFilm[] = [];

      if (newRawFilms.length > 0) {
        setSyncMessage(`${t('enriching')} ${newRawFilms.length} ${newRawFilms.length > 1 ? t('newFilms') : t('newFilm')}…`);
        newEnriched = await enrichFilms(newRawFilms);
      }

      const enrichedBySlug = new Map<string, EnrichedFilm>();
      for (const film of diff.unchanged) {
        enrichedBySlug.set(film.slug, film);
      }
      for (const film of newEnriched) {
        enrichedBySlug.set(film.slug, film);
      }

      const merged: EnrichedFilm[] = [];
      for (const slug of currentSlugs) {
        const film = enrichedBySlug.get(slug);
        if (film) {
          merged.push(film);
        } else {
          const raw = freshFilms.find((f) => f.slug === slug);
          if (raw) merged.push({ ...raw, enriched: false });
        }
      }

      setAllFilms(merged);
      setTotalCount(merged.length);
      setEnrichedCount(merged.filter((f) => f.enriched).length);
      saveWatchlist(username, merged, language);
      setCacheAge(0);

      const parts: string[] = [];
      if (diff.added.length > 0) parts.push(`${diff.added.length} ${t('added')}`);
      if (diff.removed.length > 0) parts.push(`${diff.removed.length} ${t('removed')}`);
      setSyncState('done');
      setSyncMessage(`${t('synced')} — ${parts.join(', ')}`);
      setTimeout(() => setSyncState('idle'), 5000);
    } else {
      await loadFreshWatchlist();
    }
  }, [username, language, fetchLetterboxdWatchlist, enrichFilms, t]);

  const loadFreshWatchlist = useCallback(async () => {
    setPageState('loading');
    setIsBusy(true);
    setErrorCode(null);
    setAllFilms([]);
    setEnrichedCount(0);
    setTotalCount(0);
    setSyncState('idle');
    setSyncMessage('');
    setActiveModalFilm(null);
    
    const { films: rawFilms, errorCode: fetchErr } = await fetchLetterboxdWatchlist();

    if (!rawFilms) {
      setErrorCode(fetchErr ?? 'FETCH_ERROR');
      setPageState('error');
      setIsBusy(false);
      return;
    }

    setTotalCount(rawFilms.length);
    setPageState('enriching');

    const initial: EnrichedFilm[] = rawFilms.map((f) => ({ ...f, enriched: false }));
    setAllFilms(initial);

    if (!TMDB_API_KEY) {
      saveWatchlist(username, initial, language);
      setEnrichedCount(rawFilms.length);
      setPageState('ready');
      setIsBusy(false);
      return;
    }

    const enriched: EnrichedFilm[] = [...initial];
    const BATCH = 5;

    for (let i = 0; i < rawFilms.length; i += BATCH) {
      const batch = rawFilms.slice(i, i + BATCH);
      const results = await Promise.all(batch.map((f) => enrichFilm(f, TMDB_API_KEY, language)));

      results.forEach((enrichedFilm, j) => {
        enriched[i + j] = enrichedFilm;
      });

      setAllFilms([...enriched]);
      setEnrichedCount(i + batch.length);

      if (i + BATCH < rawFilms.length) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    saveWatchlist(username, enriched, language);
    setPageState('ready');
    setIsBusy(false);
  }, [username, language, fetchLetterboxdWatchlist]);

  const loadWatchlistData = useCallback(
    async (forceRefresh = false) => {
      if (!username) return;

      isPrimary.current = isPrimaryUser(username);
      setCustomPool(loadCustomPool(username));

      if (forceRefresh) {
        setCacheAge(null);
        await loadFreshWatchlist();
        return;
      }

      if (isPrimary.current) {
        await loadPrimaryWithDiff();
      } else {
        await loadFreshWatchlist();
      }
    },
    [username, loadFreshWatchlist, loadPrimaryWithDiff]
  );

  useEffect(() => {
    loadWatchlistData(false);
  }, [loadWatchlistData]);

  const filteredFilms = useMemo(() => {
    const enrichedFilms = allFilms.filter((f) => f.enriched);
    const hasFilters =
      filters.genres.length > 0 || filters.minRating > 0 || filters.maxRuntime > 0 || filters.decade !== '';

    if (!hasFilters) {
      return allFilms.length > 0 ? allFilms : [];
    }

    return enrichedFilms.length > 0 ? applyFilters(enrichedFilms, filters) : allFilms;
  }, [allFilms, filters]);

  // Custom wheel pool takes priority over filters (selection is definitive)
  const wheelFilms = useMemo(() => {
    if (customMode && customPool.length > 0) {
      return allFilms.filter((f) => customPool.includes(f.slug));
    }
    return filteredFilms.length > 0 ? filteredFilms : allFilms;
  }, [customMode, customPool, allFilms, filteredFilms]);

  const handleResult = (film: EnrichedFilm) => setActiveModalFilm({ film, isWinner: true });
  const handleSelectFilm = (film: EnrichedFilm) => setActiveModalFilm({ film, isWinner: false });
  const handleCloseModal = () => setActiveModalFilm(null);
  const handleSpinAgain = () => setActiveModalFilm(null);
  const handleRefresh = () => loadWatchlistData(true);

  const togglePoolFilm = (slug: string) => {
    const next = customPool.includes(slug)
      ? customPool.filter((s) => s !== slug)
      : [...customPool, slug];
    setCustomPool(next);
    saveCustomPool(username, next);
    if (next.length === 0) setCustomMode(false);
  };

  const clearPool = () => {
    setCustomPool([]);
    setCustomMode(false);
    clearCustomPool(username);
  };

  const openPicker = () => {
    // Prune any slugs that are no longer in the watchlist
    const pruned = customPool.filter((slug) => allFilms.some((f) => f.slug === slug));
    if (pruned.length !== customPool.length) {
      setCustomPool(pruned);
      saveCustomPool(username, pruned);
    }
    setPickerOpen(true);
  };

  const applyPool = () => {
    setCustomMode(true);
    setPickerOpen(false);
  };

  const exitCustomMode = () => setCustomMode(false);

  if (pageState === 'error' && errorCode) {
    const { ERRORS, FALLBACK } = getErrorCopy(t);
    const err = ERRORS[errorCode] ?? FALLBACK;
    return (
      <div className={styles.page}>
        <div className={styles.bgGlow} aria-hidden="true" />
        <div className={styles.errorContainer}>
          <span className={styles.errorIcon} aria-hidden="true">{err.icon}</span>
          <h1 className={styles.errorTitle}>{err.title}</h1>
          <p className={styles.errorText}>{err.text}</p>
          <span className={styles.errorCode}>{errorCode}</span>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={15} /> {t('tryAnotherUsername')}
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.bgGlow} aria-hidden="true" />
        <div className={styles.loadingContainer} role="status" aria-live="polite">
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <p className={styles.loadingText}>{t('loadingWatchlist')}</p>
          <p className={styles.loadingSubtext}>
            {t('fetchingData')} <strong>@{username}</strong>{t('fetchingWait')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink} aria-label="Watchlist Roulette home">
            <Disc3 size={18} aria-hidden="true" />
            <span className={styles.logoText}>
              Watchlist <span className={styles.logoOrange}>Roulette</span>
            </span>
          </Link>

          <div className={styles.userBadge}>
            <User size={14} aria-hidden="true" />
            <span className={styles.userHandle}>@{username}</span>
            <span>·</span>
            <span>{totalCount} {t('films')}</span>
          </div>

          <div className={styles.headerActions}>
            <LanguageToggle />
            <button
              id="refresh-watchlist-btn"
              onClick={handleRefresh}
              disabled={isBusy}
              className={styles.refreshBtn}
              aria-label={t('refresh')}
            >
              <RefreshCw size={14} aria-hidden="true" /> {t('refresh')}
            </button>
            <Link href="/" className={styles.changeUserBtn}>
              {t('changeUser')}
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.leftCol}>
          {syncState !== 'idle' && (
            <div
              className={`${styles.syncNotice} ${syncState === 'done' ? styles.syncDone : ''}`}
              role="status"
            >
              {syncState === 'syncing' && (
                <div className={styles.syncSpinner} aria-hidden="true" />
              )}
              {syncState === 'done' && (
                <CircleCheck size={15} aria-hidden="true" />
              )}
              <span>{syncMessage}</span>
            </div>
          )}

          {syncState === 'idle' && cacheAge !== null && cacheAge > 0 && (
            <div className={styles.cacheNotice} role="status">
              <HardDrive size={14} aria-hidden="true" />
              <span>
                {t('cacheNoticeFrom')} {cacheAge} {t('cacheNoticeMinAgo')} — {t('cacheNoticeRefresh')}
              </span>
            </div>
          )}

          <CustomPoolBar
            films={allFilms}
            poolSlugs={customPool}
            customMode={customMode}
            onOpenPicker={openPicker}
            onRemove={togglePoolFilm}
            onClear={clearPool}
            onExit={exitCustomMode}
          />

          <RouletteWheel
            films={wheelFilms}
            onResult={handleResult}
            disabled={isBusy}
          />

          {allFilms.some((f) => f.genres && f.genres.length > 0) && (
            <FilterBar
              films={allFilms}
              filters={filters}
              onFiltersChange={setFilters}
              disabled={customMode}
            />
          )}
        </div>

        <div className={styles.rightCol}>
          <WatchlistGrid
            films={allFilms}
            enrichedCount={enrichedCount}
            totalCount={totalCount}
            onSelectFilm={handleSelectFilm}
          />
        </div>
      </main>

      {activeModalFilm && (
        <MovieModal
          film={activeModalFilm.film}
          isWinner={activeModalFilm.isWinner}
          onClose={handleCloseModal}
          onSpinAgain={handleSpinAgain}
        />
      )}

      {pickerOpen && (
        <CustomWheelPicker
          films={allFilms}
          selectedSlugs={customPool}
          onToggle={togglePoolFilm}
          onClear={clearPool}
          onApply={applyPool}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
