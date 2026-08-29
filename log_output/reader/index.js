const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const PING_PONG_URL = process.env.PING_PONG_URL || 'http://ping-pong-svc:2346'
const LOG_FILE = path.join(process.env.LOG_DIR || '/usr/src/app/files', 'log.txt')
const INFORMATION_FILE = process.env.INFORMATION_FILE || '/usr/src/app/config/information.txt'
const MESSAGE = process.env.MESSAGE || ''

const readFile = (file, fallback) => {
  try {
    return fs.readFileSync(file, 'utf8').trim()
  } catch {
    return fallback
  }
}

const fetchPings = async () => {
  const response = await fetch(`${PING_PONG_URL}/pings`)
  const body = await response.json()
  return body.pings
}

const readPings = async () => {
  try {
    return await fetchPings()
  } catch (error) {
    console.log(`Could not read the pong count: ${error.message}`)
    return 'unavailable'
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    try {
      await fetchPings()
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'no data from ping-pong', error: error.message }))
      return
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  const pings = await readPings()
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(
    `file content: ${readFile(INFORMATION_FILE, 'no information available')}\n` +
      `env variable: MESSAGE=${MESSAGE}\n` +
      `${readFile(LOG_FILE, 'no log available yet')}.\n` +
      `Ping / Pongs: ${pings}\n`
  )
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
