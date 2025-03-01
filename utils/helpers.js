import fs from 'fs'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const dbUrl = 'https://centrala.ag3nts.org/apidb'

export function readAllFiles(folderPath) {
  return fs.readdirSync(folderPath)
}

export async function readTextFile(filePath) {
  return await fs.promises.readFile(filePath, 'utf8')
}

export async function sendAnswer({ taskName, answer }) {
  const outcome = await axios.post(process.env.REPORT_URL, {
    task: taskName,
    apikey: process.env.AIDEVS_API_KEY,
    answer: answer,
  })
  console.log(outcome.data)

  return outcome.data
}

const createDbQuery = (query) => ({
  task: 'database',
  query: query,
  apikey: process.env.AIDEVS_API_KEY,
})

export const sendDbQuery = async (query) => {
  try {
    const response = await axios.get(dbUrl, { data: createDbQuery(query) })
    return response.data
  } catch (error) {
    console.error('Error sending query to database:', error)
  }
}
