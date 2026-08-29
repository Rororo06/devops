const { connect, StringCodec } = require('nats')

const NATS_URL = process.env.NATS_URL
const NATS_SUBJECT = process.env.NATS_SUBJECT
const QUEUE_GROUP = process.env.NATS_QUEUE_GROUP
const WEBHOOK_URL = process.env.WEBHOOK_URL

const codec = StringCodec()

const describe = ({ action, todo }) =>
  action === 'created'
    ? `A todo was created: "${todo.content}"`
    : `A todo was updated: "${todo.content}" is ${todo.done ? 'done' : 'not done'}`

const send = async (message) => {
  if (!WEBHOOK_URL) {
    console.log(`No webhook configured, not sending: ${message}`)
    return
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'bot', message })
  })

  console.log(`Sent a message to the external service: ${response.status}`)
}

const main = async () => {
  const nats = await connect({ servers: NATS_URL })
  console.log(`Connected to NATS in ${NATS_URL}`)

  const subscription = nats.subscribe(NATS_SUBJECT, { queue: QUEUE_GROUP })

  for await (const message of subscription) {
    const payload = JSON.parse(codec.decode(message.data))
    const text = describe(payload)
    console.log(`Received a message: ${text}`)

    try {
      await send(text)
    } catch (error) {
      console.log(`Could not send the message: ${error.message}`)
    }
  }
}

main()
