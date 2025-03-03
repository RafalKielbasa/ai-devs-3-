import express from 'express'
import { createCompletion } from '../utils/openai.js'

const router = express.Router()

const systemPrompt = `
You are the navigator. Your task is to determine the terrain located under the drone based on the provided route. 
For this purpose, you will receive a map in the form of a board, arranged in a 4x4 grid. The flight always starts from the first tile in the first row.
The map presents a description of the rows from left to right.
<map>
{
  "board": [
    [
      {
        "row": 1,
        "col": 1,
        "type": "location_marker",
        "description": "start"
      },
      {
        "row": 1,
        "col": 2,
        "type": "grass"
      },
      {
        "row": 1,
        "col": 3,
        "type": "tree"
      },
      {
        "row": 1,
        "col": 4,
        "type": "house"
      }
    ],
    [
      {
        "row": 2,
        "col": 1,
        "type": "grass"
      },
      {
        "row": 2,
        "col": 2,
        "type": "windmill"
      },
      {
        "row": 2,
        "col": 3,
        "type": "grass"
      },
      {
        "row": 2,
        "col": 4,
        "type": "grass"
      }
    ],
    [
      {
        "row": 3,
        "col": 1,
        "type": "grass"
      },
      {
        "row": 3,
        "col": 2,
        "type": "grass"
      },
      {
        "row": 3,
        "col": 3,
        "type": "stone"
      },
      {
        "row": 3,
        "col": 4,
        "type": "trees
      }
    ],
    [
      {
        "row": 4,
        "col": 1,
        "type": "rock_formations"
      },
      {
        "row": 4,
        "col": 2,
        "type": "rock_formations"
      },
      {
        "row": 4,
        "col": 3,
        "type": "car"
      },
      {
        "row": 4,
        "col": 4,
        "type": "cave"
      }
    ]
  ]
}

</map>
<exapmles>
1:
User: poleciałem jedno pole w prawo, a później na sam dół
Assisntant: skały

2:
User: poleciałem dwa pola w prawo, a później trzy w dół
Assisntant: samochód

3: 
User: poleciałem dwa pola w prawo, a później dwa w dół 
Assisntant: kamień
4: 
User: poleciałem jedno pola w prawo, a później jedno w dół 
Assisntant: wiatrak

</examples>

<rules>
- Flying two squares to the right and two down means we are on tile number 3 in row 3.
- The answer should be maximum to words np: samochów.
- Respond in Polish.
-Focus and think carefully.
</rules>
`
router.post('/', async (req, res) => {
  try {
    console.log('Navigator', req.body)

    const instruction = req.body.instruction

    if (!instruction) {
      return res.status(400).json({ error: 'Instruction is required' })
    }

    const response = await createCompletion(systemPrompt, instruction, 'gpt-4o')

    res.status(200).json({ description: response })
  } catch (error) {
    console.error('Error in navigator endpoint:', error)
    res
      .status(500)
      .json({ error: 'Server error occurred', message: error.message })
  }
})

export default router
