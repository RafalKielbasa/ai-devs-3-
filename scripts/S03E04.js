import axios from 'axios'
import dotenv from 'dotenv'

import { sendAnswer } from '../utils/helpers.js'

dotenv.config()

const config = {
  peopleDb: 'https://centrala.ag3nts.org/people ',
  placesDb: 'https://centrala.ag3nts.org/places ',
}

const peoppleArray = [
  'aleksander',
  'andrzej',
  'rafal',
  'adam',
  'azazel',
  'gabriel',
  'artur',
]

const createQuery = (query) => ({
  apikey: process.env.AIDEVS_API_KEY,
  query,
})

const sendQuery = async (db, query) => {
  try {
    const reposponse = await axios.post(db, createQuery(query))

    return reposponse.data
  } catch (error) {
    console.error('Error sending query to database:', error)
  }
}

const citiesArray = []

for (const person of peoppleArray) {
  const foundPeople = await sendQuery(config.peopleDb, person)

  const filteredArray = foundPeople.message.split(' ')

  citiesArray.push(filteredArray)
}

const uniqueCities = [...new Set(citiesArray.flat())]

for (const city of uniqueCities) {
  const foundCities = await sendQuery(config.placesDb, city.toUpperCase())

  console.log({ city, foundCities })
}

// console.log(uniqueCities)

// const data = {
//   taskName: 'loop',
//   answer: 'ELBLAG',
// }

// sendAnswer(data)
