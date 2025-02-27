import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

export const openai = new OpenAI()

export const createEmbedings = async (document) => {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: document,
    encoding_format: 'float',
  })

  return embedding
}
