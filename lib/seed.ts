import { readFile } from 'node:fs/promises'
import { listings, SETTINGS, type Listing } from './meili'

type Row = Omit<Listing, 'publishedAt'> & { minutesAgo: number }

/**
 * Crea el índice con sus ajustes, lo vacía y carga los 240 anuncios de data/listings.json.
 * Cada anuncio guarda cuántos minutos hace que se publicó, para que las fechas sigan siendo
 * recientes cada vez que se cargan.
 */
export async function loadListings(): Promise<number> {
  const rows: Row[] = JSON.parse(await readFile('data/listings.json', 'utf8'))
  const now = Math.floor(Date.now() / 1000)
  const documents: Listing[] = rows.map(({ minutesAgo, ...listing }) => ({ ...listing, publishedAt: now - minutesAgo * 60 }))

  const index = listings()
  await index.updateSettings(SETTINGS).waitTask()
  await index.deleteAllDocuments().waitTask()
  await index.addDocuments(documents).waitTask()

  return documents.length
}
