const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const PING_PONG_URL = process.env.PING_PONG_URL || 'http://ping-pong-svc:2346'
const LOG_FILE = path.join('/usr/src/app/files', 'log.txt')

const readLog = () => {
  try {
    return fs.readFileSync(LOG_FILE, 'utf8').trim()
  } catch {
    return 'no log available yet'
  }
}

const readPings = async () => {
  try {
    const response = await fetch(`${PING_PONG_URL}/pings`)
    const body = await response.json()
    return body.pings
  } catch (error) {
    console.log(`Could not read the pong count: ${error.message}`)
    return 'unavailable'
  }
}

const server = http.createServer(async (req, res) => {
  const pings = await readPings()
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${readLog()}.\nPing / Pongs: ${pings}\n`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
