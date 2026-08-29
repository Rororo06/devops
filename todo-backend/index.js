const http = require('http')

const PORT = process.env.PORT || 3000

const todos = ['Learn Kubernetes', 'Write manifests']

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
  if (req.url === '/todos' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(todos))
    return
  }

  if (req.url === '/todos' && req.method === 'POST') {
    const body = await readBody(req)
    const content = parseTodo(body, req.headers['content-type'])

    if (!content || content.length > 140) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('todo must be between 1 and 140 characters\n')
      return
    }

    todos.push(content)
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ content }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('not found\n')
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
