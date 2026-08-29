const http = require('http')
const { randomUUID } = require('crypto')

const PORT = process.env.PORT || 3000
const id = randomUUID()

let timestamp = new Date().toISOString()

const output = () => {
  timestamp = new Date().toISOString()
  console.log(`${timestamp}: ${id}`)
}

output()
setInterval(output, 5000)

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${timestamp}: ${id}\n`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
