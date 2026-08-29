const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const FILE = path.join('/usr/src/app/files', 'log.txt')

const readLog = () => {
  try {
    return fs.readFileSync(FILE, 'utf8')
  } catch {
    return 'no log available yet\n'
  }
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(readLog())
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
