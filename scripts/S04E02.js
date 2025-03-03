import fs from 'fs'
import url from 'url'
import path from 'path'
import { createCompletion } from '../utils/openai.js'
import { sendAnswer } from '../utils/helpers.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const correctFilePath = path.join(__dirname, '../files/S04E02/correct.txt')
const incorrectFilePath = path.join(__dirname, '../files/S04E02/incorrect.txt')
const verifyFilePath = path.join(__dirname, '../files/S04E02/verify.txt')

const model = 'ft:gpt-4o-2024-08-06:personal:validatiion:B6LxO2uQ'

const removeBeforeEquals = (str) => str.replace(/^[^=]+=/, '')

const main = async () => {
  const verifyData = await fs.promises.readFile(verifyFilePath, 'utf8')
  const verifyLines = verifyData.trim().split('\n')

  //   const verifyEntries = verifyLines.map((line) => {
  //     const [prompt, response] = line.split('=')
  //     return {
  //       prompt,
  //       response,
  //     }
  //   })

  const data = {
    taskName: 'research',
    answer: [],
  }

  for (const line of verifyLines) {
    const [reference, response] = line.split('=')

    const completion = await createCompletion(
      'Classify this data',
      response,
      model
    )

    if (completion === 'correct') {
      data.answer.push(reference)
    }
  }

  sendAnswer(data)
  console.log(data)
}

main()

const createSystemObject = (role, content) => ({
  role,
  content,
})

const transformAndSaveToJSONL = async () => {
  const systemObject = createSystemObject('system', 'Classify this data')

  try {
    // Read the files
    const correctData = await fs.promises.readFile(correctFilePath, 'utf8')
    const incorrectData = await fs.promises.readFile(incorrectFilePath, 'utf8')

    // Split by lines and prepare data
    const correctLines = correctData.trim().split('\n')
    const incorrectLines = incorrectData.trim().split('\n')

    // Create JSONL entries
    const correctEntries = correctLines.map((line) => ({
      messages: [
        systemObject,
        createSystemObject('user', line),
        createSystemObject('assistant', 'correct'),
      ],
    }))

    const incorrectEntries = incorrectLines.map((line) => ({
      messages: [
        systemObject,
        createSystemObject('user', line),
        createSystemObject('assistant', 'incorrect'),
      ],
    }))

    // Combine entries
    const allEntries = [...correctEntries, ...incorrectEntries]

    // Convert to JSONL format (each line is a JSON object)
    const jsonlContent = allEntries
      .map((entry) => JSON.stringify(entry))
      .join('\n')

    // Define output path
    const outputPath = path.join(__dirname, '../files/S04E02/output.jsonl')

    // Write to file
    await fs.promises.writeFile(outputPath, jsonlContent, 'utf8')

    console.log(`Successfully created JSONL file at ${outputPath}`)
    console.log(
      `Processed ${correctLines.length} correct entries and ${incorrectLines.length} incorrect entries`
    )

    return outputPath
  } catch (error) {
    console.error('Error transforming files to JSONL:', error)
    throw error
  }
}

// transformAndSaveToJSONL()
