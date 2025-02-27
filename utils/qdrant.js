import axios from 'axios'
import dotenv from 'dotenv'
import { QdrantClient } from '@qdrant/js-client-rest'

dotenv.config()

const client = new QdrantClient({
  url: process.env.QDRANT_API_URL,
  apiKey: process.env.QDRANT_API_KEY,
})

export const saveEmbedings = async (embeddings, colection) => {
  const outcome = await client.upsert(colection, { points: embeddings })

  return outcome
}

export const searchEmbedings = async (colection, query, k) => {
  const outcome = await client.search(colection, {
    vector: query,
    limit: k,
    with_payload: true,
  })

  return outcome
}
