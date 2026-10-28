import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import websocketService from '../services/websocket'
import { slotsAPI } from '../services/api'
import useStore from '../store'
import useRotation from '../hooks/useRotation'
import CrossfadeImage, { CHANGE_FADE_MS, rotationFadeMs } from '../components/common/CrossfadeImage'

/**
 * Display Page - Used by OBS Browser Source
 * URL: /display?slot=1
 *
 * Features:
 * - Transparent background
 * - Real-time image updates via WebSocket
 * - Calm changes (players shouldn't notice a switch): components/common/CrossfadeImage.jsx — the same as the
 *   slot's preview on the controller
 * - Rotation: the slot's images in turn (hooks/useRotation.js — the same image as on every controller)
 * - Automatic reconnection
 */
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

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent">
      <CrossfadeImage url={targetUrl} fadeMs={fadeMs} className="absolute inset-0" alt={`Slot ${slotId}`} imgStyle={{ imageRendering: 'crisp-edges' }} />

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
