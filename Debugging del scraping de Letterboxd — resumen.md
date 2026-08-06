# Debugging del scraping de Letterboxd — resumen de la sesión

## Contexto
Proyecto: ruleta que elige una película al azar de la watchlist de Letterboxd de un usuario. Idea inicial: hacer scraping en vez de depender siempre de que el usuario suba el CSV exportado.

## Síntoma inicial
El endpoint `/api/watchlist?username=X` devolvía `FETCH_ERROR`, con un debug que mostraba:
- `hasDataFilm: false`
- `filmHrefCount: 0`
- HTML de 120KB, status 200 (no era un challenge de Cloudflare explícito)

## Hipótesis 1: bloqueo anti-bot a nivel TLS/fingerprint
El código original (`letterboxd.ts`) buscaba el atributo `data-film-slug`, que no aparecía en ningún lado del HTML devuelto. Se probó:
- `curl` con distintos User-Agent (incluso uno completo de Chrome real) → seguía sin encontrar `data-film`
- Se descartó que fuera solo un tema de headers

Conclusión de esa etapa: se sospechó bloqueo de Cloudflare a nivel de fingerprint TLS/HTTP2 (algo que ni `curl` ni `fetch()` de Node pueden esquivar, aunque los headers sean idénticos a los de un browser real).

## Camino explorado: servicios de scraping externos
Se evaluaron 3 caminos: browser headless (Playwright), servicio externo de scraping, o descartar scraping y usar solo CSV. Se eligió el servicio externo por ser el mejor balance esfuerzo/robustez para un proyecto personal.

### ScraperAPI (free tier, 5000 créditos/mes)
- Request plana → 0 resultados
- `render=true` (JS rendering) → seguía en 0, tardó ~17s
- `premium=true` / `ultra_premium=true` → **el plan free no permite usar proxies premium en absoluto** (error explícito del servicio, no relacionado a créditos disponibles)

### ScrapingBee (free trial, 1000 créditos)
- A diferencia de ScraperAPI, no restringe proxies premium por plan — los cobra más caro en créditos, pero están disponibles en el trial gratis
- `stealth_proxy=true` (75 créditos/request) → **trajo el HTML completo con contenido real**

## El verdadero problema (no era bloqueo)
Al inspeccionar el HTML real traído por ScrapingBee, se descubrió que:
- La página **sí tenía** todo el contenido de la watchlist
- Letterboxd había cambiado la estructura de HTML: ya no usa `data-film-slug` / `data-film-name` / `data-film-id`, ahora usa `div[data-component-class="LazyPoster"]` con `data-item-slug` y `data-item-name` / `data-item-full-display-name` (formato `"Título (Año)"`)
- El link a la película sigue el mismo patrón de siempre (`href="/film/slug/"`)
- La paginación sigue funcionando igual (`<a class="next" href=".../page/2/">`), no hizo falta tocar `detectNextPage`

**Conclusión clave:** nunca hubo bloqueo anti-bot real. El "0 resultados" desde el principio era un falso negativo — se estaba buscando un atributo (`data-film`) que Letterboxd ya no usa. Confirmado corriendo la misma request plana de ScraperAPI (sin premium ni stealth) contra el selector nuevo (`data-item-slug`): dio 28 matches con 1 solo crédito.

## Solución final
- `parseFilmsFromHtml` en `letterboxd.ts`: se agregó una nueva estrategia de parseo (probada primero, con las viejas como fallback) que lee `[data-item-slug]`, separando nombre y año con un regex sobre `data-item-full-display-name`/`data-item-name`.
- `fetchPage`: se simplificó para pegarle a Letterboxd a través de **ScraperAPI, request plana** (sin `render`, sin `premium`, sin `stealth`) — 1 crédito por página, el más barato de todos los caminos probados.
- Se descartó ScrapingBee y el uso de proxies premium/stealth por innecesarios.

## Pendiente / próximos pasos
- Confirmar por qué una consulta consumió 10 créditos (¿son 10 páginas reales de paginación, o un falso positivo en la detección de "next" que sigue pidiendo páginas de más?).
- Revisar estrategia de caching/costos para uso en producción si varios usuarios prueban con usernames distintos.
- Regenerar las API keys de ScraperAPI y ScrapingBee usadas durante el debugging (quedaron expuestas en el chat en algún momento).