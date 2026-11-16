import 'dotenv/config'
import { loadListings } from '../lib/seed'

console.log(`${await loadListings()} anuncios cargados en Meilisearch.`)
