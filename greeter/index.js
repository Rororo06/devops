const http = require('http')

const PORT = process.env.PORT || 3001
const GREETING = process.env.GREETING || 'hello'
const VERSION = process.env.VERSION || 'v1'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${GREETING} from greeter ${VERSION}\n`)
})

server.listen(PORT, () => {
  console.log(`Greeter ${VERSION} started in port ${PORT}`)
})
