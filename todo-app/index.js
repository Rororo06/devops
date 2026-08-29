const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT
const BACKEND_URL = process.env.TODO_BACKEND_URL
const IMAGE_URL = process.env.IMAGE_URL
const IMAGE_FILE = path.join(process.env.IMAGE_DIR, 'image.jpg')
const CACHE_MS = Number(process.env.IMAGE_CACHE_MINUTES) * 60 * 1000
const TODO_MAX_LENGTH = Number(process.env.TODO_MAX_LENGTH)

let isHealthy = true

const isFresh = () => {
  try {
    return Date.now() - fs.statSync(IMAGE_FILE).mtimeMs < CACHE_MS
  } catch {
    return false
  }
}

const fetchImage = async () => {
  const response = await fetch(IMAGE_URL)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(IMAGE_FILE, buffer)
}

const fetchTodos = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/todos`)
    return await response.json()
  } catch (error) {
    console.log(`Could not fetch the todos: ${error.message}`)
    return []
  }
}

const createTodo = async (content) => {
  await fetch(`${BACKEND_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
}

const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
  })

const backendIsHealthy = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/healthz`)
    return response.ok
  } catch (error) {
    console.log(`The backend is not healthy: ${error.message}`)
    return false
  }
}

const page = (todos) => `<!DOCTYPE html>
<html>
  <head><title>Todo app</title></head>
  <body>
    <h1>Todo app</h1>
    <img src="/image.jpg" alt="daily image" width="600" />
    <form action="/todos" method="post">
      <input id="content" name="content" type="text" maxlength="${TODO_MAX_LENGTH}" placeholder="What needs to be done?" required />
      <button type="submit">Send</button>
    </form>
    <ul>
      ${todos.map((todo) => `<li>${todo}</li>`).join('\n      ')}
    </ul>
    <form action="/break" method="post">
      <button type="submit">Break the app</button>
    </form>
  </body>
</html>
`

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    if (!isHealthy || !(await backendIsHealthy())) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'unhealthy' }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (req.url === '/break' && req.method === 'POST') {
    isHealthy = false
    console.log('The app was broken by a user')
    res.writeHead(302, { Location: '/' })
    res.end()
    return
  }

  if (!isHealthy) {
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end('<h1>Todo app</h1><p>The app is broken, wait for a new pod</p>\n')
    return
  }

  if (req.url === '/image.jpg') {
    if (!isFresh()) {
      try {
        await fetchImage()
      } catch (error) {
        console.log(`Could not fetch a new image: ${error.message}`)
      }
    }

    try {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' })
      res.end(fs.readFileSync(IMAGE_FILE))
    } catch {
      res.writeHead(503, { 'Content-Type': 'text/plain' })
      res.end('no image available\n')
    }
    return
  }

  if (req.url === '/todos' && req.method === 'POST') {
    const content = new URLSearchParams(await readBody(req)).get('content')

    if (content && content.length <= TODO_MAX_LENGTH) {
      await createTodo(content)
    }

    res.writeHead(302, { Location: '/' })
    res.end()
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(page(await fetchTodos()))
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
