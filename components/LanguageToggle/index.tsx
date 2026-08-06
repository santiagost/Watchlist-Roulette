'use client';

import { useLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import styles from './LanguageToggle.module.css';

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggle = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className={styles.toggleBtn}
      aria-label={`${t('changeLanguage')}. ${t('currentLang')}: ${language.toUpperCase()}`}
      title={t('changeLanguage')}
    >
      <Globe size={14} aria-hidden="true" />
      <span className={styles.label}>{language.toUpperCase()}</span>
    </button>
  );
}
