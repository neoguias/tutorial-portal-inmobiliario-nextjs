'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { CENTER } from '@/lib/portal'
import type { Point } from '@/lib/search'
import { maplibregl, STYLE } from './maplibre'

function geojson(points: Point[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
      properties: { id: point.id, label: point.label },
    })),
  }
}

/** El trozo de mapa visible como [norte, este, sur, oeste], con cinco decimales. */
function area(map: maplibregl.Map): number[] {
  const bounds = map.getBounds()

  return [bounds.getNorth(), bounds.getEast(), bounds.getSouth(), bounds.getWest()].map((n) => Number(n.toFixed(5)))
}

/**
 * El mapa del buscador. Agrupa los anuncios cercanos en círculos con su número y, al acercarse,
 * enseña el precio de cada uno. Con la casilla marcada, escribe en la URL el trozo de mapa
 * visible cada vez que se mueve, y el servidor busca solo ahí.
 */
export function SearchMap({ points }: { points: Point[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const following = useSearchParams().has('area')
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const latest = useRef(points)

  // Cambia el parámetro area de la URL. Se lee la URL del momento, no la del primer render.
  function searchIn(bounds: number[] | null) {
    const next = new URLSearchParams(window.location.search)
    next.delete('page')
    if (bounds) next.set('area', bounds.join(','))
    else next.delete('area')
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  // El mapa se crea una sola vez. Los cambios de filtros solo le cambian los datos.
  useEffect(() => {
    const instance = new maplibregl.Map({ container: container.current!, style: STYLE, center: [CENTER.lng, CENTER.lat], zoom: 12.5 })
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }))

    instance.on('load', () => {
      // cluster agrupa los puntos que quedan a menos de 50 píxeles entre sí.
      instance.addSource('listings', { type: 'geojson', data: geojson(latest.current), cluster: true, clusterRadius: 50, clusterMaxZoom: 14 })

      instance.addLayer({
        id: 'clusters', type: 'circle', source: 'listings', filter: ['has', 'point_count'],
        paint: { 'circle-color': '#0f766e', 'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26], 'circle-stroke-width': 3, 'circle-stroke-color': '#ffffff' },
      })
      instance.addLayer({
        id: 'cluster-count', type: 'symbol', source: 'listings', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 },
        paint: { 'text-color': '#ffffff' },
      })
      instance.addLayer({
        id: 'prices', type: 'symbol', source: 'listings', filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
        paint: { 'text-color': '#0f172a', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
      })

      // Un clic en un grupo acerca el mapa hasta separarlo, y uno en un precio abre la ficha.
      instance.on('click', 'clusters', async (event) => {
        const cluster = event.features![0]
        const source = instance.getSource<maplibregl.GeoJSONSource>('listings')!
        const zoom = await source.getClusterExpansionZoom(cluster.properties.cluster_id)
        instance.easeTo({ center: (cluster.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
      })
      instance.on('click', 'prices', (event) => router.push(`/inmueble/${event.features![0].properties.id}`))

      for (const layer of ['clusters', 'prices']) {
        instance.on('mouseenter', layer, () => (instance.getCanvas().style.cursor = 'pointer'))
        instance.on('mouseleave', layer, () => (instance.getCanvas().style.cursor = ''))
      }
    })

    instance.on('moveend', () => {
      if (new URLSearchParams(window.location.search).has('area')) searchIn(area(instance))
    })

    map.current = instance

    return () => instance.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el mapa se crea una vez y lee la URL del momento
  }, [])

  // Cuando el servidor manda puntos nuevos, solo se cambian los datos de la fuente.
  useEffect(() => {
    latest.current = points
    map.current?.getSource<maplibregl.GeoJSONSource>('listings')?.setData(geojson(points))
  }, [points])

  return (
    <aside className="relative order-first h-80 lg:sticky lg:top-14 lg:order-none lg:h-[calc(100vh-3.5rem)]">
      <div ref={container} className="h-full w-full" />
      <label className="absolute left-3 top-3 flex items-center gap-2 rounded bg-white px-3 py-1.5 text-sm shadow">
        <input type="checkbox" checked={following} onChange={(e) => searchIn(e.target.checked && map.current ? area(map.current) : null)} className="accent-teal-700" />
        Buscar al mover el mapa
      </label>
    </aside>
  )
}
