'use strict'

const SlobsSocket = require('./src/SlobsSocket')
const keypress = require('keypress')

const s = new SlobsSocket('127.0.0.1', 59650, '74ec3c4dc1bca34ca4e7cbcba0812ea6a16d402c')
s.connect()

keypress(process.stdin)
process.stdin.on('keypress', (ch, key) => {
  if (key && key.name == 'a') {
    s.request('ScenesService', 'getScenes').then(scenes => {
      scenes.forEach(scene => console.log(scene))
    })
  }
  if (key && key.name == 'q') {
    process.stdin.pause()
    process.stdin.setRawMode(false)
  }
})
process.stdin.setRawMode(true)
process.stdin.resume()