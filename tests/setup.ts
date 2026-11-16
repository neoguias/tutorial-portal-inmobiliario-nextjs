import 'dotenv/config'

// Los tests cargan los anuncios en un índice con nombre propio, que se borra al terminar, así
// que no tocan el que usas para desarrollar.
process.env.MEILISEARCH_INDEX = `test_listings_${Math.random().toString(36).slice(2, 8)}`
