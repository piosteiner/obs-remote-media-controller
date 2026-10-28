import { io } from 'socket.io-client'
import useStore from '../store'
import { getApiKey } from './auth'
import { slotsAPI } from './api'

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.clockOffset = 0 // serverTime - Date.now()
  }

  connect() {
    // Several pages and the player overlay call this; keep a single socket
    if (this.socket) return

    // Get backend URL from environment
    const backendURL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL
    
    // In production, use full backend URL
    // In development, use relative path for Vite proxy
    let url = '/'
    let socketOptions = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
      // Read on every (re)connect; without a key the socket can only listen
      auth: (cb) => cb({ token: getApiKey() }),
    }

    if (import.meta.env.PROD && backendURL) {
      // Extract base URL and path
      // e.g., "wss://api.piogino.ch/obs" -> url: "wss://api.piogino.ch", path: "/obs/socket.io/"
      // ws:// stays ws:// (a local test server), everything else is wss://
      const urlObj = new URL(backendURL.replace(/^ws(s?):\/\//, 'http$1://'))
      url = `${urlObj.protocol === 'http:' ? 'ws' : 'wss'}://${urlObj.host}`
      
      if (urlObj.pathname && urlObj.pathname !== '/') {
        socketOptions.path = urlObj.pathname + '/socket.io/'
      }
    }

    this.socket = io(url, socketOptions)

    this.setupListeners()
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id)
      useStore.getState().setConnected(true)
      this.reconnectAttempts = 0
      this.syncClock()
      // what changed while not connected (between the page's first load and the socket, or during a drop)
      slotsAPI.getAll().then((r) => { if (r?.success) useStore.getState().setSlots(r.data.slots) }).catch(() => {})
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      useStore.getState().setConnected(false)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    // Slot events
    // The server sends the whole slot (image, quick images, rotation); an older client's partial update
    // (image only) must not wipe the rest — merged into what the slot has
    this.socket.on('slot:updated', (data) => {
      console.log('Slot updated:', data)
      const { slot, timestamp, ...fields } = data
      const previous = useStore.getState().slots[slot] || {}
      useStore.getState().setSlot(slot, { ...previous, ...fields, updatedAt: timestamp ?? previous.updatedAt })
    })

    // Scene events
    this.socket.on('scene:loaded', (data) => {
      console.log('Scene loaded:', data)
      const { slots } = data
      
      // Update all slots from scene
      Object.entries(slots).forEach(([slotId, slotData]) => {
        useStore.getState().setSlot(slotId, slotData)
      })
      
      useStore.getState().setCurrentScene(data.sceneId)
    })

    // Shared YouTube player
    this.socket.on('player:state', (state) => {
      useStore.getState().setPlayer(state)
    })

    // Error events
    this.socket.on('error', (data) => {
      console.error('WebSocket error:', data)
      // Could show toast notification here
    })

    // Keep-alive
    this.socket.on('pong', () => {
      // console.log('Pong received')
    })
  }

  // Send events
  updateSlot(slotId, imageUrl, imageId = null) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected')
      return
    }

    this.socket.emit('slot:update', {
      slot: slotId,
      imageUrl,
      imageId
    })
  }

  loadScene(sceneId) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected')
      return
    }

    this.socket.emit('scene:load', { sceneId })
  }

  clearSlot(slotId) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected')
      return
    }

    this.socket.emit('slot:clear', { slot: slotId })
  }

  // Estimate the offset to the server clock from a few round trips, keeping
  // the fastest one (least affected by network delay)
  async syncClock(samples = 5) {
    let best = null
    for (let i = 0; i < samples && this.socket?.connected; i++) {
      const sentAt = Date.now()
      const serverTime = await new Promise((resolve) => {
        this.socket.timeout(3000).emit('player:time', (err, time) => resolve(err ? null : time))
      })
      if (serverTime == null) continue
      const rtt = Date.now() - sentAt
      if (!best || rtt < best.rtt) best = { rtt, offset: serverTime + rtt / 2 - Date.now() }
    }
    if (best) this.clockOffset = best.offset
  }

  serverNow() {
    return Date.now() + this.clockOffset
  }

  reportDuration(sessionId, duration) {
    this.socket?.emit('player:duration', { sessionId, duration })
  }

  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping')
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

// Singleton instance
const websocketService = new WebSocketService()

export default websocketService
