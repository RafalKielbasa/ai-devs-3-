import { openai } from '../utils/openai.js'

import axios from 'axios'

const systemMessage = `
Censor the provided content so that the first and last name, age, city, and street with house number are replaced with the word CENZURA.
<rules>
- answer in polish language
- the response format must be identical! to the message format
</rules>
<exapmle>
Input: Tożsamość podejrzanego: Michał Wiśniewski. Mieszka we Wrocławiu na ul. Słonecznej 20. Wiek: 30 lat.
Output: Tożsamość podejrzanego: CENZURA. Mieszka we CENZURA na ul. CENZURA. Wiek: CENZURA lat.
</example>

`

const baseUrl = `https://centrala.ag3nts.org`

const CONFIG = {
  cetralUrlData: `${baseUrl}/data/${process.env.AIDEVS_API_KEY}/cenzura.txt`,
  reportUrl: `${baseUrl}/report`,
}

async function getOpenAIResponse(question) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: question },
    ],
  })
  return completion.choices[0].message.content
}

const main = async () => {
  const centralData = await axios.get(CONFIG.cetralUrlData)
  const aiResponse = await getOpenAIResponse(centralData.data)
  console.log(aiResponse)

  const response = await axios.post(CONFIG.reportUrl, {
    task: 'CENZURA',
    apikey: process.env.AIDEVS_API_KEY,
    answer: aiResponse,
  })
  console.log(response.data)
}

main()
