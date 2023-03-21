const { createConnection } = require('net')

const OP_CODES = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4
}

const _utils = {}
_utils.createAsyncConnection = (...args) => new Promise((resolve, reject) => {
  const socket = createConnection(...args)
  socket.once('ready', () => resolve(socket))
  socket.once('error', reject)
})
_utils.decodePackets = (buffer) => {
  const packets = []
  while (buffer.length) {
    const opCode = buffer.readUInt8(0)
    const dataLength = buffer.readUInt32LE(4)

    try {
      const data = JSON.parse(buffer.subarray(8, 8 + dataLength).toString())
      packets.push({ opCode, data })
    } finally {
      buffer = buffer.subarray(8 + dataLength)
    }
  }

  return packets
}
_utils.preparePacket = (opCode, data) => {
  const dataBuff = Buffer.from(JSON.stringify(data))
  const headerBuff = Buffer.alloc(8)
  headerBuff.writeUInt8(opCode, 0)
  headerBuff.writeUInt32LE(dataBuff.length, 4)
  return Buffer.concat([headerBuff, dataBuff])
}
_utils.NonceGenerator = () => {
  let nonce = 0
  return () => nonce++
}
_utils.pipeLocation = (() => {
  if (process.platform === 'win32')
    return '\\\\?\\pipe\\discord-ipc-0'

  for (const envVar of ['XDG_RUNTIME_DIR', 'TMPDIR', 'TMP', 'TEMP'])
    if (process.env[envVar])
      return `${process.env[envVar]}/discord-ipc-0`
  
  return '/tmp/discord-ipc-0'
})()

const ClientFactory = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const socket = await _utils.createAsyncConnection(_utils.pipeLocation)
      const handlers = {}
      const nextNonce = _utils.NonceGenerator()

      socket.on('data', (data) => {
        const packets = _utils.decodePackets(data)

        for (const packet of packets) {
          const nonce = packet.data.nonce
          const handler = handlers[nonce]
          delete handlers[nonce]
          if (typeof handler === 'function')
            handler(packet)
        }
      })

      const client = {}
      client.send = (opCode, data = {}, cb = null) => {
        if (typeof cb !== 'function')
          return new Promise((resolve, _) => client.send(opCode, data, resolve))

        if (opCode === OP_CODES.HANDSHAKE)
          data.nonce = null
        else if (typeof data.nonce === 'undefined')
          data.nonce = nextNonce()

        const packet = _utils.preparePacket(opCode, data)
        handlers[data.nonce] = cb
        socket.write(packet)
        return client
      }

      return resolve(client)
    } catch (e) { return reject(e) }
  })
}

module.exports = {
  OP_CODES,
  ClientFactory
}
