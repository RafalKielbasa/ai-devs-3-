import axios from 'axios'
import url from 'url'
import path from 'path'
import fs from 'fs'
import { openai } from '../utils/openai.js'
import dotenv from 'dotenv'

dotenv.config()

const SYSTEM_PROMPT = `
You receive a text containing key information and a set of questions provided in an object (key-value pairs). Your task is to:
<example>
question:
{'ID-pytania-01': "What is the color of the sky?"}
answer:
{'ID-pytania-01': "blue"}
</example>
<rules>
- Thoroughly analyze the entire text, capturing both explicit and implicit information.
- Provide short but precise answers to each question, relying solely on the provided text.
- Maintain full context to avoid misinterpretation.
- Return answers in Polish.
- The output must be an object where the keys match the original questions, without additional comments or explanations.
</rules>

`

const articleLink = 'https://centrala.ag3nts.org/dane/arxiv-draft.html'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const article = await axios.get(articleLink)

const regex = /<img\b[^>]*\bsrc\s*=\s*['"]([^'"]+)['"][^>]*>/gi
const matches = [...article.data.matchAll(regex)]
const srcAttributes = matches.map((match) => match[1])

const pngTranscriptsDirectory = path.join(
  __dirname,
  '../files/S02E05Transcripts/imageTranscripts'
)
const mp3TranscriptsDirectory = path.join(
  __dirname,
  '../files/S02E05Transcripts/audioTranscripts'
)
const lessonDirectory = path.join(__dirname, '../files/S02E05Transcripts')

const questions = await axios.get(
  `https://centrala.ag3nts.org/data/${process.env.AIDEVS_API_KEY}/arxiv.txt`
)

const questionsObject = questions.data
  .split('\n')
  .map((line) => {
    const [key, question] = line.split('=')
    return { key, question }
  })
  .filter(({ question }) => question)
  .reduce((acc, { key, question }) => {
    acc[key] = question
    return acc
  }, {})

const main = async () => {
  const unifiedText = fs.readFileSync(
    path.join(lessonDirectory, 'arxiv-data.txt'),
    'utf-8'
  )

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: unifiedText },
          { type: 'text', text: JSON.stringify(questionsObject) },
        ],
      },
    ],
  })

  const answers = response.choices[0].message.content

  //   console.log(answers)

  const outcome = await axios.post(process.env.REPORT_URL, {
    task: 'arxiv',
    apikey: process.env.AIDEVS_API_KEY,
    answer: JSON.parse(answers),
  })

  console.log(outcome.data)
}

main()

const createAudioTranscription = async () => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(
        path.join(__dirname, '../files/rafal_dyktafon.mp3')
      ),
      model: 'whisper-1',
    })

    console.log(transcription.text)

    fs.writeFileSync(
      path.join(mp3TranscriptsDirectory, 'rafal_dyktafon.txt'),
      transcription.text
    )
  } catch (error) {
    console.error(`Error transcribing:`, error)
  }
}

// createAudioTranscription()

const createImageTranscription = async () => {
  srcAttributes.forEach(async (srcAttribute) => {
    try {
      const fileName = path.basename(srcAttribute)

      console.log(fileName)

      const imageResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'What is in this image?' },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: articleLink.replace('arxiv-draft.html', srcAttribute),
                },
              },
            ],
          },
        ],
      })

      fs.writeFileSync(
        path.join(pngTranscriptsDirectory, fileName.replace('.png', '.txt')),
        imageResponse.choices[0].message.content
      )
    } catch (error) {
      console.error(`Error transcribing ${imageLink}:`, error)
    }
  })
}

// createImageTranscription()

const replaceImgTags = () => {
  const htmlData = article.data.replace(/<img\b([^>]*?)>/gi, (match, group) => {
    // Wyłuskujemy atrybut alt
    const altMatch = group.match(/alt\s*=\s*["']([^"']+)["']/i)
    let fileBaseName = null

    if (altMatch) {
      fileBaseName = altMatch[1]
    } else {
      // Jeśli atrybut alt nie istnieje, pobieramy nazwę z atrybutu src
      const srcMatch = group.match(/src\s*=\s*["']([^"']+)["']/i)
      if (srcMatch) {
        // Pobieramy nazwę pliku bez rozszerzenia
        fileBaseName = path.basename(srcMatch[1], path.extname(srcMatch[1]))
      }
    }

    if (fileBaseName) {
      const filePath = path.join(pngTranscriptsDirectory, `${fileBaseName}.txt`)
      try {
        if (fs.existsSync(filePath)) {
          // Zwracamy zawartość pliku zamiast tagu <img>
          return fs.readFileSync(filePath, 'utf-8')
        }
      } catch (error) {
        console.error(`Błąd przy odczycie pliku ${filePath}:`, error)
      }
    }
    // W przypadku braku alt i src lub pliku – zwracamy oryginalny tag
    return match
  })

  fs.writeFileSync(path.join(lessonDirectory, 'arxiv-data.txt'), htmlData)
}

// replaceImgTags()
