import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ListingMap } from '@/components/listing-map'
import { priceLabel, pricePerMeter, TYPES } from '@/lib/portal'
import { findListing, nearby } from '@/lib/search'

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const listing = await findListing(Number((await params).id))

  return { title: listing?.title ?? 'Anuncio' }
}

/**
 * La ficha de un anuncio: su foto, sus datos, la agencia que lo publica, su posición en el
 * mapa y otros anuncios cercanos.
 */
export default function ListingPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Cargando anuncio…</p>}>
      <ListingDetails params={params} />
    </Suspense>
  )
}

async function ListingDetails({ params }: { params: Params }) {
  const listing = await findListing(Number((await params).id))

  if (!listing) notFound()

  const others = await nearby(listing)
  const chips = [
    TYPES[listing.type],
    `${listing.area} m²`,
    listing.bedrooms > 0 && `${listing.bedrooms} ${listing.bedrooms === 1 ? 'dormitorio' : 'dormitorios'}`,
    `${listing.bathrooms} ${listing.bathrooms === 1 ? 'baño' : 'baños'}`,
    listing.elevator && 'Ascensor',
    listing.terrace && 'Terraza',
    listing.parking && 'Garaje',
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href={`/?operation=${listing.operation}`} className="text-sm text-slate-500 hover:text-teal-700">← Volver a la búsqueda</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Image src={`/fotos/${listing.photo}`} alt={listing.title} width={960} height={640} priority className="aspect-[3/2] w-full rounded-lg object-cover" />

          <h1 className="mt-5 text-2xl font-semibold">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{listing.zone}, Valencia · Ref. {listing.reference}</p>

          <p className="mt-4 text-3xl font-bold">{priceLabel(listing)}</p>
          {listing.operation === 'sale' && <p className="text-sm text-slate-500">{pricePerMeter(listing)}</p>}

          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {chips.map((chip) => <li key={String(chip)} className="rounded bg-white px-3 py-1 ring-1 ring-slate-200">{chip}</li>)}
          </ul>

          <p className="mt-5 leading-relaxed text-slate-700">{listing.description}</p>

          <ListingMap lat={listing._geo.lat} lng={listing._geo.lng} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Anunciado por</p>
            <p className="mt-1 font-semibold">{listing.agency.name}</p>
            <p className="mt-3 text-sm">{listing.agency.phone}</p>
            <a href={`mailto:${listing.agency.email}?subject=${encodeURIComponent(`Ref. ${listing.reference}`)}`}
              className="mt-4 block rounded bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-800">
              Contactar
            </a>
          </div>

          {others.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">Cerca de aquí</h2>
              <div className="space-y-3">
                {others.map((other) => (
                  <Link key={other.id} href={`/inmueble/${other.id}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-2 hover:border-teal-700">
                    <Image src={`/fotos/${other.photo}`} alt="" width={96} height={64} className="h-16 w-24 shrink-0 rounded object-cover" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">{priceLabel(other)}</p>
                      <p className="truncate text-slate-600">{other.title}</p>
                      <p className="text-xs text-slate-500">a {Math.round(other._geoDistance).toLocaleString('es-ES')} m</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
