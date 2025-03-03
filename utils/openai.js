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

export const createCompletion = async (systemPrompt, userPropmt, model) => {
  const response = await openai.chat.completions.create({
    model: model || 'gpt-4o',
    temperature: 1,
    messages: [
      {
        role: 'system',
        content: systemPrompt || '',
      },
      {
        role: 'user',
        content: userPropmt || '',
      },
    ],
  })

  return response.choices[0].message.content
}
