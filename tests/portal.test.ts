import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { client, listings } from '@/lib/meili'
import { buildFilter, findListing, nearby, parseFilters, searchListings, zoneCounts } from '@/lib/search'
import { loadListings } from '@/lib/seed'

describe('los filtros de la URL', () => {
  it('ignoran los valores que no están en las listas', () => {
    const filters = parseFilters({ zone: 'Ruzafa" OR 1=1', type: 'castillo', extras: ['terrace', 'piscina'], bedrooms: '9' })

    expect(filters.zone).toBeNull()
    expect(filters.type).toBeNull()
    expect(filters.extras).toEqual(['terrace'])
    expect(filters.bedrooms).toBe(4)
  })

  it('se convierten en condiciones de Meilisearch', () => {
    const filters = parseFilters({ operation: 'rent', zone: 'El Carmen', maxPrice: '1200', area: '39.48,-0.37,39.47,-0.38' })

    expect(buildFilter(filters)).toEqual([
      'operation = "rent"',
      'zone = "El Carmen"',
      'price <= 1200',
      '_geoBoundingBox([39.48, -0.37], [39.47, -0.38])',
    ])
  })
})

// Las búsquedas se prueban contra el Meilisearch de Docker. Si no está en marcha, se saltan.
const meilisearch = await client.health().then(() => true, () => false)

describe.runIf(meilisearch)('las búsquedas', () => {
  beforeAll(() => loadListings(), 60000)
  afterAll(() => client.deleteIndex(listings().uid).waitTask())

  it('filtran por barrio y tipo', async () => {
    const { hits, total } = await searchListings(parseFilters({ zone: 'Ruzafa', type: 'flat' }))

    expect(total).toBeGreaterThan(0)
    expect(hits.every((hit) => hit.zone === 'Ruzafa' && hit.type === 'flat')).toBe(true)
  })

  it('solo devuelven lo que cae dentro del mapa', async () => {
    const [north, east, south, west] = [39.4665, -0.369, 39.4565, -0.379]
    const { hits } = await searchListings(parseFilters({ area: [north, east, south, west].join(',') }))

    expect(hits.length).toBeGreaterThan(0)
    for (const { _geo } of hits) {
      expect(_geo.lat).toBeLessThanOrEqual(north)
      expect(_geo.lat).toBeGreaterThanOrEqual(south)
      expect(_geo.lng).toBeLessThanOrEqual(east)
      expect(_geo.lng).toBeGreaterThanOrEqual(west)
    }
  })

  it('cuentan bien los anuncios de cada barrio', async () => {
    const filters = parseFilters({})
    const counts = await zoneCounts(filters)

    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe((await searchListings(filters)).total)
  })

  it('encuentran los cercanos, del más próximo al más lejano y sin el propio anuncio', async () => {
    const listing = (await findListing(1))!
    const others = await nearby(listing)
    const distances = others.map((other) => other._geoDistance)

    expect(others.map((other) => other.id)).not.toContain(1)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
    expect(Math.max(...distances)).toBeLessThanOrEqual(1000)
  })
})
