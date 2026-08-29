const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const FILE = path.join('/usr/src/app/files', 'pingpong.txt')

const readCounter = () => {
  try {
    return Number(fs.readFileSync(FILE, 'utf8').trim()) || 0
  } catch {
    return 0
  }
}

let counter = readCounter()

const server = http.createServer((req, res) => {
  if (req.url === '/pingpong') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`pong ${counter}\n`)
    counter += 1
    fs.writeFileSync(FILE, `${counter}\n`)
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('not found\n')
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
