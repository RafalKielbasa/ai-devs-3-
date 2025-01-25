import { openai } from '../utils/openai.js'
import fs from 'fs'

const imagesNames = ['mapa1', 'mapa2', 'mapa3', 'mapa4']
const systemMessage = `
You are an OSINT specialist. You will be provided with fragments of a map representing a city in Poland. Your task is to answer which city is shown on the map.
It is a city where granaries and fortresses are located.
<rules>
Respond in Polish
Analyze the provided images carefully
Return only the name of the city
Do not respond with "I don't know"; you must determine the answer based on the provided fragments.
</rules>
<exampe>
output: Warszawa
</example>
`

function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath)
  return imageBuffer.toString('base64')
}

const images = imagesNames.map((name) => {
  const base64Image = encodeImageToBase64(`./files/${name}.png`)
  return `data:image/jpeg;base64,${base64Image}`
})

// const response = await openai.chat.completions.create({
//   model: 'gpt-4o',
//   messages: [
//     { role: 'system', content: systemMessage },
//     {
//       role: 'user',
//       content: [
//         {
//           type: 'image_url',
//           image_url: {
//             url: images[0],
//           },
//         },
//         {
//           type: 'image_url',
//           image_url: {
//             url: images[1],
//           },
//         },
//         {
//           type: 'image_url',
//           image_url: {
//             url: images[2],
//           },
//         },
//         {
//           type: 'image_url',
//           image_url: {
//             url: images[3],
//           },
//         },
//       ],
//     },
//   ],
//   store: true,
// })

// console.log(response.choices[0].message.content)

const output = images.map(async (image, index) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMessage },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: image,
            },
          },
        ],
      },
    ],
    store: true,
  })

  return response.choices[0].message.content
})
//'Grudziądz'
console.log(await Promise.all(output))
