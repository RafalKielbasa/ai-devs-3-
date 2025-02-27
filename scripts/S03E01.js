import fs from 'fs'
import path from 'path'
import url from 'url'
import { openai } from '../utils/openai.js'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const factsPath = path.join(__dirname, '../files/raports/facts')
const jsonReportsPath = path.join(__dirname, '../files/S03E01/raports.json')
const raportsPath = path.join(__dirname, '../files/raports')

// const createSystemPrompt = (source) => {
//   return `
// You have access to an entire document provided as a JSON array, where each element is an object with properties "text" and "source". Additional information is included within the same document, with its source formatted as "source": "facts/<file-name>", and there are also references from other reports.

// A specific fragment of the document to be analyzed is identified by its source: raports/${source}. However, your analysis must not be limited solely to this fragment. You must integrate and consider the entire document, paying particular attention to elements whose source is formatted as "facts/<file-name>" and references from other reports.

// Your task is to generate a list of keywords in Polish that describe the given fragment within the context of the entire document and all the additional information. The keywords must be in the nominative case (e.g., “sportowiec” instead of “sportowcem”, “sportowców”, etc.).

// Important:

// - Analyze the fragment in the context of the entire document, especially focusing on elements with a source formatted as "facts/<file-name>" and references from other reports.
// - Consider all parts of the document and the relevant additional information.
// - Return only a list of keywords.
// - The response should be a plain text, not a JSON array. For example: "słowo1, słowo2, ...".
// - Include information about what the people described in the given passage did, e.g., teacher, developer.
// `
// }

const createCategorizationPrompt = (
  documentA,
  documentB
) => `You are provided with two documents: Document A and Document B.
Your task is to analyze the content of both documents and determine if there is any connection between them. A connection is defined as shared themes, topics, keywords, or references.
If you find any connection, simply return "true". Otherwise, return "false".

<Document A>
${documentA}
</Document A>
<Document B>
${documentB}
</Document B>

`

const createSystemPrompt = (document, chunk) => {
  return `
<document>
${document}
</document>

Here is the chunk we want to situate within the whole document

<chunk>
${chunk}
</chunk>

 Your task is to generate a list of keywords in Polish that describe the given fragment within the context of the entire document and all the additional information. The keywords must be in the nominative case (e.g., “sportowiec” instead of “sportowcem”, “sportowców”, etc.).
<important>
- Consider all parts of the document and the relevant additional information.
- Return only a list of keywords.
- The response should be a plain text, not a JSON array. For example: "słowo1, słowo2, ..."
- Include information about what the people described in the given passage did, e.g., teacher, developer. Be precise for example JavaScript programmer
- Pay special attention to places and the roles of people.
- Add localization information
- Tell where Barbara Zawadzka's fingerprints were found"
</important>
`
}

 function readAllFiles(folderPath) {
  return fs.readdirSync(folderPath)
}

const facts = readAllFiles(factsPath)
const raports = readAllFiles(raportsPath).filter((file) =>
  file.endsWith('.txt')
)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const document = fs.readFileSync(jsonReportsPath, 'utf8')

const parsedDocument = document ? JSON.parse(document) : document

const main = async () => {
  const data = {}

  const requests = parsedDocument.map(async (item, i) => {
    const source = item?.source
    const text = item?.text
    const contextData = item?.contextData

    await delay(10000 * i)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: createSystemPrompt(`${source} ${text} ${contextData}`, text),
        },
      ],
    })
    data[source] = response.choices[0].message.content
    console.log(data)
  })
  Promise.all(requests).then(async () => {
    console.log(data)
    const outcome = await axios.post(process.env.REPORT_URL, {
      task: 'dokumenty',
      apikey: process.env.AIDEVS_API_KEY,
      answer: data,
    })
    console.log(outcome.data)
  })
}

main()

