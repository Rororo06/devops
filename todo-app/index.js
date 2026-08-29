const http = require('http')

const PORT = process.env.PORT || 3000

const page = `<!DOCTYPE html>
<html>
  <head><title>Todo app</title></head>
  <body>
    <h1>Todo app</h1>
    <ul>
      <li>Learn Kubernetes</li>
      <li>Write manifests</li>
    </ul>
  </body>
</html>
`

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(page)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
