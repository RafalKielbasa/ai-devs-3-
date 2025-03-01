import { sendDbQuery, sendAnswer } from '../utils/helpers.js'
import { executeQuery } from '../utils/neo4j.js'

const createPersonName = `
CREATE CONSTRAINT person_name IF NOT EXISTS
FOR (p:Person)
REQUIRE p.name IS UNIQUE;
`

const shortesRouteQuery = `
MATCH (r:Person {person_name: 'Rafał'}), (b:Person {person_name: 'Barbara'})
MATCH p = shortestPath((r)-[*]-(b))
RETURN [node IN nodes(p) | node.person_name] AS persons;
`

const connections = await sendDbQuery('select * from connections')
const users = await sendDbQuery('select * from users')

const usersArray = users.reply
const connectionsArray = connections.reply

const handleRecord = (record) => {
  console.log(record.get('p'))
}

// const records = await executeQuery(shortesRouteQuery)

// console.log(records[0])

const addRelations = () => {
  for (const connection of connectionsArray) {
    const query = `
        MATCH (a:Person {id: ${connection.user1_id}}), (b:Person {id: ${connection.user2_id}})
        MERGE (a)-[:KNOWS]-(b);
        `
    executeQuery(query)
  }
}

// addRelations()

const addPeople = () => {
  for (const user of usersArray) {
    const query = `
        MERGE (${user.username}:Person {person_name: "${user.username}"})
        ON CREATE SET ${user.username}.id = ${user.id}
          `
    executeQuery(query)
  }
}

// executeQuery(createPersonName)

// executeQuery(`MATCH (p:Person {person_name: "Sylwia"})
// RETURN p`)

const data = {
  taskName: 'connections',
  answer: 'Rafał, Azazel, Aleksander, Barbara',
}

sendAnswer(data)
