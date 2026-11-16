import { Meilisearch } from 'meilisearch'
import type { Operation, PropertyType } from './portal'

export type Listing = {
  id: number
  reference: string
  title: string
  description: string
  operation: Operation
  type: PropertyType
  zone: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  terrace: boolean
  elevator: boolean
  parking: boolean
  photo: string
  // Meilisearch no tiene joins, así que cada anuncio guarda los datos de su agencia.
  agency: { name: string; phone: string; email: string }
  // La fecha de publicación en segundos, un número que Meilisearch sabe ordenar.
  publishedAt: number
  _geo: { lat: number; lng: number }
}

export const client = new Meilisearch({
  host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY,
})

/** El índice de los anuncios. Los tests usan otro nombre para no tocar el de desarrollo. */
export function listings() {
  return client.index<Listing>(process.env.MEILISEARCH_INDEX ?? 'listings')
}

// Los ajustes del índice: dónde se busca el texto y por qué campos se filtra y se ordena.
// _geo permite filtrar por zona del mapa y ordenar por distancia.
export const SETTINGS = {
  searchableAttributes: ['title', 'zone', 'reference', 'description'],
  filterableAttributes: ['id', 'operation', 'type', 'zone', 'price', 'bedrooms', 'area', 'terrace', 'elevator', 'parking', '_geo'],
  sortableAttributes: ['price', 'area', 'publishedAt', '_geo'],
}
