import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Filters } from '@/components/filters'
import { SearchMap } from '@/components/search-map'
import { priceLabel, pricePerMeter, timeAgo } from '@/lib/portal'
import { mapPoints, parseFilters, searchListings, zoneCounts, type Filters as SearchFilters } from '@/lib/search'

export const metadata: Metadata = { title: 'Venta y alquiler de pisos y casas en Valencia' }

type Params = Promise<Record<string, string | string[] | undefined>>

/**
 * El buscador del portal: los filtros, la lista de anuncios y el mapa. Todo depende de la URL,
 * así que va dentro de un Suspense y se calcula en cada petición.
 */
export default function SearchPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2">
      <Suspense fallback={<p className="p-6 text-slate-500">Buscando inmuebles…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function Results({ searchParams }: { searchParams: Params }) {
  const filters = parseFilters(await searchParams)
  const [results, zones, points] = await Promise.all([searchListings(filters), zoneCounts(filters), mapPoints(filters)])

  return (
    <>
      <section className="px-4 py-6">
        <Filters zones={zones} />

        <p className="mt-5 text-sm text-slate-600">
          <strong>{results.total.toLocaleString('es-ES')}</strong> {results.total === 1 ? 'inmueble' : 'inmuebles'} en{' '}
          {filters.operation === 'rent' ? 'alquiler' : 'venta'}{filters.area ? ' en esta zona del mapa' : ' en Valencia'}
        </p>

        <div className="mt-3 space-y-3">
          {results.hits.map((listing) => (
            <article key={listing.id} className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
              <Image src={`/fotos/${listing.photo}`} alt={listing.title} width={224} height={168} className="w-40 shrink-0 object-cover sm:w-56" />
              <div className="min-w-0 p-4">
                <p className="text-lg font-semibold">
                  {priceLabel(listing)}
                  {listing.operation === 'sale' && <span className="ml-1 text-xs font-normal text-slate-500">{pricePerMeter(listing)}</span>}
                </p>
                <Link href={`/inmueble/${listing.id}`} className="block truncate font-medium text-teal-700 hover:underline">{listing.title}</Link>
                <p className="mt-1 text-sm text-slate-600">
                  {[
                    listing.bedrooms > 0 && `${listing.bedrooms} hab.`,
                    `${listing.area} m²`,
                    `${listing.bathrooms} ${listing.bathrooms === 1 ? 'baño' : 'baños'}`,
                    listing.elevator && 'ascensor',
                    listing.terrace && 'terraza',
                    listing.parking && 'garaje',
                  ].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-2 text-xs text-slate-500">{listing.agency.name} · {timeAgo(listing.publishedAt)}</p>
              </div>
            </article>
          ))}
          {results.total === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No hay inmuebles con esos filtros. Prueba a quitar alguno o a mover el mapa.</p>
          )}
        </div>

        <Pagination filters={filters} pages={results.pages} />
      </section>

      <SearchMap points={points} />
    </>
  )
}

/** Los enlaces a cada página conservan el resto de filtros de la URL. */
function Pagination({ filters, pages }: { filters: SearchFilters; pages: number }) {
  if (pages <= 1) return null

  const href = (page: number) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    params.set('operation', filters.operation)
    if (filters.type) params.set('type', filters.type)
    if (filters.zone) params.set('zone', filters.zone)
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
    if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms))
    for (const extra of filters.extras) params.append('extras', extra)
    if (filters.sort !== 'recent') params.set('sort', filters.sort)
    if (filters.area) params.set('area', filters.area.join(','))
    params.set('page', String(page))
    return `/?${params}`
  }

  return (
    <nav className="mt-4 flex flex-wrap gap-1 text-sm">
      {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
        <Link key={page} href={href(page)} scroll={false}
          className={`rounded px-3 py-1 ${page === filters.page ? 'bg-teal-700 text-white' : 'bg-white ring-1 ring-slate-300 hover:bg-slate-100'}`}>
          {page}
        </Link>
      ))}
    </nav>
  )
}
