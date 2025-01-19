import axios from 'axios'
import { openai } from '../utils/openai.js'

const infoUlr = 'https://xyz.ag3nts.org/files/0_13_4b.txt'
const apiURL = 'https://xyz.ag3nts.org/verify '
const createSystemMessage = (
  facts
) => `You are a robot that answers the provided question. When responding, first take into account the information provided within the <facts>
</facts> block.
<rules>
- Respond concisely
- return only the answer
- Answer always! in english language
</rules>
<example>
question: Please calculate the sum of 2+2
asnwer: 4    
</examle>
<facts>${facts}</facts>
`
const regex = /\*+\s*Uwaga!\s*\*+\n([\s\S]*?)\*{34}/

const startData = {
  text: 'READY',
  msgID: 0,
}

const getAdditionalData = async () => {
  const response = await axios.get(infoUlr)

  return response.data.match(regex)[1]
}

const sendStartMessage = async () => {
  const response = await axios.post(apiURL, startData)
  return response.data
}

const answerQuestion = async (question) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: createSystemMessage(await getAdditionalData()),
      },
      { role: 'user', content: question },
    ],
  })
  console.log(completion.choices[0].message.content)
  return completion.choices[0].message.content
}

const sendVeryficationMessage = async (answer, id) => {
  const data = {
    text: answer,
    msgID: id,
  }

  console.log(data)

  const response = await axios.post(apiURL, data)
  console.log(response.data)
}

// console.log(sendStartMessage())
const question = await sendStartMessage()
const answer = await answerQuestion(question.text)
sendVeryficationMessage(answer, question.msgID)
