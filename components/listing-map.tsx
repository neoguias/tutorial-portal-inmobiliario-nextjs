'use client'

import { useEffect, useRef } from 'react'
import { maplibregl, STYLE } from './maplibre'

/** El mapa pequeño de la ficha, con un solo marcador y sin poder arrastrarlo. */
export function ListingMap({ lat, lng }: { lat: number; lng: number }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const map = new maplibregl.Map({ container: container.current!, style: STYLE, center: [lng, lat], zoom: 15, interactive: false })
    new maplibregl.Marker({ color: '#0f766e' }).setLngLat([lng, lat]).addTo(map)

    return () => map.remove()
  }, [lat, lng])

  return <div ref={container} className="mt-6 h-64 overflow-hidden rounded-lg" />
}
