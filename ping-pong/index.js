const http = require('http')

const PORT = process.env.PORT || 3000

let counter = 0

const server = http.createServer((req, res) => {
  if (req.url === '/pingpong') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`pong ${counter}\n`)
    counter += 1
    return
  }

  if (req.url === '/pings') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ pings: counter }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('not found\n')
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
