import fs, { promises } from 'fs'
import axios from 'axios'

import { openai } from '../utils/openai.js'

const CONFIG = {
  reportUrl: 'https://centrala.ag3nts.org/report',
}

const transcriptionsArray = [
  './files/adam.m4a',
  './files/agnieszka.m4a',
  './files/ardian.m4a',
  './files/michal.m4a',
  './files/rafal.m4a',
  './files/monika.m4a',
]
const regex = /(?<=\.\/files\/)[a-zA-Z]+(?=\.m4a)/

const createSystemMessage = (transcription) => `
Based on the provided text in the <info></info> section, provide answers to the question. Be careful! The information comes from various sources, and not all of it is true. Verified information can be found in the <true></true> section.
<rules>
- Respond in Polish
- Remember that witness statements may be contradictory; some may be mistaken, while others might respond in rather peculiar ways
- Think carefully before answering
- Please provide the name of the street where the university (a specific institute!) where the professor teaches is located.
- Return only the street name.
- The name of the street is not provided in the given information. You must use your own knowledge to obtain the answer.
</rules>
<info>
${transcription}
</info>
<true>
- Andrzej Maj is a professor.
- Rafał is mentally unstable, but he is the only person we are certain had close contact with the professor.
- The name of the street is not provided in the given information. You must use your own knowledge to obtain the answer.
</true>
`

const writeTextFile = async (content) => {
  try {
    await promises.writeFile('./files/transcript.txt', content)
  } catch (err) {
    console.log(err)
  }
}

const appendTextFile = async (content) => {
  // Added 'content' parameter
  try {
    await promises.appendFile('./files/transcript.txt', content)
  } catch (err) {
    console.log(err)
  }
}

const readTranscription = async () => {
  try {
    return await promises.readFile('./files/transcript.txt', 'utf8')
  } catch (error) {
    console.error(`Error transcribing `, error)
  }
}

const getTranscription = async () => {
  // Removed 'file' parameter
  for (const [index, file] of transcriptionsArray.entries()) {
    // Replaced forEach with for...of
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(file),
        model: 'whisper-1',
        response_format: 'text',
      })

      if (index === 0) {
        await writeTextFile(`${file.match(regex)[0]}: ${transcription} \n`)
      } else {
        await appendTextFile(`${file.match(regex)[0]}: ${transcription} \n`)
      }
    } catch (error) {
      console.error(`Error transcribing ${file}:`, error)
    }
  }
}

//We need to call this function only once
// getTranscription()

async function getOpenAIResponse(systemMessage, question) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: question },
    ],
  })
  return completion.choices[0].message.content
}

const main = async () => {
  const transcription = await readTranscription()
  const systemMessage = createSystemMessage(transcription)

  const answer = await getOpenAIResponse(
    systemMessage,
    'Znajdź odpowiedź na pytanie, na jakiej ulicy znajduje się uczelnia, na której wykłada Andrzej Maj'
  )

  const response = await axios.post(CONFIG.reportUrl, {
    task: 'mp3',
    apikey: process.env.AIDEVS_API_KEY,
    answer,
  })

  console.log(response.data)
}

main()
