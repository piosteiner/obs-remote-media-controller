import { io } from 'socket.io-client'
import useStore from '../store'

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
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
    }

    if (import.meta.env.PROD && backendURL) {
      // Extract base URL and path
      // e.g., "wss://api.piogino.ch/obs" -> url: "wss://api.piogino.ch", path: "/obs/socket.io/"
      const urlObj = new URL(backendURL.replace('wss://', 'https://'))
      url = `wss://${urlObj.host}`
      
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
    this.socket.on('slot:updated', (data) => {
      console.log('Slot updated:', data)
      useStore.getState().setSlot(data.slot, {
        imageId: data.imageId,
        imageUrl: data.imageUrl,
        updatedAt: data.timestamp
      })
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
