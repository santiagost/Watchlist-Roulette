'use client';

import { useMemo } from 'react';
import { Disc3, X, ListPlus, Pencil } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { EnrichedFilm } from '@/lib/types';
import { localizedTitle } from '@/lib/titles';
import styles from './CustomPoolBar.module.css';

interface CustomPoolBarProps {
  films: EnrichedFilm[];
  poolSlugs: string[];
  customMode: boolean;
  onOpenPicker: () => void;
  onRemove: (slug: string) => void;
  onClear: () => void;
  onExit: () => void;
}

export default function CustomPoolBar({
  films,
  poolSlugs,
  customMode,
  onOpenPicker,
  onRemove,
  onClear,
  onExit,
}: CustomPoolBarProps) {
  const { t, language } = useLanguage();

  // Resolve slugs to actual films (skip slugs no longer in the watchlist)
  const poolFilms = useMemo(() => {
    const bySlug = new Map(films.map((f) => [f.slug, f]));
    return poolSlugs
      .map((slug) => bySlug.get(slug))
      .filter((f): f is EnrichedFilm => f !== undefined);
  }, [films, poolSlugs]);

  if (!customMode) {
    return (
      <div className={styles.inactiveRow}>
        <button onClick={onOpenPicker} className={styles.pickBtn}>
          <ListPlus size={15} aria-hidden="true" />
          {t('customPick')}
          {poolSlugs.length > 0 && (
            <span className={styles.pickCount}>{poolSlugs.length}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.poolBar}>
      <div className={styles.poolHeader}>
        <span className={styles.poolBadge}>
          <Disc3 size={13} aria-hidden="true" />
          {t('customPoolActive')}
        </span>
        <span className={styles.poolCount}>
          {poolFilms.length === 1 ? t('movieSelected') : t('moviesSelected')}: {poolFilms.length}
        </span>
        <div className={styles.poolActions}>
          <button onClick={onOpenPicker} className={styles.actionBtn} aria-label={t('editPool')}>
            <Pencil size={13} aria-hidden="true" />
            {t('editPool')}
          </button>
          <button onClick={onClear} className={styles.actionBtn} aria-label={t('clearSelection')}>
            <X size={13} aria-hidden="true" />
            {t('clearSelection')}
          </button>
          <button onClick={onExit} className={styles.exitBtn} aria-label={t('close')}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className={styles.poolHint}>{t('customPoolHint')}</p>

      {poolFilms.length > 0 && (
        <div className={styles.chips}>
          {poolFilms.map((film) => (
            <span key={film.slug} className={styles.chip}>
              {localizedTitle(film, language)}
              {film.year ? ` (${film.year})` : ''}
              <button
                onClick={() => onRemove(film.slug)}
                className={styles.chipRemove}
                aria-label={`${t('removeMovie')}: ${localizedTitle(film, language)}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
