import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import websocketService from '../services/websocket'
import { slotsAPI } from '../services/api'
import useStore from '../store'
import useRotation from '../hooks/useRotation'

/**
 * Display Page - Used by OBS Browser Source
 * URL: /display?slot=1
 *
 * Features:
 * - Transparent background
 * - Real-time image updates via WebSocket
 * - Cross-fades: a new image fades in over the old one (two layers), for a change and in a rotation
 * - Rotation: the slot's images in turn (hooks/useRotation.js — the same image as on every controller)
 * - Automatic reconnection
 */
const FADE_MS = 600

function Display() {
  const [searchParams] = useSearchParams()
  const slotIdParam = searchParams.get('slot') || '1'
  // Convert to number to match backend slot IDs
  const slotId = Number(slotIdParam)

  const slots = useStore(state => state.slots)
  const isConnected = useStore(state => state.isConnected)

  const slotData = slots[slotId] || {}
  const { url: targetUrl, rotating } = useRotation(slotData)
  // in a rotation the fade takes up to 1.5 s, but never more than a third of the time an image stays
  const fadeMs = rotating ? Math.min(1500, (slotData.rotation.intervalSec * 1000) / 3) : FADE_MS

  // two layers: the one in front shows the current image; a new one is loaded into the other, then faded in
  const [view, setView] = useState({ layers: [{ url: null, on: false }, { url: null, on: false }], front: 0 })
  const viewRef = useRef(view)
  viewRef.current = view

  // Connect WebSocket on mount
  useEffect(() => {
    console.log(`Display page mounted for slot ${slotId}`)

    // Fetch initial slot data
    const fetchSlotData = async () => {
      try {
        const result = await slotsAPI.getAll()
        if (result.success) {
          useStore.getState().setSlots(result.data.slots)
        }
      } catch (error) {
        console.error('Failed to fetch slot data:', error)
      }
    }

    fetchSlotData()
    websocketService.connect()

    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      websocketService.ping()
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      // Don't disconnect here - other components might be using it
    }
  }, [slotId])

  // A new image: loaded first (no half-drawn picture), then faded in over the old one
  useEffect(() => {
    const { layers, front } = viewRef.current
    if (!targetUrl) {
      setView({ layers: layers.map((l) => ({ ...l, on: false })), front })
      return undefined
    }
    if (layers[front].url === targetUrl && layers[front].on) return undefined
    let cancelled = false
    const img = new Image()
    img.onload = img.onerror = () => {
      if (cancelled) return
      const back = 1 - viewRef.current.front
      setView((v) => ({
        layers: v.layers.map((l, i) => (i === back ? { url: targetUrl, on: true } : { ...l, on: false })),
        front: back,
      }))
    }
    img.src = targetUrl
    return () => { cancelled = true }
  }, [targetUrl])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent">
      {view.layers.map((layer, i) => layer.url && (
        <img
          key={i}
          src={layer.url}
          alt={`Slot ${slotId}`}
          data-layer={i === view.front ? 'front' : 'back'}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: layer.on ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease-in-out`,
            zIndex: i === view.front ? 2 : 1,
            imageRendering: 'crisp-edges',
          }}
          onError={() => console.error('Image failed to load:', layer.url)}
        />
      ))}

      {/* Connection indicator (only in development) */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          Slot {slotId} {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}
    </div>
  )
}

export default Display
