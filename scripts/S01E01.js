import { openai } from '../utils/openai.js'
import axios from 'axios'

const url = 'https://xyz.ag3nts.org/'

const systemMessage = `You are HTML parser, return only Question from HTML`
const systemMessage2 = `Answer the question but only with number`

// Extract question from HTML using OpenAI
async function extractQuestion(htmlContent) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: htmlContent },
    ],
  })
  return completion.choices[0].message.content
}

// Get answer using OpenAI
async function getAnswer(question) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage2 },
      { role: 'user', content: question },
    ],
  })
  return completion.choices[0].message.content
}

// Submit answer to API
async function submitAnswer(answer) {
  //   const data = {
  //     username: 'tester',
  //     password: '574e112a',
  //     answer: answer,
  //   }

  const data = `username=tester&password=574e112a&answer=${answer}`

  return await axios.post(url, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

// Main function
async function makeRequest() {
  try {
    // Get initial HTML
    const htmlResponse = await axios.get(url)

    // Process the response
    const question = await extractQuestion(htmlResponse.data)
    const answer = await getAnswer(question)

    const result = await submitAnswer(answer)

    console.log('Success:', result.data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Run the program
makeRequest()
