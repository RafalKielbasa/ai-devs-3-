import axios from 'axios'
import dotenv from 'dotenv'
import express from 'express'
import navigator from './routes/navigator.js'

const PORT = process.env.PORT || 3000

const app = express()

//Body parser
app.use(express.json())
// app.use(express.urlencoded({ extended: false }))

app.use('/api/navigator', navigator)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
