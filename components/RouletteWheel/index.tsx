'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Disc3, Film } from 'lucide-react';
import { EnrichedFilm } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import { localizedTitle } from '@/lib/titles';
import styles from './RouletteWheel.module.css';

// ─── Wheel colour palette ─────────────────────────────────────
const SEGMENT_COLORS = [
  '#FF8000', // Letterboxd Orange
  '#1B2228', // Dark Slate / Near Black
  '#00C030', // Letterboxd Green
  '#122417', // Dark Green
  '#146FA8', // Letterboxd Blue
  '#101B26', // Dark Blue
  '#7A3B00', // Dark Orange
];

const SEGMENT_COLORS_BRIGHT = [
  '#FFA033', // Bright Orange
  '#2C3640', // Slate Grey
  '#33D45B', // Bright Green
  '#1E3B27', // Medium Dark Green
  '#3B90C8', // Bright Blue
  '#1C2D3F', // Medium Dark Blue
  '#A34F00', // Medium Dark Orange
];

interface RouletteWheelProps {
  films: EnrichedFilm[];
  onResult: (film: EnrichedFilm) => void;
  disabled?: boolean;
}

const WHEEL_SIZE = 460; // canvas pixel size

export default function RouletteWheel({ films, onResult, disabled }: RouletteWheelProps) {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinAngleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // ── Draw the wheel at a given spin angle ──────────────────────
  const drawWheel = useCallback((spinAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerRadius = cx - 2;
    const innerRadius = 34; // center hole
    const total = films.length;

    if (total === 0) return;

    const segAngle = (2 * Math.PI) / total;
    const drawOffset = -Math.PI / 2 + spinAngle; // start at top (12 o'clock)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    films.forEach((film, i) => {
      const startAngle = drawOffset + i * segAngle;
      const endAngle = startAngle + segAngle;
      const midAngle = startAngle + segAngle / 2;

      // ── Segment fill ────────────────────────────────────────
      const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
      grad.addColorStop(0, SEGMENT_COLORS_BRIGHT[i % SEGMENT_COLORS_BRIGHT.length]);
      grad.addColorStop(1, SEGMENT_COLORS[i % SEGMENT_COLORS.length]);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Segment border ──────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(20, 24, 28, 0.7)';
      ctx.lineWidth = total > 60 ? 0.5 : 1.5;
      ctx.stroke();

      // ── Outer rim arc (bright) ──────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius - 1, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // ── Text label (from outer rim inwards to center) ──────
      const showText = total <= 45;
      if (showText) {
        const textStartRadius = outerRadius * 0.88;
        const maxTextLength = textStartRadius - innerRadius - 10;
        const fontSize = Math.min(13, Math.max(8, Math.floor(320 / total)));

        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        let label = localizedTitle(film, language);
        while (label.length > 3 && ctx.measureText(label + '…').width > maxTextLength) {
          label = label.slice(0, -1);
        }
        if (label !== localizedTitle(film, language)) {
          label += '…';
        }

        const tx = cx + textStartRadius * Math.cos(midAngle);
        const ty = cy + textStartRadius * Math.sin(midAngle);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI);

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;

        ctx.fillText(label, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── Poster thumbnail (optional for large lists) ─────────
      const showPoster = total <= 20 && film.poster;
      if (showPoster) {
        // Draw posters if we have them and not too many segments
        // (complex — skipped for now, kept as enhancement)
      }
    });

    // ── Outer decorative ring ─────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,128,0,0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ── Center circle (hole) ──────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#14181C';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,128,0,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [films, language]);

  // ── Initial render ────────────────────────────────────────────
  useEffect(() => {
    drawWheel(spinAngleRef.current);
  }, [drawWheel]);

  // ── Easing function (ease-out quintic) ────────────────────────
  const easeOut = (t: number): number => 1 - Math.pow(1 - t, 5);

  // ── Spin logic ────────────────────────────────────────────────
  const handleSpin = () => {
    if (isSpinning || films.length === 0 || disabled) return;

    const total = films.length;
    const segAngle = (2 * Math.PI) / total;

    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * total);

    // Calculate final spin angle so winner lands at top pointer (0)
    // Pointer is at -π/2 in canvas coords, but with our drawOffset = -π/2 + spinAngle,
    // segment i is centered at: -π/2 + spinAngle + (i + 0.5)*segAngle
    // We want that to equal -π/2 (the pointer position):
    //   spinAngle + (winnerIndex + 0.5)*segAngle = 0
    //   spinAngle = -(winnerIndex + 0.5)*segAngle
    // Normalize to positive (clockwise):
    const winnerOffset = (winnerIndex + 0.5) * segAngle;
    const normalizedTarget = ((2 * Math.PI) - (winnerOffset % (2 * Math.PI))) % (2 * Math.PI);

    const numSpins = 6 + Math.floor(Math.random() * 4); // 6–9 full rotations
    const startAngle = spinAngleRef.current;
    const totalDelta = normalizedTarget - startAngle + numSpins * 2 * Math.PI;
    const targetAngle = startAngle + totalDelta;

    const duration = 4500 + Math.random() * 1500; // 4.5 – 6s
    const startTime = performance.now();

    setIsSpinning(true);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      spinAngleRef.current = startAngle + totalDelta * eased;
      drawWheel(spinAngleRef.current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        spinAngleRef.current = targetAngle % (2 * Math.PI);
        drawWheel(spinAngleRef.current);
        setIsSpinning(false);
        onResult(films[winnerIndex]);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (films.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Film className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyText}>{t('emptyNoMatch')}</p>
        <p className={styles.emptySubtext}>{t('emptyTryAdjusting')}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Film count */}
      <p className={styles.filmCount} aria-live="polite">
        <span className={styles.filmCountNum}>{films.length}</span>{' '}
        {films.length === 1 ? t('movieInPool') : t('moviesInPool')}
      </p>

      {/* Wheel */}
      <div className={`${styles.wheelContainer}`}>
        {/* Pointer arrow (fixed at top) */}
        <div className={styles.pointer} aria-hidden="true">
          <div className={styles.pointerArrow} />
          <div className={styles.pointerCircle} />
        </div>

        {/* Outer glowing ring */}
        <div className={`${styles.wheelOuter} ${isSpinning ? styles.spinning : ''}`}>
          <canvas
            ref={canvasRef}
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            className={styles.canvas}
            aria-label={t('wheelAria')}
            role="img"
          />
        </div>

        {/* Center overlay with icon */}
        <div className={styles.centerOverlay} aria-hidden="true">
          <Film className={styles.centerIcon} />
        </div>
      </div>

      {/* Spin button */}
      <button
        id="spin-btn"
        onClick={handleSpin}
        disabled={isSpinning || disabled}
        className={`${styles.spinBtn} ${isSpinning ? styles.spinning : ''}`}
        aria-label={isSpinning ? t('spinning') : t('spinAria')}
      >
        <span className={styles.spinBtnInner}>
          <Disc3 className={styles.spinIcon} aria-hidden="true" />
          {isSpinning ? t('spinning') : t('spin')}
        </span>
      </button>
    </div>
  );
}
