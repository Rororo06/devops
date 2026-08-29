const { randomUUID } = require('crypto')

const id = randomUUID()

const output = () => {
  console.log(`${new Date().toISOString()}: ${id}`)
}

output()
setInterval(output, 5000)
