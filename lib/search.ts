import { listings, type Listing } from './meili'
import { EXTRAS, OPERATIONS, SORTS, TYPES, ZONES, type Extra, type Operation, type PropertyType, type Sort } from './portal'

export const PER_PAGE = 12

export type Filters = {
  q: string
  operation: Operation
  type: PropertyType | null
  zone: string | null
  minPrice: number
  maxPrice: number
  bedrooms: number
  extras: Extra[]
  sort: Sort
  // El trozo de mapa visible [norte, este, sur, oeste], o null para buscar en toda la ciudad.
  area: [number, number, number, number] | null
  page: number
}

export type Point = { id: number; lat: number; lng: number; label: string }

type Params = Record<string, string | string[] | undefined>

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? ''
const whole = (value: string | string[] | undefined) => Math.max(0, Number.parseInt(one(value), 10) || 0)

/**
 * Lee los filtros de la URL. Todo lo que acaba en el filtro de Meilisearch se comprueba contra
 * listas cerradas, así que nadie puede colar texto propio en la consulta.
 */
export function parseFilters(params: Params): Filters {
  const area = one(params.area).split(',').map(Number)

  return {
    q: one(params.q).slice(0, 100),
    operation: one(params.operation) in OPERATIONS ? (one(params.operation) as Operation) : 'sale',
    type: one(params.type) in TYPES ? (one(params.type) as PropertyType) : null,
    zone: (ZONES as readonly string[]).includes(one(params.zone)) ? one(params.zone) : null,
    minPrice: whole(params.minPrice),
    maxPrice: whole(params.maxPrice),
    bedrooms: Math.min(whole(params.bedrooms), 4),
    extras: [params.extras ?? []].flat().filter((extra): extra is Extra => extra in EXTRAS),
    sort: one(params.sort) in SORTS ? (one(params.sort) as Sort) : 'recent',
    area: area.length === 4 && area.every(Number.isFinite) ? (area as Filters['area']) : null,
    page: Math.max(1, whole(params.page)),
  }
}

/** Los filtros como condiciones de Meilisearch, que las une con AND. */
export function buildFilter(filters: Filters, { withZone = true } = {}): string[] {
  const filter = [`operation = ${JSON.stringify(filters.operation)}`]

  if (filters.type) filter.push(`type = ${JSON.stringify(filters.type)}`)
  if (withZone && filters.zone) filter.push(`zone = ${JSON.stringify(filters.zone)}`)
  if (filters.minPrice) filter.push(`price >= ${filters.minPrice}`)
  if (filters.maxPrice) filter.push(`price <= ${filters.maxPrice}`)
  if (filters.bedrooms) filter.push(`bedrooms >= ${filters.bedrooms}`)
  for (const extra of filters.extras) filter.push(`${extra} = true`)

  if (filters.area) {
    const [north, east, south, west] = filters.area
    filter.push(`_geoBoundingBox([${north}, ${east}], [${south}, ${west}])`)
  }

  return filter
}

const ORDER: Record<Sort, string> = {
  recent: 'publishedAt:desc',
  cheap: 'price:asc',
  expensive: 'price:desc',
  big: 'area:desc',
}

/** Una página de anuncios, con el total para la paginación. */
export async function searchListings(filters: Filters) {
  const result = await listings().search(filters.q, {
    filter: buildFilter(filters),
    sort: [ORDER[filters.sort]],
    hitsPerPage: PER_PAGE,
    page: filters.page,
  })

  return { hits: result.hits, total: result.totalHits ?? 0, pages: result.totalPages ?? 1 }
}

/** Cuántos anuncios hay en cada barrio con el resto de filtros, para el desplegable. */
export async function zoneCounts(filters: Filters): Promise<Record<string, number>> {
  const result = await listings().search(filters.q, {
    filter: buildFilter(filters, { withZone: false }),
    facets: ['zone'],
    limit: 0,
  })

  return result.facetDistribution?.zone ?? {}
}

/** Los puntos del mapa: posición y precio de hasta 500 anuncios que encajan. */
export async function mapPoints(filters: Filters): Promise<Point[]> {
  const result = await listings().search(filters.q, {
    filter: buildFilter(filters),
    attributesToRetrieve: ['id', 'price', '_geo'],
    limit: 500,
  })

  return result.hits.map((hit) => ({
    id: hit.id,
    lat: hit._geo.lat,
    lng: hit._geo.lng,
    label: `${new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(hit.price)} €`,
  }))
}

export async function findListing(id: number): Promise<Listing | null> {
  try {
    return await listings().getDocument<Listing>(id)
  } catch {
    return null
  }
}

/** Hasta cuatro anuncios de la misma operación a menos de un kilómetro, los más cercanos primero. */
export async function nearby(listing: Listing) {
  const { lat, lng } = listing._geo
  const result = await listings().search('', {
    filter: [`operation = ${JSON.stringify(listing.operation)}`, `id != ${listing.id}`, `_geoRadius(${lat}, ${lng}, 1000)`],
    sort: [`_geoPoint(${lat}, ${lng}):asc`],
    limit: 4,
  })

  // Al ordenar por distancia, Meilisearch añade a cada resultado los metros en _geoDistance.
  return result.hits as (Listing & { _geoDistance: number })[]
}
