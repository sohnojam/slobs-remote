const SockJS = require('sockjs-client')

class SlobsSocket {

  constructor(ip, port, token) {
    this.ip = ip
    this.port = port
    this.token = token

    this.socket = null
    this.connectionStatus = 'disconnected'
    this.nextRequestId = 1

    this.requests = {}
    this.subscriptions = {}
  }

  connect() {
    if (this.connectionStatus !== 'disconnected') {
      return false
    }
    this.connectionStatus = 'pending'
    this.socket = new SockJS(`http://${this.ip}:${String(this.port)}/api`)

    this.socket.onopen = () => {
      this.request('TcpServerService', 'auth', this.token).then(() => {
        this.connectionStatus = 'connected'
        this.onConnectHandler()
      }).catch(e => {
        console.error(e.message)
      })
    }

    this.socket.onmessage = (e) => {
      this.onMessageHandler(e.data)
    }

    this.socket.onclose = (e) => {
      this.connectionStatus = 'disconnected'
      console.log('socket closed: ', e)
    }
  }

  request(resourceId, methodName, ...args) {
    const id = this.nextRequestId++
    const requestBody = {
      jsonepc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args }
    }

    return this.sendMessage(requestBody)
  }

  sendMessage(message) {
    const requestBody = message
    if (typeof message === 'string') {
      try {
        requestBody = JSON.parse(message)
      } catch (e) {
        console.error('invalid JSON provided')
      }
    }

    return new Promise((resolve, reject) => {
      this.requests[requestBody.id] = {
        body: requestBody,
        resolve,
        reject,
        completed: false
      }
      this.socket.send(JSON.stringify(requestBody))
    })
  }

  onConnectHandler() {
    console.log('connected')
  }

  onMessageHandler(data) {
    const message = JSON.parse(data)
    const request = this.requests[message.id]

    if (request) {
      if (message.error) {
        request.reject(message.error)
      } else {
        request.resolve(message.result)
      }
      delete this.requests[message.id]
    }

    const result = message.result
    if (!result) return

    if (result._type === 'EVENT' && result.emitter === 'STREAM') {
      this.subscriptions[message.result.resourceId](result.data)
    }
  }

}

module.exports = SlobsSocket