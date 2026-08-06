# Registro de Cambios — Watchlist Roulette

Este documento lleva un registro histórico de las funcionalidades, refactorizaciones y correcciones realizadas en el proyecto.

---

## [Unreleased] - 2026-08-01

### 🌐 Soporte Multilingüe (Español / Inglés - i18n)
- **Detección Automática e Interfaz Bilingüe**: La aplicación detecta el idioma del navegador (`es` o `en`) y permite alternar manualmente mediante un botón sutil `<LanguageToggle />` presente en la landing page y en la cabecera de la ruleta.
- **Consultas Localizadas a TMDB (`lib/tmdb.ts`)**: Las solicitudes a la API de TMDB envían el parámetro `language=es-ES` o `language=en-US`, trayendo sinopsis (*overview*), géneros y detalles de las películas en el idioma seleccionado.
- **Invalidación Inteligente de Caché (`lib/cache.ts`)**: Si el usuario guardó datos en caché en un idioma (p. ej. inglés) y luego cambia a español, el sistema detecta la discrepancia de idioma y fuerza un refresco automático desde TMDB en español.
- **Traducción Completa de UI**: Se tradujeron todos los componentes principales (`UsernameForm`, `FilterBar`, `WatchlistGrid`, `MovieModal`, estados de carga, sync y errores).
- **Traducción del Texto Restante**: Se trasladaron a i18n las cadenas que aún estaban hardcodeadas en inglés: contador de películas en el pool, botón de giro, estado vacío de la ruleta, mensajes de sincronización (bloqueo, fallo, enriquecimiento, `added`/`removed`), aviso de datos en caché, todos los estados de error y los `aria-label` de accesibilidad en toda la interfaz.
- **Títulos Bilingües (Diccionario ES/EN)**: Se corrigió que el título quedara siempre en inglés (TMDB nunca sobreescribía `name`). Ahora cada película guarda `nameEn`, `nameEs` y `originalTitle` (sin costo extra de llamadas a TMDB: la búsqueda aporta el título del idioma de la app y el detail se pide en el idioma opuesto). Los títulos se muestran en el idioma de la app en toda la interfaz (ruleta, grilla, modal, chips del pool). El título del idioma opuesto se muestra como secundario en el modal y en los items del selector personalizado, con `originalTitle` como respaldo cuando ES=EN. La búsqueda del selector ahora encuentra por ambos títulos + título original + año. Requiere bump de caché (`CACHE_VERSION` 3→4, re-enriquecimiento único).

### 🎡 Ruleta Personalizada
- **Selección Manual de Películas (`CustomWheelPicker`)**: Nueva funcionalidad para armar una ruleta a mano eligiendo películas específicas de la watchlist (sin depender de los filtros de género/año). Incluye modal con buscador por nombre/año (case y acentos insensibles) y lista completa con posters y toggle de selección, contador, botones "Limpiar" y "Usar selección".
- **Barra de Pool Activo (`CustomPoolBar`)**: Al activar la ruleta personalizada se muestra un badge "Ruleta personalizada" con chips de las películas elegidas (quitar con X), y acciones de "Editar", "Limpiar" y desactivar. Cuando la selección es activa, es definitiva: los filtros se ignoran.
- **Persistencia por Usuario (`lib/cache.ts`)**: La selección se guarda en `localStorage` (`lbd_custompool_<usuario>`). Al volver, se restaura podando automáticamente los slugs que ya no estén en la watchlist.
- **TMDB Search (futuro)**: La búsqueda queda acotada a la propia watchlist por ahora; se anota como mejora futura poder agregar películas externas buscando en TMDB.

### 🎡 Ruleta y Renderizado
- **Borde Exterior Negro con Borde Blanco**: Se actualizó el marco de la ruleta (`.wheelOuter`) a fondo negro con un borde exterior blanco sólido (`2px solid #FFFFFF`), brindando mayor contraste con respecto al fondo oscuro.
- **Puntero/Flecha Superior más Preciso**: Se redujo el tamaño de la flecha y el círculo del puntero indicador en la parte superior de la ruleta para evitar que abarque múltiples sectores en listas de películas extensas.
- **Paleta de Colores de Letterboxd**: Se actualizó la paleta de la ruleta para basarse en los tres colores principales de Letterboxd (`#FF8000` Naranja, `#00C030` Verde, `#146FA8` Azul), alternados con variantes muy oscuras/casi negras de cada tono para lograr un contraste alto entre sectores adyacentes.
- **Texto Radial (Borde exterior hacia el Centro)**: Se corrigió la orientación de las etiquetas en la ruleta. Ahora el título de cada película inicia en el borde exterior del sector (`outerRadius`) y se lee hacia el centro (`innerRadius`) siguiendo la línea radial del sector.
- **Truncado de Texto Dinámico**: El texto mide el ancho disponible según el radio del círculo y agrega puntos suspensivos (`…`) en lugar de sobreponerse al centro.
- **Corrección de Aterrizaje del Puntero**: Se corrigió el cálculo del ángulo de giro en `handleSpin` (faltaba restar el ángulo inicial en `totalDelta`), de modo que el sector ganador siempre queda alineado con la flecha superior y coincide exactamente con la película que muestra el modal.

