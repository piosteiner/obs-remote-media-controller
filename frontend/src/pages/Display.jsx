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
 * - Calm changes (players shouldn't notice a switch): once the new image is loaded, it fades in and the old one
 *   fades out at the same time. Their curves complement each other — the new one comes up quickly at first
 *   (FADE_IN), the old one gives way mostly towards the end (FADE_OUT) — so the two never become see-through
 *   together halfway. The first image fades in, a cleared slot fades out.
 * - Rotation: the slot's images in turn (hooks/useRotation.js — the same image as on every controller)
 * - Automatic reconnection
 */
export const CHANGE_FADE_MS = 2000
// in a rotation up to 2.5 s, but never more than a third of the time an image stays
export const rotationFadeMs = (intervalSec) => Math.min(2500, (intervalSec * 1000) / 3)

const FADE_IN = 'cubic-bezier(0.25, 0.6, 0.45, 1)'
const FADE_OUT = 'cubic-bezier(0.55, 0, 0.75, 0.4)'
const EMPTY = { url: null, opacity: 0, ms: 0, ease: 'ease-in-out' }

function Display() {
  const [searchParams] = useSearchParams()
  const slotIdParam = searchParams.get('slot') || '1'
  // Convert to number to match backend slot IDs
  const slotId = Number(slotIdParam)

  const slots = useStore(state => state.slots)
  const isConnected = useStore(state => state.isConnected)

  const slotData = slots[slotId] || {}
  const { url: targetUrl, rotating } = useRotation(slotData)
  const fadeMs = rotating ? rotationFadeMs(slotData.rotation.intervalSec) : CHANGE_FADE_MS

  // Two layers, both always there (a layer that appears would show at once, without a fade). top: the layer that
  // shows, or is fading in, the newest image; the other lies under it.
  const [layers, setLayers] = useState([EMPTY, EMPTY])
  const [top, setTop] = useState(0)
  const state = useRef({ layers, top })
  state.current = { layers, top }

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

  useEffect(() => {
    const { layers: now, top: shown } = state.current
    const set = (i, layer) => setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...layer } : l)))

    // cleared: what shows fades out
    if (!targetUrl) {
      setLayers((ls) => ls.map((l) => ({ ...l, opacity: 0, ms: fadeMs, ease: 'ease-in-out' })))
      return undefined
    }
    if (now[shown].url === targetUrl && now[shown].opacity > 0) return undefined

    // loaded first (no half-drawn picture); then the new one fades in on top while the old one fades out
    let cancelled = false
    const img = new Image()
    img.onload = img.onerror = () => {
      if (cancelled) return
      const outgoing = state.current.top
      const incoming = 1 - outgoing
      set(incoming, { url: targetUrl, opacity: 0, ms: 0, ease: FADE_IN }) // invisible, on top …
      setTop(incoming)
      // … then both at once (two frames later, so the browser has drawn it at 0 and the transitions run)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled) return
        set(incoming, { opacity: 1, ms: fadeMs, ease: FADE_IN })
        set(outgoing, { opacity: 0, ms: fadeMs, ease: FADE_OUT })
      }))
    }
    img.src = targetUrl
    return () => { cancelled = true }
  }, [targetUrl])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent">
      {layers.map((layer, i) => (
        <img
          key={i}
          src={layer.url || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
          alt=""
          data-layer={i === top ? 'front' : 'back'}
          data-url={layer.url || ''}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: layer.url ? layer.opacity : 0,
            transition: `opacity ${layer.ms}ms ${layer.ease}`,
            zIndex: i === top ? 2 : 1,
            imageRendering: 'crisp-edges',
          }}
          onError={() => layer.url && console.error('Image failed to load:', layer.url)}
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
