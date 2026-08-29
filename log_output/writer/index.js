const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')

const FILE = path.join(process.env.LOG_DIR || '/usr/src/app/files', 'log.txt')
const id = randomUUID()

const write = () => {
  const line = `${new Date().toISOString()}: ${id}`
  fs.writeFileSync(FILE, `${line}\n`)
  console.log(line)
}

write()
setInterval(write, 5000)
