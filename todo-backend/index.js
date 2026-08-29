const http = require('http')
const { Pool } = require('pg')

const PORT = process.env.PORT
const TODO_MAX_LENGTH = Number(process.env.TODO_MAX_LENGTH)

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
        'CREATE TABLE IF NOT EXISTS todos (id serial PRIMARY KEY, content text NOT NULL)'
      )
      return
    } catch (error) {
      console.log(`Waiting for the database: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

const readTodos = async () => {
  const result = await pool.query('SELECT content FROM todos ORDER BY id')
  return result.rows.map((row) => row.content)
}

const createTodo = async (content) => {
  await pool.query('INSERT INTO todos (content) VALUES ($1)', [content])
}

const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
  })

const parseTodo = (body, contentType) => {
  if (contentType && contentType.includes('application/json')) {
    return JSON.parse(body).content
  }
  return new URLSearchParams(body).get('content')
}

const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)

  try {
    if (req.url === '/healthz') {
      await pool.query('SELECT 1')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }

    if (req.url === '/todos' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(await readTodos()))
      return
    }

    if (req.url === '/todos' && req.method === 'POST') {
      const body = await readBody(req)
      const content = parseTodo(body, req.headers['content-type'])

      if (!content || content.length > TODO_MAX_LENGTH) {
        console.log(
          `Rejected a todo of length ${content ? content.length : 0}: ${JSON.stringify(content)}`
        )
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end(`todo must be between 1 and ${TODO_MAX_LENGTH} characters\n`)
        return
      }

      await createTodo(content)
      console.log(`Created a todo: ${JSON.stringify(content)}`)
      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ content }))
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
