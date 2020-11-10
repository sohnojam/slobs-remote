'use strict'

const SlobsSocket = require('./src/SlobsSocket')
const keypress = require('keypress')

const { ip, port, token } = require('./config.js')

const slobs = new SlobsSocket(ip, port, token)

let tempResources = {
  startTimer: null,
  startPrevSceneId: null,
  breakPrevSceneId: null,
}
let state = 'init'

keypress(process.stdin)
process.stdin.on('keypress', (ch, key) => {

  // ESC = init
  if (key && key.name == 'escape') {
    if (state === 'init' || slobs.connectionStatus !== 'connected') {
      slobs.connect(() => state = 'main', () => state = 'init')
    }
  }

  // F1 = start prep
  if (key && key.name == 'f1') {
    if (state === 'main') {
      state = 'start'
      slobs.request('ScenesService', 'activeSceneId').then(aSceneId => {
        tempResources.startPrevSceneId = aSceneId
      })
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Starting')
        if (iScene) {
          slobs.request('ScenesService', 'makeSceneActive', iScene.id)
          slobs.request('AudioService', 'getSources').then(sources => {
            const iSourcesNames = ['Desktop', 'Mic']
            const iSources = sources.filter(source => iSourcesNames.includes(source.name))
            iSources.forEach(source => {
              slobs.request('SourcesService', 'setMuted', source.sourceId, true)
            })
          })
          const iItem = iScene.nodes.find(item => item.name == 'Start Timer')
          if (iItem) {
            slobs.request(iItem.resourceId, 'setVisibility', false)
            tempResources.startTimer = iItem
          }
        }
      })
    } else if (state === 'start') {
      if (tempResources.startTimer) {
        const iItem = tempResources.startTimer
        slobs.request(iItem.resourceId, 'setVisibility', false)
      }
    }
  }

  // F2 = start sync
  if (key && key.name == 'f2') {
    if (state === 'start') {
      if (tempResources.startTimer) {
        const iItem = tempResources.startTimer
        slobs.request(iItem.resourceId, 'setVisibility', true)
      }
    }
  }

  // F3 = start abort
  if (key && key.name == 'f3') {
    if (state === 'start') {
      tempResources.startPrevSceneId = null
      tempResources.startTimer = null
      state = 'main'
    }
  }

  // F4 = start go
  if (key && key.name == 'f4') {
    if (state === 'start') {
      slobs.request('ScenesService', 'makeSceneActive', tempResources.startPrevSceneId)
      slobs.request('AudioService', 'getSources').then(sources => {
        const iSourcesNames = ['Desktop', 'Mic']
        const iSources = sources.filter(source => iSourcesNames.includes(source.name))
        iSources.forEach(source => {
          slobs.request('SourcesService', 'setMuted', source.sourceId, false)
        })
      })
      tempResources.startPrevSceneId = null
      tempResources.startTimer = null
      state = 'main'
    }
  }

  // F5 = break start
  if (key && key.name == 'f5') {
    if (state === 'main') {
      state = 'break'
      slobs.request('ScenesService', 'activeSceneId').then(aSceneId => {
        tempResources.breakPrevSceneId = aSceneId
      })
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'BRB')
        if (iScene) {
          slobs.request('ScenesService', 'makeSceneActive', iScene.id)
          slobs.request('AudioService', 'getSources').then(sources => {
            const iSourcesNames = ['Desktop', 'Mic']
            const iSources = sources.filter(source => iSourcesNames.includes(source.name))
            iSources.forEach(source => {
              slobs.request('SourcesService', 'setMuted', source.sourceId, true)
            })
          })
        }
      })
    }
  }

  // F7 = break abort
  if (key && key.name == 'f7') {
    if (state === 'break') {
      tempResources.breakPrevSceneId = null
      state = 'main'
      console.log('break abort', tempResources, state)
    }
  }

  // F8 = break end
  if (key && key.name == 'f8') {
    if (state === 'break') {
      slobs.request('ScenesService', 'makeSceneActive', tempResources.breakPrevSceneId)
      slobs.request('AudioService', 'getSources').then(sources => {
        const iSourcesNames = ['Desktop', 'Mic']
        const iSources = sources.filter(source => iSourcesNames.includes(source.name))
        iSources.forEach(source => {
          slobs.request('SourcesService', 'setMuted', source.sourceId, false)
        })
      })
      tempResources.breakPrevSceneId = null
      state = 'main'
    }
  }

  // F9 = end start
  if (key && key.name == 'f9') {
    if (state === 'main') {
      state = 'end'
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Ending')
        if (iScene) {
          slobs.request('ScenesService', 'makeSceneActive', iScene.id)
          slobs.request('AudioService', 'getSources').then(sources => {
            const iSourcesNames = ['Desktop', 'Mic']
            const iSources = sources.filter(source => iSourcesNames.includes(source.name))
            iSources.forEach(source => {
              slobs.request('SourcesService', 'setMuted', source.sourceId, true)
            })
          })
        }
      })
    }
  }

  // F11 = end abort
  if (key && key.name == 'f11') {
    if (state === 'end') {
      state = 'main'
    }
  }

  // Q = scene 'Starting'
  if (key && key.name == 'q') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Starting')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // W = scene 'BRB'
  if (key && key.name == 'w') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'BRB')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // E = scene 'Ending'
  if (key && key.name == 'e') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Ending')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // A = scene 'Screen (Monitor 1)'
  if (key && key.name == 'a') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Screen (Monitor 1)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // S = scene 'Screen (Monitor 2)'
  if (key && key.name == 's') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Screen (Monitor 2)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // D = scene 'Chatting'
  if (key && key.name == 'd') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Chatting')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // F = scene 'Screen (Window Generic)'
  if (key && key.name == 'f') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Screen (Window Generic)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // Z = scene 'Game (League of Legends Client)'
  if (key && key.name == 'z') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Game (League of Legends Client)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // X = scene 'Game (League of Legends)'
  if (key && key.name == 'x') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Game (League of Legends)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // C = scene 'Game (Fullscreen Generic)'
  if (key && key.name == 'c') {
    if (state === 'main') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iScene = scenes.find(scene => scene.name == 'Game (Fullscreen Generic)')
        slobs.request('ScenesService', 'makeSceneActive', iScene.id)
      })
    }
  }

  // P = hide facecam
  if (key && key.name == 'p') {
    if (state !== 'init') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iItems = scenes.map(scene => {
          const iItem = scene.nodes.find(item => item.name == 'Camera Capture')
          if (iItem) return iItem
        }).filter(item => item)
        iItems.forEach(iItem => {
          slobs.request(iItem.resourceId, 'setVisibility', false)
        })
      })
    }
  }

  // ; = show facecam
  if (!key && ch == ';') {
    if (state !== 'init') {
      slobs.request('ScenesService', 'getScenes').then(scenes => {
        const iItems = scenes.map(scene => {
          const iItem = scene.nodes.find(item => item.name == 'Camera Capture')
          if (iItem) return iItem
        }).filter(item => item)
        iItems.forEach(iItem => {
          slobs.request(iItem.resourceId, 'setVisibility', true)
        })
      })
    }
  }

  // U = mute sound
  if (key && key.name == 'u') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSourcesNames = ['Desktop', 'Mic']
      const iSources = sources.filter(source => iSourcesNames.includes(source.name))
      iSources.forEach(source => {
        slobs.request('SourcesService', 'setMuted', source.sourceId, true)
      })
    })
  }

  // J = unmute sound
  if (key && key.name == 'j') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSourcesNames = ['Desktop', 'Mic']
      const iSources = sources.filter(source => iSourcesNames.includes(source.name))
      iSources.forEach(source => {
        slobs.request('SourcesService', 'setMuted', source.sourceId, false)
      })
    })
  }

  // I = mute desktop
  if (key && key.name == 'i') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSource = sources.find(source => source.name == 'Desktop')
      if (iSource) {
        slobs.request('SourcesService', 'setMuted', iSource.sourceId, true)
      }
    })
  }

  // K = unmute desktop
  if (key && key.name == 'k') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSource = sources.find(source => source.name == 'Desktop')
      if (iSource) {
        slobs.request('SourcesService', 'setMuted', iSource.sourceId, false)
      }
    })
  }

  // O = mute mic
  if (key && key.name == 'o') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSource = sources.find(source => source.name == 'Mic')
      if (iSource) {
        slobs.request('SourcesService', 'setMuted', iSource.sourceId, true)
      }
    })
  }

  // L = unmute mic
  if (key && key.name == 'l') {
    slobs.request('AudioService', 'getSources').then(sources => {
      const iSource = sources.find(source => source.name == 'Mic')
      if (iSource) {
        slobs.request('SourcesService', 'setMuted', iSource.sourceId, false)
      }
    })
  }


  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause()
    process.stdin.setRawMode(false)
  }

})
process.stdin.setRawMode(true)
process.stdin.resume()