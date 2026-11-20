// The demo's socket (demo/mode.js): what services/websocket.js expects of socket.io — on, emit, timeout().emit,
// connected, disconnect/connect — fed by the demo's server (demo/server.js) instead of a connection. Like the real
// server, a new connection gets the player's state; the clock is this browser's.
import { on as listen, playerState, reportDuration } from './server'

const EVENTS = ['slot:updated', 'scene:loaded', 'player:state']

export function demoSocket() {
  const handlers = new Map()
  const fire = (event, data) => { if (socket.connected) for (const fn of handlers.get(event) || []) fn(data) }
  for (const e of EVENTS) listen(e, (data) => fire(e, data))

  const socket = {
    id: 'demo',
    connected: false,
    on(event, fn) { (handlers.get(event) || handlers.set(event, new Set()).get(event)).add(fn); return socket },
    emit(event, payload, ack) {
      if (event === 'player:time' && typeof payload === 'function') payload(Date.now())
      else if (event === 'player:duration') reportDuration(payload)
      else if (event === 'ping') setTimeout(() => fire('pong'), 0)
      if (typeof ack === 'function') ack()
      return socket
    },
    timeout() { return { emit: (event, cb) => { if (event === 'player:time') cb(null, Date.now()) } } },
    connect() {
      if (socket.connected) return socket
      setTimeout(async () => {
        socket.connected = true
        fire('connect')
        fire('player:state', await playerState())
      }, 0)
      return socket
    },
    disconnect() { socket.connected = false; for (const fn of handlers.get('disconnect') || []) fn('io client disconnect'); return socket },
  }
  return socket.connect()
}
