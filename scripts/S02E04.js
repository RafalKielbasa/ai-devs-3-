import fs from 'fs'
import path from 'path'
import { openai } from '../utils/openai.js'

const SYSTEM_PROMPT = `
Does the given text contain information about people or hardware? Return a valid JSON object with two keys: **people** and **hardware**. If the text contains relevant information, assign **true** to the corresponding key; otherwise, assign **false**.  
**Example:**  
{
  "people": true,
  "hardware": false
}

`

const folderPath = './files/raports'

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
console.log('MP3 files:', sortedFiles.mp3)
console.log('Text files:', sortedFiles.text)
console.log('PNG files:', sortedFiles.png)

const people = []
const hardware = []

sortedFiles.mp3.forEach(async (file) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file),
      model: 'whisper-1',
    })

    console.log(transcription)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcription.text },
      ],
    })

    const parsedResponse = JSON.parse(response.choices[0].message.content)

    if (parsedResponse.people) {
      people.push(path.basename(file))
    }
    if (parsedResponse.hardware) {
      hardware.push(path.basename(file))
    }

    console.log({ people, hardware })
  } catch (error) {
    console.error(`Error transcribing ${file}:`, error)
  }
})
