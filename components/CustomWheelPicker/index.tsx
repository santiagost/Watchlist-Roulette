'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Film, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { EnrichedFilm } from '@/lib/types';
import { localizedTitle, secondaryTitle } from '@/lib/titles';
import styles from './CustomWheelPicker.module.css';

interface CustomWheelPickerProps {
  films: EnrichedFilm[];
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  onApply: () => void;
  onClose: () => void;
}

export default function CustomWheelPicker({
  films,
  selectedSlugs,
  onToggle,
  onClear,
  onApply,
  onClose,
}: CustomWheelPickerProps) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  // Case/accent-insensitive search over name + year
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredFilms = useMemo(() => {
    let result = films;
    const q = normalize(query.trim());
    if (q) {
      result = films.filter((f) => {
        // Search across both-language titles + original + year
        const haystack = normalize(
          [f.name, f.nameEn, f.nameEs, f.originalTitle, f.year ? String(f.year) : '']
            .filter(Boolean)
            .join(' ')
        );
        return haystack.includes(q);
      });
    }
    // Keep already-selected movies pinned at the top
    const selected = new Set(selectedSlugs);
    return [
      ...result.filter((f) => selected.has(f.slug)),
      ...result.filter((f) => !selected.has(f.slug)),
    ];
  }, [films, query, selectedSlugs]);

  const selectedSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t('customWheelTitle')}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('customWheelTitle')}</h2>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
            aria-label={t('searchPlaceholder')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={styles.clearQueryBtn}
              aria-label={t('clearSelection')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.countBar}>
          <span className={styles.countLabel}>
            {selectedSlugs.length === 1 ? t('movieSelected') : t('moviesSelected')}
          </span>
          <span className={styles.countNum}>{selectedSlugs.length}</span>
        </div>

        <div className={styles.list}>
          {filteredFilms.length === 0 ? (
            <div className={styles.emptyState}>
              <Film size={32} aria-hidden="true" />
              <p>{t('noResults')}</p>
            </div>
          ) : (
            filteredFilms.map((film) => {
              const isSelected = selectedSet.has(film.slug);
              const title = localizedTitle(film, language);
              const secondary = secondaryTitle(film, language);
              return (
                <button
                  key={film.slug}
                  onClick={() => onToggle(film.slug)}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                  aria-pressed={isSelected}
                  aria-label={`${title}${film.year ? ` (${film.year})` : ''} — ${isSelected ? t('removeMovie') : t('selectMovie')}`}
                >
                  {film.poster ? (
                    <img src={film.poster} alt="" className={styles.itemPoster} />
                  ) : (
                    <div className={styles.itemPosterFallback}>
                      <Film size={14} aria-hidden="true" />
                    </div>
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{title}</span>
                    {secondary && <span className={styles.itemAlt}>{secondary}</span>}
                    {film.year && <span className={styles.itemYear}>{film.year}</span>}
                  </div>
                  <span className={`${styles.check} ${isSelected ? styles.checkOn : ''}`} aria-hidden="true">
                    {isSelected && <Check size={14} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClear}
            className={styles.clearBtn}
            disabled={selectedSlugs.length === 0}
          >
            {t('clearSelection')}
          </button>
          <button
            onClick={onApply}
            className={styles.applyBtn}
            disabled={selectedSlugs.length === 0}
          >
            {t('useSelection')} ({selectedSlugs.length})
          </button>
        </div>
      </div>
    </div>
  );
}
