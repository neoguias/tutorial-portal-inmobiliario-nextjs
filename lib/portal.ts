// El portal de ejemplo del tutorial. Es inventado, igual que sus agencias y sus anuncios.
export const PORTAL = 'Llar'

// El centro del mapa al abrir el buscador: la ciudad de Valencia.
export const CENTER = { lat: 39.4745, lng: -0.3725 }

export const ZONES = [
  'Algirós', 'Benicalap', 'Benimaclet', 'Cabanyal', 'Campanar',
  'El Carmen', 'Extramurs', 'Malvarrosa', 'Patraix', 'Ruzafa',
] as const

export const OPERATIONS = { sale: 'Comprar', rent: 'Alquilar' } as const

export const TYPES = { flat: 'Piso', house: 'Casa', commercial: 'Local', office: 'Oficina' } as const

export const EXTRAS = { terrace: 'Terraza', elevator: 'Ascensor', parking: 'Garaje' } as const

export const SORTS = { recent: 'Más recientes', cheap: 'Más baratos', expensive: 'Más caros', big: 'Más grandes' } as const

export type Operation = keyof typeof OPERATIONS
export type PropertyType = keyof typeof TYPES
export type Extra = keyof typeof EXTRAS
export type Sort = keyof typeof SORTS

const euros = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })

export function euroLabel(amount: number): string {
  return `${euros.format(amount)} €`
}

/** 289.000 € en venta y 850 €/mes en alquiler. */
export function priceLabel(listing: { price: number; operation: string }): string {
  return listing.operation === 'rent' ? `${euroLabel(listing.price)}/mes` : euroLabel(listing.price)
}

/** El precio por metro cuadrado, que es como se comparan los pisos en venta. */
export function pricePerMeter(listing: { price: number; area: number }): string {
  return `${euros.format(Math.round(listing.price / Math.max(listing.area, 1)))} €/m²`
}

const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** «hace 3 horas» o «hace 2 días», a partir de una fecha en segundos. */
export function timeAgo(seconds: number, now = Date.now()): string {
  const minutes = Math.round((seconds * 1000 - now) / 60000)

  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  if (Math.abs(minutes) < 60 * 24) return relative.format(Math.round(minutes / 60), 'hour')

  return relative.format(Math.round(minutes / (60 * 24)), 'day')
}
