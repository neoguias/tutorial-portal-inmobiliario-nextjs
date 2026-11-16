'use client'

import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// MapLibre procesa las teselas en un worker, un archivo aparte que el bundler no copia por su
// cuenta. new URL(…, import.meta.url) le pide a Next.js que lo copie y nos da su dirección.
maplibregl.setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString())

// El mapa base de OpenFreeMap, con datos de OpenStreetMap: gratis, sin registro y sin clave.
export const STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export { maplibregl }
