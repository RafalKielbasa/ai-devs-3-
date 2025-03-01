import axios from 'axios'
import dotenv from 'dotenv'

import { createCompletion } from '../utils/openai.js'
import { sendAnswer } from '../utils/helpers.js'

dotenv.config()

const dbUrl = 'https://centrala.ag3nts.org/apidb'

const createFindUsersPrompt = (
  schema
) => `Based on the provided database schema, create a query that returns only users where (is_active = 0).
<schema>
${schema}
</schema>
<rules>
- The query should return only users where is_active is set to 0.
- The query should return only the id 
- Return only queries that are valid SQL
- Retutn only the query without '''sql''' or any other code blocks
</rules>
<example>
SELECT id
FROM users
WHERE is_active = 0;
</example>
`

const createFindDatacentersPrompt = (schema, idArray) => `
Based on the provided schema, create an SQL query that accepts an array of user 
IDs and returns only the records where the value of the "manager" field is in the provided user IDs.
<rules>
- The query should return only datacenters where here the manager is in the provided array of IDs and is_active is set to 1.
- The query should return only the dc_id 
- Return only queries that are valid SQL
- Retutn only the query without '''sql''' or any other code blocks
</rules>
<idArray>
${idArray}
</idArray>
<schema>
${schema}
</schema>


`

const createDbQuery = (query) => ({
  task: 'database',
  query: query,
  apikey: process.env.AIDEVS_API_KEY,
})

const sendDbQuery = async (query) => {
  try {
    const response = await axios.get(dbUrl, { data: createDbQuery(query) })
    return response.data
  } catch (error) {
    console.error('Error sending query to database:', error)
  }
}

const main = async () => {
  try {
    const allTables = await sendDbQuery('show tables')

    if (!allTables || !allTables.reply || !Array.isArray(allTables.reply)) {
      throw new Error('Failed to get tables or invalid response format')
    }

    const createSchemaQuery = (index) =>
      `show create table ${allTables.reply[index]['Tables_in_banan']}`

    const usersTableShema = await sendDbQuery(createSchemaQuery(3))

    const datacentersTableShema = await sendDbQuery(createSchemaQuery(2))

    console.log('Database query process completed')

    const usersIdQuery = await createCompletion(
      createFindUsersPrompt(usersTableShema)
    )

    console.log('UserID prompt process completed')

    const userIdsObject = await sendDbQuery(usersIdQuery)
    const usersId = userIdsObject.reply.map(({ id }) => id)

    const datacentersIdQuery = await createCompletion(
      createFindDatacentersPrompt(datacentersTableShema, usersId)
    )

    console.log('Datacenter prompt process completed')

    const datacentersIdsObject = await sendDbQuery(datacentersIdQuery)
    const datacentersIds = datacentersIdsObject.reply.map(({ dc_id }) => dc_id)

    const data = {
      taskName: 'database',
      answer: datacentersIds,
    }

    sendAnswer(data)
  } catch (error) {
    console.error('Error in main function:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

main().catch((err) => {
  console.error('Unhandled error in main process:', err)
  process.exit(1)
})
