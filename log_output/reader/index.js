const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const DIR = '/usr/src/app/files'
const LOG_FILE = path.join(DIR, 'log.txt')
const PINGPONG_FILE = path.join(DIR, 'pingpong.txt')

const read = (file, fallback) => {
  try {
    return fs.readFileSync(file, 'utf8').trim()
  } catch {
    return fallback
  }
}

const server = http.createServer((req, res) => {
  const log = read(LOG_FILE, 'no log available yet')
  const pings = read(PINGPONG_FILE, '0')
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${log}.\nPing / Pongs: ${pings}\n`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
