'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Disc3, Film, Search, Heart } from 'lucide-react';
import UsernameForm from '@/components/UsernameForm';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/lib/i18n';
import { getPrimaryUser, setPrimaryUser, clearPrimaryUser } from '@/lib/cache';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [primaryUser, setPrimaryUserState] = useState<string | null>(null);

  useEffect(() => {
    setPrimaryUserState(getPrimaryUser());
  }, []);

  const handleSubmit = (username: string, rememberUser: boolean) => {
    setLoading(true);

    if (rememberUser) {
      setPrimaryUser(username);
    } else if (primaryUser === username) {
      // User unchecked "remember" for the current primary user
      clearPrimaryUser();
    }

    router.push(`/${encodeURIComponent(username)}`);
  };

  const handleContinue = () => {
    if (!primaryUser) return;
    setLoading(true);
    router.push(`/${encodeURIComponent(primaryUser)}`);
  };

  return (
    <main className={styles.page}>
      {/* Top bar with Language Toggle */}
      <div className={styles.topBar}>
        <LanguageToggle />
      </div>

      {/* Decorative background */}
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoIcon} aria-hidden="true">
            <div className={styles.logoPointer} />
            <div className={styles.logoCircle}>
              <Film className={styles.logoSvg} />
            </div>
          </div>

          <h1 className={styles.title}>
            Watchlist <span className={styles.titleAccent}>Roulette</span>
          </h1>
          <p className={styles.subtitle}>{t('heroSubtitle')}</p>
        </div>

        {/* Quick access card for primary user */}
        {primaryUser && (
          <div className={styles.quickAccess}>
            <div className={styles.quickAccessInner}>
              <div className={styles.quickAccessInfo}>
                <span className={styles.quickAccessLabel}>{t('welcomeBack')}</span>
                <span className={styles.quickAccessUser}>@{primaryUser}</span>
              </div>
              <button
                id="continue-primary-btn"
                className={styles.quickAccessBtn}
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.quickAccessSpinner} aria-hidden="true" />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <Disc3 size={16} aria-hidden="true" />
                    {t('continueBtn')}
                  </>
                )}
              </button>
            </div>
            <div className={styles.quickAccessDivider}>
              <span>{t('orSearchAnother')}</span>
            </div>
          </div>
        )}

        {/* Username form */}
        <UsernameForm
          onSubmit={handleSubmit}
          loading={loading}
          primaryUser={primaryUser}
        />

        {/* Feature pills */}
        <div className={styles.features} aria-label="Features">
          <div className={styles.featurePill}>
            <Disc3 size={15} />
            <span>{t('featureWheel')}</span>
          </div>
          <div className={styles.featurePill}>
            <Film size={15} />
            <span>{t('featureSync')}</span>
          </div>
          <div className={styles.featurePill}>
            <Search size={15} />
            <span>{t('featureFilters')}</span>
          </div>
        </div>

        {/* Note */}
        <p className={styles.note}>
          {t('profilePrivacyNote').split(t('setToPublic'))[0]}
          <a
            href="https://letterboxd.com/settings/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.noteLink}
          >
            {t('setToPublic')}
          </a>
          {t('profilePrivacyNote').split(t('setToPublic'))[1]}
        </p>
      </div>

      <footer className={styles.footer}>{t('footerAffiliation')}</footer>
    </main>
  );
}
