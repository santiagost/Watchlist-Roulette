'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage } from './types';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  en: {
    // Landing page
    heroTitle: 'Watchlist Roulette',
    heroSubtitle: "Can't decide what to watch? Spin the wheel and let fate pick from your Letterboxd watchlist.",
    welcomeBack: 'Welcome back!',
    continueBtn: 'Continue',
    orSearchAnother: 'or search another user',
    featureWheel: 'Real spinning wheel',
    featureSync: 'Live watchlist sync',
    featureFilters: 'Genre & year filters',
    profilePrivacyNote: 'Your Letterboxd profile must be set to public for the watchlist to load. We never store your personal data.',
    setToPublic: 'set to public',
    footerAffiliation: 'Built with ♥ — Not affiliated with Letterboxd',
    loadWatchlistBtn: 'Load My Watchlist',
    loading: 'Loading…',
    
    // Form
    usernamePlaceholder: 'your-username',
    rememberMe: 'Remember as my primary user',
    rememberHint: 'Caches movie data for instant loading',
    usernameRequired: 'Please enter your Letterboxd username.',
    usernameInvalid: 'Username can only contain letters, numbers, hyphens, and underscores.',
    
    // Roulette Page
    refresh: 'Refresh',
    changeUser: 'Change user',
    allFilms: 'All',
    films: 'films',
    loadingWatchlist: 'Loading watchlist…',
    fetchingData: 'Fetching',
    fetchingWait: "'s watchlist from Letterboxd. This may take a moment for large lists.",
    movieInPool: 'movie in the pool',
    moviesInPool: 'movies in the pool',
    spin: 'SPIN',
    spinning: 'Spinning…',
    wheelAria: 'Roulette wheel',
    spinAria: 'Spin the wheel',
    emptyNoMatch: 'No movies match your filters',
    emptyTryAdjusting: 'Try adjusting the filters above',
    
    // FilterBar
    filters: 'Filters',
    clearAll: 'Clear all',
    genre: 'Genre',
    minRating: 'Min TMDB Rating',
    maxRuntime: 'Max Runtime',
    decade: 'Decade',
    any: 'Any',
    
    // Grid
    showMore: 'Show more',
    remaining: 'remaining',
    loadingPosters: 'Loading posters',
    
    // Modal
    yourPick: 'Your pick!',
    directors: 'Directors',
    director: 'Director',
    viewOnLbd: 'View on Letterboxd',
    spinAgain: 'Spin again',
    readMore: 'Read more',
    showLess: 'Show less',

    // Custom Wheel
    customPick: 'Pick movies',
    customPoolActive: 'Custom wheel',
    customPoolHint: 'The wheel uses exactly these movies. Filters are ignored.',
    customWheelTitle: 'Build your custom wheel',
    searchPlaceholder: 'Search your watchlist…',
    movieSelected: 'movie selected',
    moviesSelected: 'movies selected',
    useSelection: 'Use selection',
    clearSelection: 'Clear',
    noResults: 'No movies found',
    editPool: 'Edit',
    removeMovie: 'Remove from selection',
    selectMovie: 'Add to selection',
    close: 'Close',
    
    // Sync
    syncing: 'Checking for updates…',
    synced: 'Synced',
    upToDate: 'Up to date',
    syncBlocked: 'Sync blocked — using cached data',
    syncFailed: 'Sync failed — using cached data',
    enriching: 'Enriching',
    newFilm: 'new film',
    newFilms: 'new films',
    added: 'added',
    removed: 'removed',
    cacheNoticeFrom: 'Cached data from',
    cacheNoticeMinAgo: 'min ago',
    cacheNoticeRefresh: 'click Refresh for a full reload',

    // Errors
    errUserNotFoundTitle: 'User not found',
    errUserNotFoundText: "We couldn't find a Letterboxd user with that username. Double-check the spelling and try again.",
    errPrivateTitle: 'Watchlist is private',
    errPrivateText: 'Your Letterboxd profile or watchlist is set to private. Change it to public in your Letterboxd privacy settings and try again.',
    errEmptyTitle: 'Watchlist is empty',
    errEmptyText: "Looks like you haven't added any movies to your watchlist yet. Head to Letterboxd and add some films!",
    errFetchTitle: 'Something went wrong',
    errFetchText: "We couldn't load the watchlist right now. This is usually a temporary issue — please try again in a moment.",
    errNoKeyTitle: 'TMDB API key missing',
    errNoKeyText: 'Add your TMDB API key as NEXT_PUBLIC_TMDB_API_KEY in your .env.local file to enable movie enrichment.',
    errCloudflareTitle: 'Blocked by Cloudflare',
    errCloudflareText: "Letterboxd's bot protection blocked our request. Try again in a few seconds — it usually works on retry.",
    errFallbackTitle: 'Something went wrong',
    errFallbackText: 'An unexpected error occurred. Please try again.',

    // Misc / A11y
    tryAnotherUsername: 'Try another username',
    changeLanguage: 'Change language',
    currentLang: 'Current',
    closeResult: 'Close result',
    genres: 'Genres',
    ratingLabel: 'Rating',
    outOf10: 'out of 10',
    movieResult: 'Movie result',
    genreFilters: 'Genre filters',
    decadeFilters: 'Decade filters',
    enterUsernameAria: 'Enter your Letterboxd username',
    usernameAria: 'Letterboxd username',
    viewDetails: 'View details',
  },
  es: {
    // Landing page
    heroTitle: 'Watchlist Roulette',
    heroSubtitle: '¿No sabés qué ver? Girá la ruleta y dejá que el destino elija de tu watchlist de Letterboxd.',
    welcomeBack: '¡Hola de nuevo!',
    continueBtn: 'Continuar',
    orSearchAnother: 'o buscar otro usuario',
    featureWheel: 'Ruleta animada interactiva',
    featureSync: 'Sincronización en vivo',
    featureFilters: 'Filtros por género y año',
    profilePrivacyNote: 'Tu perfil de Letterboxd debe estar configurado como público para cargar la lista. Nunca guardamos tus datos personales.',
    setToPublic: 'configurado como público',
    footerAffiliation: 'Hecho con ♥ — No afiliado a Letterboxd',
    loadWatchlistBtn: 'Cargar Mi Watchlist',
    loading: 'Cargando…',
    
    // Form
    usernamePlaceholder: 'tu-usuario',
    rememberMe: 'Recordarme como usuario principal',
    rememberHint: 'Guarda los datos en caché para carga instantánea',
    usernameRequired: 'Por favor ingresá tu usuario de Letterboxd.',
    usernameInvalid: 'El usuario solo puede contener letras, números, guiones y guiones bajos.',
    
    // Roulette Page
    refresh: 'Actualizar',
    changeUser: 'Cambiar usuario',
    allFilms: 'Todas las',
    films: 'películas',
    loadingWatchlist: 'Cargando watchlist…',
    fetchingData: 'Obteniendo la watchlist de',
    fetchingWait: 'desde Letterboxd. Puede demorar unos momentos para listas largas.',
    movieInPool: 'película en el pool',
    moviesInPool: 'películas en el pool',
    spin: 'GIRAR',
    spinning: 'Girando…',
    wheelAria: 'Ruleta',
    spinAria: 'Girar la ruleta',
    emptyNoMatch: 'Ninguna película coincide con tus filtros',
    emptyTryAdjusting: 'Probá ajustar los filtros de arriba',
    
    // FilterBar
    filters: 'Filtros',
    clearAll: 'Limpiar todo',
    genre: 'Género',
    minRating: 'Nota TMDB Mín',
    maxRuntime: 'Duración Máx',
    decade: 'Década',
    any: 'Cualquiera',
    
    // Grid
    showMore: 'Mostrar más',
    remaining: 'restantes',
    loadingPosters: 'Cargando posters',
    
    // Modal
    yourPick: '¡Tu elección!',
    directors: 'Directores',
    director: 'Director',
    viewOnLbd: 'Ver en Letterboxd',
    spinAgain: 'Girar de nuevo',
    readMore: 'Leer más',
    showLess: 'Ver menos',

    // Custom Wheel
    customPick: 'Elegir películas',
    customPoolActive: 'Ruleta personalizada',
    customPoolHint: 'La ruleta usa exactamente estas películas. Los filtros se ignoran.',
    customWheelTitle: 'Armá tu ruleta personalizada',
    searchPlaceholder: 'Buscar en tu watchlist…',
    movieSelected: 'película seleccionada',
    moviesSelected: 'películas seleccionadas',
    useSelection: 'Usar selección',
    clearSelection: 'Limpiar',
    noResults: 'No se encontraron películas',
    editPool: 'Editar',
    removeMovie: 'Quitar de la selección',
    selectMovie: 'Agregar a la selección',
    close: 'Cerrar',
    
    // Sync
    syncing: 'Buscando actualizaciones…',
    synced: 'Sincronizado',
    upToDate: 'Actualizado',
    syncBlocked: 'Sincronización bloqueada — usando datos en caché',
    syncFailed: 'Sincronización fallida — usando datos en caché',
    enriching: 'Enriqueciendo',
    newFilm: 'nueva película',
    newFilms: 'nuevas películas',
    added: 'agregadas',
    removed: 'eliminadas',
    cacheNoticeFrom: 'Datos en caché de hace',
    cacheNoticeMinAgo: 'min',
    cacheNoticeRefresh: 'hacé clic en Actualizar para recargar',

    // Errors
    errUserNotFoundTitle: 'Usuario no encontrado',
    errUserNotFoundText: 'No pudimos encontrar un usuario de Letterboxd con ese nombre. Revisá la ortografía e intentá de nuevo.',
    errPrivateTitle: 'La watchlist es privada',
    errPrivateText: 'Tu perfil o watchlist de Letterboxd está configurado como privado. Cámbialo a público en la configuración de privacidad de Letterboxd e intentá de nuevo.',
    errEmptyTitle: 'La watchlist está vacía',
    errEmptyText: 'Parece que todavía no agregaste películas a tu watchlist. ¡Andá a Letterboxd y agregá algunas!',
    errFetchTitle: 'Algo salió mal',
    errFetchText: 'No pudimos cargar la watchlist en este momento. Esto suele ser un problema temporal — por favor intentá de nuevo en un momento.',
    errNoKeyTitle: 'Falta la API key de TMDB',
    errNoKeyText: 'Agregá tu API key de TMDB como NEXT_PUBLIC_TMDB_API_KEY en tu archivo .env.local para habilitar el enriquecimiento de películas.',
    errCloudflareTitle: 'Bloqueado por Cloudflare',
    errCloudflareText: 'La protección anti-bots de Letterboxd bloqueó nuestra solicitud. Intentá de nuevo en unos segundos — por lo general funciona en el reintento.',
    errFallbackTitle: 'Algo salió mal',
    errFallbackText: 'Ocurrió un error inesperado. Por favor intentá de nuevo.',

    // Misc / A11y
    tryAnotherUsername: 'Probar otro usuario',
    changeLanguage: 'Cambiar idioma',
    currentLang: 'Actual',
    closeResult: 'Cerrar resultado',
    genres: 'Géneros',
    ratingLabel: 'Calificación',
    outOf10: 'de 10',
    movieResult: 'Película elegida',
    genreFilters: 'Filtros de género',
    decadeFilters: 'Filtros de década',
    enterUsernameAria: 'Ingresá tu usuario de Letterboxd',
    usernameAria: 'Usuario de Letterboxd',
    viewDetails: 'Ver detalles',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en'); // Default for SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Run on client mount to auto-detect or load from localStorage
    const saved = localStorage.getItem('lbd_language') as AppLanguage | null;
    if (saved === 'en' || saved === 'es') {
      setLanguageState(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      const detected = browserLang.startsWith('es') ? 'es' : 'en';
      setLanguageState(detected);
      localStorage.setItem('lbd_language', detected);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('lbd_language', lang);
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key];
  };

  // Prevent hydration mismatch by optionally avoiding render until mounted, 
  // but for SEO/ux we can just render the default 'en' state initially and let it snap.
  // We'll just render it.

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