const saveAllDataToJSON = (files, directory, folder) => {
  files.forEach(async (file) => {
    try {
      const data = await fs.promises.readFile(
        path.join(directory, file),
        'utf8'
      )

      const newData = {
        text: data,
        source: `${folder}/${file}`,
      }

      let jsonArray = []
      if (fs.existsSync(jsonReportsPath)) {
        const fileContent = fs.readFileSync(jsonReportsPath, 'utf8')

        if (fileContent !== '') {
          jsonArray = JSON.parse(fileContent)
        }
      }

      jsonArray.push(newData)

      fs.writeFileSync(jsonReportsPath, JSON.stringify(jsonArray, null, 2))
    } catch (error) {
      console.log(error)
    }
  })
}

// saveAllDataToJSON(facts, factsPath, 'facts')
// saveAllDataToJSON(raports, raportsPath, 'raports')

// const createJsonWithMetadata = async () => {
//   ;[raports[4]].forEach(async (fileName) => {
//     const dataObject = {
//       source: fileName,
//     }
//     const raportData = await fs.promises.readFile(
//       path.join(raportsPath, fileName),
//       'utf8'
//     )
//     dataObject.text = raportData

//     const allInformationPaths = [
//       ...facts.map((file) => path.join(factsPath, file)),
//       ...raports
//         .filter((file) => file !== fileName)
//         .map((file) => path.join(raportsPath, file)),
//     ]

//     allInformationPaths.forEach(async (filePath, i) => {
//       const contextData = await fs.promises.readFile(filePath, 'utf8')
//       await delay(10000 * i)
//       const response = await openai.chat.completions.create({
//         model: 'gpt-4o',
//         messages: [
//           {
//             role: 'system',
//             content: createCategorizationPrompt(raportData, contextData),
//           },
//         ],
//       })

//       const answer = response.choices[0].message.content

//       if (answer === 'true') {
//         if (!dataObject.contextData) {
//           dataObject.contextData = contextData
//         }
//         if (dataObject.contextData) {
//           dataObject.contextData = `${dataObject.contextData} \n${contextData}`
//         }
//       }
//       let jsonArray = []
//       if (fs.existsSync(jsonReportsPath)) {
//         const fileContent = fs.readFileSync(jsonReportsPath, 'utf8')

//         if (fileContent !== '') {
//           jsonArray = JSON.parse(fileContent).filter(
//             (item) => item.source !== fileName
//           )
//         }
//       }

//       jsonArray.push(dataObject)

//       fs.promises.writeFile(jsonReportsPath, JSON.stringify(jsonArray, null, 2))
//     })
//   })
// }

const createJsonWithMetadata = async () => {
  // Używamy for...of aby poprawnie obsłużyć asynchroniczność
  for (const fileName of raports) {
    const dataObject = { source: fileName }
    const raportData = await fs.promises.readFile(
      path.join(raportsPath, fileName),
      'utf8'
    )
    dataObject.text = raportData

    const allInformationPaths = [
      ...facts.map((file) => path.join(factsPath, file)),
      ...raports
        .filter((file) => file !== fileName)
        .map((file) => path.join(raportsPath, file)),
    ]

    // Zbieramy wszystkie operacje asynchroniczne w tablicę
    await Promise.all(
      allInformationPaths.map(async (filePath, i) => {
        const contextData = await fs.promises.readFile(filePath, 'utf8')
        await delay(10000 * i)
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: createCategorizationPrompt(raportData, contextData),
            },
          ],
        })

        const answer = response.choices[0].message.content

        if (answer === 'true') {
          // Łączymy dane kontekstowe
          dataObject.contextData = dataObject.contextData
            ? `${dataObject.contextData}\n${contextData}`
            : contextData
        }
      })
    )

    // Aktualizacja pliku po zakończeniu wszystkich operacji
    let jsonArray = []
    if (fs.existsSync(jsonReportsPath)) {
      const fileContent = fs.readFileSync(jsonReportsPath, 'utf8')
      if (fileContent !== '') {
        jsonArray = JSON.parse(fileContent).filter(
          (item) => item.source !== fileName
        )
      }
    }

    jsonArray.push(dataObject)
    await fs.promises.writeFile(
      jsonReportsPath,
      JSON.stringify(jsonArray, null, 2)
    )
  }
}

// createJsonWithMetadata()
