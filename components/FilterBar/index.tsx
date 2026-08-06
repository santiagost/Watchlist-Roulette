'use client';

import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { EnrichedFilm, Filters } from '@/lib/types';
import styles from './FilterBar.module.css';

const DECADES = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

interface FilterBarProps {
  films: EnrichedFilm[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  disabled?: boolean;
}

export default function FilterBar({ films, filters, onFiltersChange, disabled = false }: FilterBarProps) {
  const { t, language } = useLanguage();

  // Extract all unique genres from enriched films
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    films.forEach((f) => f.genres?.forEach((g) => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [films]);

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.minRating > 0 ||
    filters.maxRuntime > 0 ||
    filters.decade !== '';

  const toggleGenre = (genre: string) => {
    const current = filters.genres;
    const next = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    onFiltersChange({ ...filters, genres: next });
  };

  const toggleDecade = (decade: string) => {
    onFiltersChange({
      ...filters,
      decade: filters.decade === decade ? '' : decade,
    });
  };

  const clearAll = () => {
    onFiltersChange({ genres: [], minRating: 0, maxRuntime: 0, decade: '' });
  };

  // Format decade display
  const formatDecade = (dec: string) => {
    if (language === 'es') {
      const year = dec.replace('s', '');
      return `Años ${year.slice(2)}`;
    }
    return dec;
  };

  // Rating slider: 0–8 in 0.5 steps → displayed as 0–8 (TMDB scale)
  const ratingPercent = (filters.minRating / 8) * 100;

  if (availableGenres.length === 0) return null;

  return (
    <div
      className={`${styles.filterBar} ${disabled ? styles.disabled : ''}`}
      aria-label={t('filters')}
      aria-disabled={disabled || undefined}
    >
      <div className={styles.filterHeader}>
        <span className={styles.filterTitle}>
          <Search size={15} aria-hidden="true" /> {t('filters')}
        </span>
        {hasActiveFilters && (
          <button id="clear-filters-btn" onClick={clearAll} className={styles.clearBtn} disabled={disabled}>
            <X size={13} aria-hidden="true" /> {t('clearAll')}
          </button>
        )}
      </div>

      {/* Genre filter */}
      {availableGenres.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('genre')}</span>
          <div className={styles.chips} role="group" aria-label={t('genreFilters')}>
            {availableGenres.map((genre) => (
              <button
                key={genre}
                id={`genre-filter-${genre.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => toggleGenre(genre)}
                className={`genre-chip ${filters.genres.includes(genre) ? 'active' : ''}`}
                aria-pressed={filters.genres.includes(genre)}
                disabled={disabled}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Min rating */}
      <div className={styles.section}>
        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            <span>{t('minRating')}</span>
            <span className={styles.sliderValue}>
              {filters.minRating > 0 ? `≥ ${filters.minRating.toFixed(1)}` : t('any')}
            </span>
          </div>
          <input
            id="rating-slider"
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={filters.minRating}
            onChange={(e) =>
              onFiltersChange({ ...filters, minRating: parseFloat(e.target.value) })
            }
            className={styles.slider}
            style={{ '--value': `${ratingPercent}%` } as React.CSSProperties}
            aria-label={t('minRating')}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Max runtime */}
      <div className={styles.section}>
        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            <span>{t('maxRuntime')}</span>
            <span className={styles.sliderValue}>
              {filters.maxRuntime > 0
                ? `≤ ${Math.floor(filters.maxRuntime / 60)}h ${filters.maxRuntime % 60}m`
                : t('any')}
            </span>
          </div>
          <input
            id="runtime-slider"
            type="range"
            min={0}
            max={240}
            step={15}
            value={filters.maxRuntime}
            onChange={(e) =>
              onFiltersChange({ ...filters, maxRuntime: parseInt(e.target.value) })
            }
            className={styles.slider}
            style={{
              '--value': `${filters.maxRuntime > 0 ? (filters.maxRuntime / 240) * 100 : 0}%`,
            } as React.CSSProperties}
            aria-label={t('maxRuntime')}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Decade filter */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('decade')}</span>
        <div className={styles.decadeRow} role="group" aria-label={t('decadeFilters')}>
          {DECADES.map((decade) => (
            <button
              key={decade}
              id={`decade-filter-${decade}`}
              onClick={() => toggleDecade(decade)}
              className={`${styles.decadeBtn} ${filters.decade === decade ? styles.active : ''}`}
              aria-pressed={filters.decade === decade}
              disabled={disabled}
            >
              {formatDecade(decade)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
