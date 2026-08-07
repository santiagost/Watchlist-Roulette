# 🎡 Watchlist Roulette

Una ruleta para decidir qué ver: ingresá tu usuario de [Letterboxd](https://letterboxd.com) y girá la rueda para elegir tu próxima película entre tu watchlist.

## ✨ Funcionalidades

- **Ruleta interactiva** con la paleta de colores de Letterboxd, textos radiales y aterrizaje exacto sobre la película ganadora.
- **Filtros**: género, rating mínimo, duración máxima y década (los filtros se desactivan al usar la ruleta personalizada).
- **Ruleta personalizada**: elegí a mano las películas que participan con un buscador, y la selección queda guardada por usuario.
- **Títulos bilingües ES/EN**: cada película muestra su título en el idioma de la app, con el título alternativo como secundario en el modal (obtenidos de TMDB sin llamadas extra).
- **Interfaz en Español e Inglés** con detección automática del idioma del navegador.
- **Enriquecimiento con TMDB**: posters, sinopsis, géneros, rating, duración y directores, con caché local (indexed localStorage) y sync incremental.
- **Errores claros**: usuario inexistente, watchlist privada, bloqueo de Cloudflare, etc.

## 🛠 Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Cheerio](https://cheerio.js.org) para el scraping de Letterboxd (server-side)
- [TMDB API](https://www.themoviedb.org/settings/api) para el enriquecimiento de películas
- [lucide-react](https://lucide.dev) para los íconos

## 🚀 Setup local

```bash
npm install
npm run dev
```

Creá un archivo `.env.local` en la raíz con tu API key de TMDB (gratis en [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)):

```
TMDB_API_KEY=tu_api_key_aca
```

La key se usa **solo server-side** (ruta `/api/enrich`) y nunca llega al navegador. Mirá `.env.local.example`.

## ☁️ Deploy en Vercel

1. Importá el repo en [vercel.com/new](https://vercel.com/new).
2. En **Project → Settings → Environment Variables**, agregá `TMDB_API_KEY` (Production, Preview y Development).
3. Deploy automático con cada push a `main`/`master`.

## 📁 Estructura

```
app/
  page.tsx            # Landing: ingresar usuario
  [username]/page.tsx # Ruleta, filtros, grilla y modal
  api/
    watchlist/        # Scraping de la watchlist de Letterboxd (server)
    enrich/           # Proxy de TMDB (server, guarda la API key)
components/           # Ruleta, filtros, grilla, modal, picker, i18n toggle...
lib/                  # i18n, caché, scraping, TMDB, tipos
```

## 📝 Notas

- El scraping respeta el flujo normal de Letterboxd; si aparece "Bloqueado por Cloudflare", reintentá en unos segundos.
- El estado de cada usuario (ruleta personalizada) se guarda en el navegador, no en un backend.
