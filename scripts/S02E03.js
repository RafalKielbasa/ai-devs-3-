import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs/promises'
import { openai } from '../utils/openai.js'

dotenv.config()

const CONFIG = {
  centralUrl: `https://centrala.ag3nts.org/data/${process.env.AIDEVS_API_KEY}/robotid.json`,
  reportUrl: 'https://centrala.ag3nts.org/report',
}

const systemMessage = `
You are a prompt engineer. Process the provided text to make it as focused as possible on the character description. The description should be used to generate an image with DALL-E.
`

const testify = await axios.get(CONFIG.centralUrl)

const betterDescription = await openai.chat.completions
  .create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: testify.data.description },
    ],
  })
  .then((response) => response.choices[0].message.content)

console.log(betterDescription)

const answer = await openai.images
  .generate({
    model: 'dall-e-3',
    prompt: betterDescription,
    n: 1,
    size: '1024x1024',
  })
  .then((response) => response.data[0].url)

const response = await axios.post(CONFIG.reportUrl, {
  task: 'robotid',
  apikey: process.env.AIDEVS_API_KEY,
  answer,
})

console.log(response.data)
