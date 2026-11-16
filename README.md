# Portal inmobiliario con Next.js

Un portal inmobiliario de ejemplo al estilo de Idealista, con los anuncios de varias agencias de Valencia, un buscador con filtros, búsqueda por texto, un mapa que agrupa los anuncios y se puede usar para buscar, y una ficha por anuncio con su posición y los inmuebles cercanos.

Está hecho con Next.js 16 (App Router y Server Components). Los anuncios viven en [Meilisearch](https://www.meilisearch.com), al que se accede con su cliente oficial de JavaScript, y el mapa es [MapLibre](https://maplibre.org) con las teselas gratuitas de [OpenFreeMap](https://openfreemap.org).

El tutorial completo, paso a paso, está en Neoguias: [Cómo crear un portal inmobiliario como Idealista con Next.js](https://www.neoguias.com/crear-portal-inmobiliario-nextjs/). Hay una versión del mismo portal con Laravel y Livewire en [este otro repositorio](https://github.com/neoguias/tutorial-portal-inmobiliario-laravel).

## Cómo arrancarlo

```bash
npm install
cp .env.example .env
```

Genera una clave para Meilisearch con `openssl rand -hex 16` y ponla en `MEILISEARCH_KEY`. Después arranca Meilisearch, carga los anuncios y arranca la aplicación:

```bash
docker compose up -d
npm run seed
npm run dev
```

Abre `http://localhost:3000`. El script carga en Meilisearch los 240 anuncios de `data/listings.json`, de cuatro agencias inventadas y repartidos por diez barrios de Valencia. Los diez primeros son los inmuebles del [CRM inmobiliario con Next.js](https://github.com/neoguias/tutorial-crm-inmobiliario-nextjs). Las fotos de ejemplo están generadas con IA y son de uso libre.

Los tests de las búsquedas usan el Meilisearch de Docker, con un índice propio que se borra al terminar, y se saltan si no está en marcha:

```bash
npm test
```

Requiere Node 22.12 o superior, que es lo que pide Vitest, y Docker.

## Dónde está cada cosa

- [`lib/meili.ts`](lib/meili.ts): el cliente de Meilisearch, el tipo de los anuncios y los ajustes del índice.
- [`lib/search.ts`](lib/search.ts): los filtros de la URL convertidos en búsquedas, el recuento por barrio, los puntos del mapa y los anuncios cercanos.
- [`lib/seed.ts`](lib/seed.ts) y [`data/listings.json`](data/listings.json): los anuncios de ejemplo.
- [`app/page.tsx`](app/page.tsx) y [`app/inmueble/[id]/page.tsx`](app/inmueble/[id]/page.tsx): el buscador y la ficha de cada anuncio.
- [`components`](components): los filtros y los dos mapas de MapLibre.
- [`tests/portal.test.ts`](tests/portal.test.ts): los filtros, el mapa, el recuento por barrio y los cercanos.

## Autor

Creado por [Edu Lázaro](https://edulazaro.com) para [Neoguias](https://www.neoguias.com).

## Licencia

Este ejemplo es software libre con [licencia MIT](LICENSE).
