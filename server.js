import axios from 'axios'
import dotenv from 'dotenv'
import express from 'express'

const PORT = process.env.PORT || 3000

const app = express()

app.get('/', (req, res) => {
  console.log('here I am')
  res.send('Hi')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
