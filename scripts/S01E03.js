import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs/promises'
import { openai } from '../utils/openai.js'

dotenv.config()

const CONFIG = {
  centralUrl: `https://centrala.ag3nts.org/data/${process.env.AIDEVS_API_KEY}/json.txt`,
  reportUrl: 'https://centrala.ag3nts.org/report',
  inputFile: './files/S01E03json.txt',
  outputFile: './files/S01E03jsonOutcome.txt'
}

const systemMessage = `You are a robot that answers the provided question 
<rules>
- Respond concisely
- return only the answer
- Answer always! in english language
</rules>`

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading file:', error)
    return null
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    console.log(`Data successfully saved to ${filePath}`)
  } catch (error) {
    console.error('Error saving file:', error)
  }
}

async function getOpenAIResponse(question) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: question }
    ]
  })
  return completion.choices[0].message.content
}

async function processTestData(data) {
  return data['test-data'].map(async (item) => {
    if (!item.test) {
      return {
        question: item.question,
        answer: new Function(`return ${item.question}`)()
      }
    }

    const aiResponse = await getOpenAIResponse(item.test.q)
    return {
      question: item.question,
      answer: new Function(`return ${item.answer}`)(),
      test: { q: item.test.q, a: aiResponse }
    }
  })
}

async function prepareAnswerData(fileData, processedData) {
  return {
    ...fileData,
    apikey: process.env.AIDEVS_API_KEY,
    'test-data': await Promise.all(processedData)
  }
}

async function main() {
  try {
    // Read input data
    const fileData = await readJsonFile(CONFIG.inputFile)
    if (!fileData) return

    // Process the data
    const processedData = await processTestData(fileData)
    const answer = await prepareAnswerData(fileData, processedData)
    
    // Save processed data
    await writeJsonFile(CONFIG.outputFile, await Promise.all(processedData))

    // Send answer
    const response = await axios.post(CONFIG.reportUrl, {
      task: 'JSON',
      apikey: process.env.AIDEVS_API_KEY,
      answer
    })

    console.log('API Response:', response.data)
  } catch (error) {
    console.error('Error in main process:', error)
  }
}

main()
