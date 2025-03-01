import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'

dotenv.config()

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
)

export async function executeQuery(query, params, handleRecord) {
  const session = driver.session()
  try {
    // If handleRecord is provided, use subscribe pattern
    if (handleRecord) {
      return new Promise((resolve, reject) => {
        const results = []

        session.run(query, params).subscribe({
          onKeys: (keys) => {
            console.log(keys)
          },
          onNext: (record) => {
            results.push(record)
            handleRecord(record)
          },
          onCompleted: () => {
            session.close()
            resolve(results)
          },
          onError: (error) => {
            console.log(error)
            session.close()
            reject(error)
          },
        })
      })
    }
    // Otherwise use the simpler Promise-based approach
    else {
      const result = await session.run(query, params)
      return result.records
    }
  } catch (error) {
    console.error('Neo4j query execution error:', error)
    throw error
  } finally {
    await session.close()
  }
}

// Close the driver when the application exits
process.on('exit', () => {
  driver.close()
})
