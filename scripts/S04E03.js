import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import url from 'url'
import path from 'path'
import { scrapeWebsite } from '../utils/firecrawl.js'
import { createCompletion } from '../utils/openai.js'
import { sendAnswer } from '../utils/helpers.js'

dotenv.config()

const createCheckWebsitePrompt = (pageContent, question) => `
You are a web scraper. Your task is to thoroughly analyze the provided HTML code. You will receive the code for the page and question.
If you don't know the answer, please provide the link to the subpage where the answer might be found.
<example>
Question***
{
"01": "Jakie projekty zrealizowała firma Softo?",
}
Answer***
{
"prefix": "01",
"answerReady": false,
"answer": "https://softo.ag3nts.org/portfolio"

}
</example>
<rules>
- return the correct JSON without any additional blocks
- if you know the answer, provide it in json format if not, return the link to the subpage 
- respond in Polish
</rules>
<page code>${pageContent}<page code>
<question>${question}<questions>
`

// {
//     "01": "https://softo.ag3nts.org/uslugi",
//     "02": "https://softo.ag3nts.org/portfolio",
//     "03": "https://softo.ag3nts.org/kontakt"
//   }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mainPagePath = path.join(__dirname, '../files/S04E03/mainPage.md')
const aswersPath = path.join(__dirname, '../files/S04E03/answers.json')

const mainPageData = await fs.promises.readFile(mainPagePath, 'utf8')

async function updateJsonFile(filePath, newData) {
  try {
    // 1. Odczytaj aktualną zawartość pliku
    const fileContent = await fs.promises.readFile(filePath, 'utf8')

    // 2. Sparsuj JSON do obiektu JavaScript
    const jsonData = fileContent === '' ? [] : JSON.parse(fileContent)

    // 3. Zmodyfikuj dane używając przekazanej funkcji

    jsonData.push(newData)

    // 4. Konwertuj z powrotem do stringa JSON z wcięciami dla czytelności
    const updatedJsonString = JSON.stringify(jsonData)

    // 5. Zapisz zaktualizowane dane do pliku
    await fs.promises.writeFile(filePath, updatedJsonString)
  } catch (error) {
    console.error('Błąd podczas aktualizacji pliku JSON:', error)
    throw error
  }
}

const questionsUrl = `https://centrala.ag3nts.org/data/${process.env.AIDEVS_API_KEY}/softo.json`
const softoAiUrl = 'https://softo.ag3nts.org'

const getQuestions = async () => {
  const response = await axios.get(questionsUrl)
  return response.data
}

console.log('Questions:', await getQuestions())

// await getQuestions().then(async (questions) => {
//   for (const [key, value] of Object.entries(questions)) {
//     // const response = await createCompletion(
//     //   createCheckWebsitePrompt(mainPageData, `${key}: ${value}`)
//     // )
//     // const responseObject = JSON.parse(response)

//     const responseObject = {
//       prefix: '02',
//       answerReady: true,
//       answer: 'https://softo.ag3nts.org/portfolio',
//     }

//     if (responseObject.answerReady) {
//       console.log('Answer:', responseObject.answer)
//       await updateJsonFile(aswersPath, responseObject)
//     }

//     if (!responseObject.answerReady) {
//       console.log('Answer not ready')
//       await updateJsonFile(aswersPath, responseObject)
//     }
//   }
// })

// const softoAiBasePage = await scrapeWebsite(softoAiUrl)

// const response = await createCompletion(
//   createCheckWebsitePrompt(mainPageData, questions)
// )

const data = {
  taskName: 'softo',
  answer: {
    '01': 'kontakt@softoai.whatever',
    '02': 'https://banan.ag3nts.org/',
    '03': 'ISO 9001 oraz ISO/IEC 27001',
  },
}

await sendAnswer(data)
