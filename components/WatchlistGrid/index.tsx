'use client';

import { useState } from 'react';
import { Clapperboard, Film } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { EnrichedFilm } from '@/lib/types';
import { localizedTitle } from '@/lib/titles';
import styles from './WatchlistGrid.module.css';

const INITIAL_VISIBLE = 40;
const LOAD_MORE_STEP = 40;

interface WatchlistGridProps {
  films: EnrichedFilm[];
  enrichedCount: number;
  totalCount: number;
  onSelectFilm?: (film: EnrichedFilm) => void;
}

function MovieCard({ film, onSelect }: { film: EnrichedFilm; onSelect?: () => void }) {
  const { t, language } = useLanguage();
  const title = localizedTitle(film, language);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={styles.card}
      title={`${title}${film.year ? ` (${film.year})` : ''}`}
      aria-label={`${title}${film.year ? `, ${film.year}` : ''} — ${t('viewDetails')}`}
    >
      {film.poster ? (
        <img
          src={film.poster}
          alt={`${title} poster`}
          className={styles.poster}
          loading="lazy"
        />
      ) : (
        <div className={styles.posterFallback}>
          <Film className={styles.fallbackIcon} aria-hidden="true" />
          <span className={styles.fallbackTitle}>{title}</span>
        </div>
      )}

      <div className={styles.overlay} aria-hidden="true">
        <span className={styles.overlayTitle}>{title}</span>
        {film.year && <span className={styles.overlayYear}>{film.year}</span>}
      </div>
    </button>
  );
}

export default function WatchlistGrid({ films, enrichedCount, totalCount, onSelectFilm }: WatchlistGridProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const loadMore = () => setVisible((v) => v + LOAD_MORE_STEP);

  const isEnriching = enrichedCount < totalCount;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <Clapperboard size={16} aria-hidden="true" />
          {t('allFilms')} {totalCount} {t('films')}
        </span>
        {isEnriching && (
          <span className={styles.enrichProgress} aria-live="polite">
            <span className={styles.enrichDot} aria-hidden="true" />
            {t('loadingPosters')} ({enrichedCount}/{totalCount})
          </span>
        )}
      </div>

      <div className={styles.grid}>
        {/* Visible cards */}
        {films.slice(0, visible).map((film) => (
          <MovieCard key={film.slug} film={film} onSelect={() => onSelectFilm?.(film)} />
        ))}

        {/* Skeleton placeholders while enriching remaining slots */}
        {isEnriching &&
          Array.from({
            length: Math.min(8, Math.min(visible, totalCount) - films.length),
          }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className={`${styles.cardSkeleton} skeleton`}
              aria-hidden="true"
            />
          ))}
      </div>

      {visible < films.length && (
        <div className={styles.showMoreContainer}>
          <button
            id="show-more-films-btn"
            onClick={loadMore}
            className={styles.showMoreBtn}
          >
            {t('showMore')} ({films.length - visible} {t('remaining')})
          </button>
        </div>
      )}
    </div>
  );
}
