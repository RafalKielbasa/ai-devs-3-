import url from 'url'
import path from 'path'
import fs from 'fs'
import { createEmbedings } from '../utils/openai.js'
import { randomUUID } from 'crypto'
import { saveEmbedings, searchEmbedings } from '../utils/qdrant.js'

import { readAllFiles, readTextFile, sendAnswer } from '../utils/helpers.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const archivePath = path.join(__dirname, '../files/S03E02/archive')

const filesPaths = readAllFiles(archivePath)

const embed = 'kradzież'

const main = async () => {
  const query = await createEmbedings(embed)

  const outcome = await searchEmbedings('ai-devs', query.data[0].embedding, 1)

  const data = {
    taskName: 'wektory',
    answer: outcome[0].payload.date,
  }

  await sendAnswer(data)
}

main()

const prepareData = async () => {
  for (const filePath of filesPaths) {
    try {
      const fileContent = await readTextFile(path.join(archivePath, filePath))
      const lines = fileContent.split('\n').filter((line) => line.trim() !== '')
      const fileName = path.basename(filePath, '.txt')
      const formattedDate = fileName.replace(/_/g, '-')

      const embeddings = []

      for (const line of lines) {
        const embedding = await createEmbedings(
          `Date"${formattedDate}: ${line}`
        )
        const data = {
          id: randomUUID(),
          vector: embedding.data[0].embedding,
          payload: {
            date: formattedDate,
            text: line,
          },
        }
        embeddings.push(data)
      }

      const outcome = await saveEmbedings(embeddings, 'ai-devs')
      console.log(outcome)
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
    }
  }
}

// prepareData()
