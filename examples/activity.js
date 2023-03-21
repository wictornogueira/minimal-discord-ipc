const ipc = require('../src/index.js')

const CLIENT_ID = '' // Your application id https://support-dev.discord.com/hc/en-us/articles/360028717192-Where-can-I-find-my-Application-Team-Server-ID-

const DETAILS = 'Never gonna give you up'
const STATE = 'Never gonna let you down'

const LARGE_IMAGE = 'rick'
const LARGE_TEXT = 'Never gonna say goodbye'
const SMALL_IMAGE = 'stick_bug'
const SMALL_TEXT = 'Get stick bugged lol'

const START_TIME = Math.round(Date.now() / 1000)
const END_TIME = START_TIME + 213

const BTN_LABEL = 'Click me :)'
const BTN_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

const PARTY_ID = 'rick-party'
const PARTY_SIZE = [2, 69]

{(async () => {
  const client = await ipc.ClientFactory()

  const hsRes = await client.send(ipc.OP_CODES.HANDSHAKE, {
    v: 1,
    client_id: CLIENT_ID
  })

  console.log('Handshake response:', hsRes)

  const actRes = await client.send(ipc.OP_CODES.FRAME, {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.ppid,
      activity: {
        details: DETAILS,
        state: STATE,
        assets: {
          large_image: LARGE_IMAGE,
          large_text: LARGE_TEXT,
          small_image: SMALL_IMAGE,
          small_text: SMALL_TEXT
        },
        timestamps: {
          start: START_TIME,
          end: END_TIME
        },
        buttons: [
          { label: BTN_LABEL, url: BTN_URL }
        ],
        party: {
          id: PARTY_ID,
          size: PARTY_SIZE
        }
      }
    }
  })

  console.log('Set activity response:', actRes)
})()}
