import { EnrichedFilm, AppLanguage } from './types';

/**
 * Title of a film in the app's current language, falling back to the
 * Letterboxd name when TMDB has no localized title for that language.
 */
export function localizedTitle(film: EnrichedFilm, language: AppLanguage): string {
  const localized = language === 'es' ? film.nameEs : film.nameEn;
  return localized && localized.trim().length > 0 ? localized : film.name;
}

/**
 * Secondary title shown under the main title: the title in the opposite
 * language when it differs from the localized one; otherwise the original
 * title if it differs from the localized one; otherwise `undefined`.
 */
export function secondaryTitle(film: EnrichedFilm, language: AppLanguage): string | undefined {
  const main = localizedTitle(film, language);

  const opposite = language === 'es' ? film.nameEn : film.nameEs;
  if (opposite && opposite.trim().length > 0 && opposite !== main) {
    return opposite;
  }

  if (film.originalTitle && film.originalTitle.trim().length > 0 && film.originalTitle !== main) {
    return film.originalTitle;
  }

  return undefined;
}
