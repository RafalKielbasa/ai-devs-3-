import fs from 'fs'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

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
}
