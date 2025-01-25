import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const url = 'https://poligon.aidevs.pl/dane.txt'
const url2 = 'https://poligon.aidevs.pl/verify'

axios
  .get(url)
  .then((response) => {
    const stringArray = convertToArray(response.data).filter(
      (item) => item.length > 2
    )
    sendPostRequest('POLIGON', process.env.AIDEVS_API_KEY, stringArray)
  })
  .catch((error) => {
    console.error('Error fetching data:', error)
  })

function convertToArray(input) {
  return input.split('\n')
}

function sendPostRequest(task, apikey, answer) {
  const data = {
    task,
    apikey,
    answer,
  }
  axios
    .post(url2, data)
    .then((response) => {
      console.log('Post request successful:', response.data)
    })
    .catch((error) => {
      console.error('Error sending post request:', error)
    })
}

