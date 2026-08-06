'use client';

import { useEffect, useCallback, useState, useRef, useLayoutEffect } from 'react';
import { ExternalLink, Disc3, Film, X, Star, StarHalf, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { EnrichedFilm } from '@/lib/types';
import { localizedTitle, secondaryTitle } from '@/lib/titles';
import styles from './MovieModal.module.css';

interface MovieModalProps {
  film: EnrichedFilm;
  onClose: () => void;
  onSpinAgain: () => void;
  isWinner?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const { t } = useLanguage();
  const stars = Math.round((rating / 10) * 5 * 2) / 2; // 0–5 in 0.5 increments
  const fullStars = Math.floor(stars);
  const hasHalf = stars % 1 !== 0;
  const emptyStars = Math.max(0, 5 - Math.ceil(stars));
  return (
    <div className={styles.rating} aria-label={`${t('ratingLabel')}: ${rating.toFixed(1)} ${t('outOf10')}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} size={14} fill="currentColor" aria-hidden="true" />
      ))}
      {hasHalf && <StarHalf key="half" size={14} aria-hidden="true" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={14} aria-hidden="true" />
      ))}
      <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function MovieModal({ film, onClose, onSpinAgain, isWinner = true }: MovieModalProps) {
  const { t, language } = useLanguage();
  const mainTitle = localizedTitle(film, language);
  const secondary = secondaryTitle(film, language);
  const letterboxdUrl = `https://letterboxd.com/film/${film.slug}/`;

  // ── Read more / overview expansion ─────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const overviewRef = useRef<HTMLParagraphElement>(null);

  // Detect whether the overview is actually clamped/truncated
  useLayoutEffect(() => {
    if (!film.overview || expanded) return;
    const el = overviewRef.current;
    if (el) {
      setCanExpand(el.scrollHeight > el.clientHeight + 1);
    }
  }, [film, expanded]);

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

  const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${t('movieResult')}: ${mainTitle}`}
    >
      <div className={styles.modal}>
        {/* Backdrop image */}
        <div className={styles.backdropArea}>
          {film.backdrop ? (
            <img
              src={film.backdrop}
              alt=""
              className={styles.backdrop}
              aria-hidden="true"
            />
          ) : (
            <div className={styles.backdropFallback} aria-hidden="true" />
          )}
          <div className={styles.backdropOverlay} aria-hidden="true" />

          {/* Result badge */}
          {isWinner && (
            <div className={styles.resultBadge} aria-hidden="true">
              <Disc3 size={16} /> {t('yourPick')}
            </div>
          )}

          {/* Close button */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label={t('closeResult')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Main content */}
        <div className={styles.body}>
          {/* Poster */}
          <div className={styles.poster}>
            {film.poster ? (
              <img
                src={film.poster}
                alt={`${mainTitle} poster`}
                className={styles.posterImg}
              />
            ) : (
              <div className={styles.posterFallback} aria-hidden="true">
                <Film size={32} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.titleRow}>
              <h2 className={styles.movieTitle}>{mainTitle}</h2>
              {secondary && <span className={styles.altTitle}>{secondary}</span>}

              <div className={styles.meta}>
                {film.year && <span>{film.year}</span>}
                {film.runtime && (
                  <>
                    <span className={styles.metaSep}>·</span>
                    <span>{formatRuntime(film.runtime)}</span>
                  </>
                )}
                {film.rating && film.rating > 0 && (
                  <>
                    <span className={styles.metaSep}>·</span>
                    <StarRating rating={film.rating} />
                  </>
                )}
              </div>
            </div>

            {/* Genres */}
            {film.genres && film.genres.length > 0 && (
              <div className={styles.genres} aria-label={t('genres')}>
                {film.genres.slice(0, 4).map((genre) => (
                  <span key={genre} className="genre-chip">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Directors */}
            {film.directors && film.directors.length > 0 && (
              <p className={styles.directors}>
                <span className={styles.directorsLabel}>
                  {film.directors.length === 1 ? `${t('director')}: ` : `${t('directors')}: `}
                </span>
                {film.directors.join(', ')}
              </p>
            )}

            {/* Overview */}
            {film.overview && (
              <div className={styles.overviewWrap}>
                <p
                  ref={overviewRef}
                  className={`${styles.overview} ${expanded ? styles.expanded : ''}`}
                >
                  {film.overview}
                </p>
                {canExpand && (
                  <button
                    type="button"
                    className={styles.readMoreBtn}
                    onClick={() => setExpanded(!expanded)}
                    aria-expanded={expanded}
                  >
                    {expanded ? t('showLess') : t('readMore')}
                    <ChevronDown
                      size={14}
                      className={`${styles.readMoreIcon} ${expanded ? styles.chevronUp : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <a
            id="view-letterboxd-btn"
            href={letterboxdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPrimary}
          >
            <ExternalLink size={15} aria-hidden="true" />
            {t('viewOnLbd')}
          </a>
          <button
            id="spin-again-btn"
            onClick={onSpinAgain}
            className={styles.btnSecondary}
          >
            <Disc3 size={15} aria-hidden="true" />
            {t('spinAgain')}
          </button>
        </div>
      </div>
    </div>
  );
}