### 🎬 Grilla e Interacción
- **Modal de Detalle desde la Grilla**: Al hacer clic en cualquier película de la grilla (`WatchlistGrid`), ahora se abre el mismo modal de película (`MovieModal`) con toda su información enriquecida (sin la insignia *"Your pick!"*), en lugar de redirigir directamente a Letterboxd.

### 🎨 Iconografía e Iconos
- **Lucide React**: Se reemplazaron todos los emojis planos y caracteres unicode por iconos SVG limpios de `lucide-react` (`Film`, `Disc3`, `Search`, `Heart`, etc.) a lo largo de toda la interfaz (`HomePage`, `UsernameForm`, `MovieModal`, `WatchlistGrid`, `FilterBar`, `RouletteWheel`).

### 💾 Sistema de Caché y Usuario Principal
- **Caché Inteligente de Watchlist (`lib/cache.ts`)**: Se extendió la gestión del caché local en `localStorage` para el usuario principal (`Primary User`).
- **Diffing de Watchlist (`diffWatchlist`)**: Implementación de sincronización incremental. Al volver a consultar una watchlist, se calcula qué películas son nuevas (`added`), cuáles fueron vistas o removidas (`removed`) y cuáles permanecen en caché (`unchanged`), evitando re-enriquecer películas existentes.
- **Acceso Rápido en Landing Page (`app/page.tsx`)**: Se agregó tarjeta de bienvenida y botón "Continuar como @usuario" cuando un usuario principal ya fue guardado previamente.

### ⚙️ Configuración / Infraestructura
- **Imágenes de TMDB (`next.config.ts`)**: Se configuró `images.remotePatterns` para permitir que `next/image` sirva posters y backdrops desde `image.tmdb.org`.
- **Endpoints API (`app/api/`)**: Se crearon las rutas `/api/watchlist` (fetch y paginación de la watchlist) y `/api/debug-watchlist` (endpoint de depuración para inspeccionar la respuesta de Letterboxd durante el scraping).

---

## 2026-07-30

### 🕷️ Scraping de Letterboxd
- **Direct Fetch sin Proxies**: Se eliminó la dependencia de servicios de scraping externos (ScraperAPI/ScrapingBee) al verificar que Letterboxd responde correctamente a solicitudes HTTP directas desde Node.js usando cabeceras estándar de navegador.
- **Actualización de Selectores de HTML**: Se adaptó el parser de Cheerio en `lib/letterboxd.ts` a la nueva estructura de componentes de Letterboxd (`div[data-component-class="LazyPoster"]`, `data-item-slug`, `data-item-full-display-name`).

### 🎬 Enriquecimiento con TMDB
- **Enriquecimiento Progresivo**: Integración con la API de TMDB en lotes (batches de 5) para asociar posters de alta calidad, duraciones, géneros, calificaciones y directores sin bloquear la interacción con la ruleta.

---

## 2026-07-29

### 🚀 Inicialización del Proyecto
- **Setup Inicial**: Inicialización de Next.js 15 (App Router, TypeScript, ESLint, Vanilla CSS Modules) con tipografía Google Fonts (Outfit, Inter) y tema oscuro personalizado con paleta Letterboxd.
- **Componentes Núcleo**:
  - `UsernameForm`: Formulario de ingreso de usuario con validaciones.
  - `RouletteWheel`: Ruleta animada interactiva basada en HTML5 Canvas con física de desaceleración (*ease-out quintic*).
  - `MovieModal`: Modal de resultado de película seleccionada con backdrop, poster, detalles y botón a Letterboxd.
  - `FilterBar`: Filtros dinámicos por género, calificación mínima, duración máxima y década.
  - `WatchlistGrid`: Grilla responsiva de tarjetas de posters con estado de carga *skeleton*.
