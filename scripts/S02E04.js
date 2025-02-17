import fs from 'fs'
import path from 'path'
import url from 'url'
import { openai } from '../utils/openai.js'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const SYSTEM_PROMPT = `
Extract only the notes that contain specific information about captured people or traces of their presence, 
and about repaired hardware faults (ignore any notes related to software). 

Return a valid JSON object with two keys: "people" and "hardware". For each key, assign true if the text includes specific information related to that category; otherwise, assign false.

Rules:
Output must be a valid JSON object.
Do not include any markdown formatting (e.g., triple backticks).
Extract only the notes that contain specific information about captured people or traces of their presence, 
and about repaired hardware faults (ignore any notes related to software). 
`
const SYSTEM_PROMPT_IMAGE = `
Read what is on this image.
**Rules**
- Return only the main text you see on the image.
- Be very precise.
`

const folderPath = './files/raports'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mp3TranscriptsDirectory = path.join(__dirname, '../files/mp3Transcripts')
const pngTranscriptsDirectory = path.join(__dirname, '../files/pngTranscripts')

function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath)
  return imageBuffer.toString('base64')
}

const saveImageTranscriptionToFile = async (file) => {
  try {
    const base64Image = encodeImageToBase64(file)
    const image = `data:image/jpeg;base64,${base64Image}`

    const imageResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_IMAGE },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
    })

    const text = imageResponse.choices[0].message.content

    const txtFileName = path.basename(file).replace('.png', '.txt')

    fs.writeFileSync(path.join(pngTranscriptsDirectory, txtFileName), text)
  } catch (error) {
    console.error(`Error transcribing ${file}:`, error)
  }
}

const saveTranscriptionToFile = async (file) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file),
      model: 'whisper-1',
    })

    const txtFileName = path.basename(file).replace('.mp3', '.txt')

    fs.writeFileSync(
      path.join(mp3TranscriptsDirectory, txtFileName),
      transcription.text
    )
  } catch (error) {
    console.error(`Error transcribing ${file}:`, error)
  }
}

async function getReportFiles() {
  try {
    const files = await fs.promises.readdir(folderPath)

    // Create sorted file collections
    const sortedFiles = {
      mp3: [],
      text: [],
      png: [],
    }

    // Sort files by extension
    files.forEach((file) => {
      const filePath = path.join(folderPath, file)
      if (!fs.statSync(filePath).isFile()) return

      const extension = path.extname(file).toLowerCase()
      switch (extension) {
        case '.mp3':
          sortedFiles.mp3.push(filePath)
          break
        case '.txt':
          sortedFiles.text.push(filePath)
          break
        case '.png':
          sortedFiles.png.push(filePath)
          break
      }
    })

    return sortedFiles
  } catch (error) {
    console.error('Error reading directory:', error)
    return { mp3: [], text: [], png: [] }
  }
}

// Usage
const sortedFiles = await getReportFiles()
// console.log('MP3 files:', sortedFiles.mp3)
// console.log('Text files:', sortedFiles.text)
// console.log('PNG files:', sortedFiles.png)

const people = []
const hardware = []

const mp3Promises = sortedFiles.mp3.map(async (file) => {
  // await saveTranscriptionToFile(file)

  try {
    const txtFileName = path.basename(file).replace('.mp3', '.txt')
    const transcription = await fs.promises.readFile(
      path.join(mp3TranscriptsDirectory, txtFileName),
      'utf-8'
    )
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcription },
      ],
    })
    const parsedResponse = JSON.parse(response.choices[0].message.content)
    // console.log('mp3', { transcription, parsedResponse })
    if (parsedResponse.people) {
      people.push(path.basename(file))
    }
    if (parsedResponse.hardware) {
      hardware.push(path.basename(file))
    }
  } catch (error) {
    console.error(`Error transcribing ${file}:`, error)
  }
})

const textPromises = sortedFiles.text.map(async (file) => {
  try {
    const text = await fs.promises.readFile(file, 'utf-8')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    })
    const parsedResponse = JSON.parse(response.choices[0].message.content)
    // console.log('text', { text, parsedResponse })
    if (parsedResponse.people) {
      people.push(path.basename(file))
    }
    if (parsedResponse.hardware) {
      hardware.push(path.basename(file))
    }
  } catch (error) {}
})

const pngPromises = sortedFiles.png.map(async (file) => {
  // saveImageTranscriptionToFile(file)
  try {
    const txtFileName = path.basename(file).replace('.png', '.txt')
    const pngTranscript = await fs.promises.readFile(
      path.join(pngTranscriptsDirectory, txtFileName),
      'utf-8'
    )
    const textResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: pngTranscript },
      ],
    })
    const parsedResponse = JSON.parse(textResponse.choices[0].message.content)
    // console.log('png', { pngTranscript, parsedResponse })
    if (parsedResponse.people) {
      people.push(path.basename(file))
    }
    if (parsedResponse.hardware) {
      hardware.push(path.basename(file))
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error)
  }
})

await Promise.all([...mp3Promises, ...textPromises, ...pngPromises]).then(
  async () => {
    const sortedPeople = people.sort()
    const sortedHardware = hardware.sort()
    console.log({ people, hardware })
    const response = await axios.post(process.env.REPORT_URL, {
      task: 'kategorie',
      apikey: process.env.AIDEVS_API_KEY,
      answer: {
        people: sortedPeople,
        hardware: sortedHardware,
      },
    })
    console.log(response.data)
  }
)
