const http = require('http')
const { Pool } = require('pg')

const PORT = process.env.PORT

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
})

const initialize = async () => {
  for (;;) {
    try {
      await pool.query(
        'CREATE TABLE IF NOT EXISTS pingpong (id int PRIMARY KEY, counter int NOT NULL)'
      )
      await pool.query('INSERT INTO pingpong (id, counter) VALUES (1, 0) ON CONFLICT DO NOTHING')
      return
    } catch (error) {
      console.log(`Waiting for the database: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

const readCounter = async () => {
  const result = await pool.query('SELECT counter FROM pingpong WHERE id = 1')
  return result.rows[0].counter
}

const increment = async () => {
  const result = await pool.query(
    'UPDATE pingpong SET counter = counter + 1 WHERE id = 1 RETURNING counter'
  )
  return result.rows[0].counter
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/pingpong') {
      const counter = await increment()
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(`pong ${counter - 1}\n`)
      return
    }

    if (req.url === '/pings') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ pings: await readCounter() }))
      return
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end(`${error.message}\n`)
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('not found\n')
})

initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`)
  })
})
