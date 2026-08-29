const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const BACKEND_URL = process.env.TODO_BACKEND_URL || 'http://todo-backend-svc:2345'
const IMAGE_FILE = path.join('/usr/src/app/files', 'image.jpg')
const CACHE_MS = 10 * 60 * 1000

const isFresh = () => {
  try {
    return Date.now() - fs.statSync(IMAGE_FILE).mtimeMs < CACHE_MS
  } catch {
    return false
  }
}

const fetchImage = async () => {
  const response = await fetch('https://picsum.photos/1200')
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

const page = (todos) => `<!DOCTYPE html>
<html>
  <head><title>Todo app</title></head>
  <body>
    <h1>Todo app</h1>
    <img src="/image.jpg" alt="daily image" width="600" />
    <form action="/todos" method="post">
      <input id="content" name="content" type="text" maxlength="140" placeholder="What needs to be done?" required />
      <button type="submit">Send</button>
    </form>
    <ul>
      ${todos.map((todo) => `<li>${todo}</li>`).join('\n      ')}
    </ul>
  </body>
</html>
`

const server = http.createServer(async (req, res) => {
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

    if (content && content.length <= 140) {
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
