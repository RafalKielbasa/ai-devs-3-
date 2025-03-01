import { sendAnswer } from '../utils/helpers.js'
import path from 'path'

import { createCompletion } from '../utils/openai.js'

// REPAIR/DARKEN/BRIGHTEN

const systemPrompt = `
Describe women in the images below.
<hints>
- what is the color and length of their hair
- What is she wearing?
- what distinguishing features does he/she have
</hints>

<rules>
- be precise
- answer in Polish
</rules>
`

const photos = [
  {
    url: 'https://centrala.ag3nts.org/dane/barbara/IMG_559.PNG',
    action: 'REPAIR',
  },
  {
    url: 'https://centrala.ag3nts.org/dane/barbara/IMG_1410.PNG',
    action: 'BRIGHTEN',
  },
  {
    url: 'https://centrala.ag3nts.org/dane/barbara/IMG_559_FGR4.PNG',
    action: 'DARKEN',
  },
]

const repairedPthoto = [
  'https://centrala.ag3nts.org/dane/barbara/IMG_1410_FXER.PNG',
  'https://centrala.ag3nts.org/dane/barbara/IMG_1443_FT12.PNG',
  'https://centrala.ag3nts.org/dane/barbara/IMG_559_NRR7.PNG',
]

const taskName = 'photos'

const startData = {
  taskName,
  answer: 'START',
}

// for (const photo of photos) {
//   const parsedUrl = new URL(photo.url)
//   const filename = path.basename(parsedUrl.pathname)

//   sendAnswer({
//     taskName,
//     answer: `${photo.action} ${filename}`,
//   })
// }

const main = async () => {
  const content = [
    {
      type: 'text',
      text: systemPrompt,
    },
    ...repairedPthoto.map((url) => ({
      type: 'image_url',
      image_url: {
        url: url,
      },
    })),
  ]

  //   const response = await createCompletion('', content)

  //   console.log(response)

  sendAnswer({
    taskName,
    answer:
      'Jest to kobieta ma długie, ciemne włosy, nosi okulary i szarą bluzkę, na ramieniu ma tatuaż przedstawiający pająka',
  })
}

main()
