const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const IMAGE_FILE = path.join('/usr/src/app/files', 'image.jpg')
const CACHE_MS = 10 * 60 * 1000

const todos = [
  'Learn Kubernetes',
  'Write manifests',
  'Persist the daily image'
]

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

const page = `<!DOCTYPE html>
<html>
  <head><title>Todo app</title></head>
  <body>
    <h1>Todo app</h1>
    <img src="/image.jpg" alt="daily image" width="600" />
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

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(page)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
