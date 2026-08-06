'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Disc3, AlertTriangle, Check } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import styles from './UsernameForm.module.css';

interface UsernameFormProps {
  onSubmit: (username: string, rememberUser: boolean) => void;
  loading?: boolean;
  initialValue?: string;
  primaryUser?: string | null;
}

export default function UsernameForm({
  onSubmit,
  loading = false,
  initialValue = '',
  primaryUser = null,
}: UsernameFormProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue || primaryUser || '');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  // Auto-check "remember" when input matches the current primary user
  useEffect(() => {
    if (primaryUser && value.trim().toLowerCase() === primaryUser.toLowerCase()) {
      setRemember(true);
    } else {
      setRemember(false);
    }
  }, [value, primaryUser]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError(t('usernameRequired'));
      return;
    }

    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(trimmed)) {
      setError(t('usernameInvalid'));
      return;
    }

    setError('');
    onSubmit(trimmed.toLowerCase(), remember);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
      noValidate
      aria-label={t('enterUsernameAria')}
    >
      <div className={styles.inputGroup}>
        <span className={styles.prefix} aria-hidden="true">
          letterboxd.com/
        </span>
        <input
          id="username-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('usernamePlaceholder')}
          className={styles.input}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={loading}
          aria-label={t('usernameAria')}
          aria-describedby={error ? 'username-error' : undefined}
        />
      </div>

      {error && (
        <div id="username-error" className={styles.error} role="alert">
          <AlertTriangle size={15} aria-hidden="true" />
          {error}
        </div>
      )}

      <label className={styles.rememberLabel} id="remember-user-label">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className={styles.rememberCheckbox}
          disabled={loading}
        />
        <span className={styles.rememberCheck} aria-hidden="true">
          {remember && <Check size={13} className={styles.rememberTick} />}
        </span>
        <span className={styles.rememberText}>
          {t('rememberMe')}
        </span>
        <span className={styles.rememberHint}>
          {t('rememberHint')}
        </span>
      </label>

      <button
        id="spin-submit-btn"
        type="submit"
        className={styles.submitBtn}
        disabled={loading || !value.trim()}
      >
        {loading ? (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            {t('loadingWatchlist')}
          </>
        ) : (
          <>
            <Disc3 size={18} aria-hidden="true" />
            {t('loadWatchlistBtn')}
          </>
        )}
      </button>
    </form>
  );
}
