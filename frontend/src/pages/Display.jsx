import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import websocketService from '../services/websocket'
import { slotsAPI } from '../services/api'
import useStore from '../store'

/**
 * Display Page - Used by OBS Browser Source
 * URL: /display?slot=1
 * 
 * Features:
 * - Transparent background
 * - Real-time image updates via WebSocket
 * - Smooth fade transitions
 * - Automatic reconnection
 */
function Display() {
  const [searchParams] = useSearchParams()
  const slotIdParam = searchParams.get('slot') || '1'
  // Convert to number to match backend slot IDs
  const slotId = Number(slotIdParam)
  
  const slots = useStore(state => state.slots)
  const isConnected = useStore(state => state.isConnected)
  
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)

  // Get slot data
  const slotData = slots[slotId] || {}
  const { imageUrl } = slotData

  // Connect WebSocket on mount
  useEffect(() => {
    console.log(`Display page mounted for slot ${slotId}`)
    
    // Fetch initial slot data
    const fetchSlotData = async () => {
      try {
        const result = await slotsAPI.getAll()
        if (result.success) {
          const slots = result.data.slots
          console.log('Fetched slots:', slots)
          console.log(`Slot ${slotId} data:`, slots[slotId])
          useStore.getState().setSlots(slots)
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

  // Update image with fade transition
  useEffect(() => {
    console.log(`Slot ${slotId} imageUrl changed:`, imageUrl)
    console.log('Current slots:', slots)
    
    if (imageUrl && imageUrl !== currentImageUrl) {
      // Fade out
      setImageLoaded(false)
      
      // Small delay then fade in with new image
      const timer = setTimeout(() => {
        setCurrentImageUrl(imageUrl)
      }, 150)

      return () => clearTimeout(timer)
    } else if (!imageUrl && currentImageUrl) {
      // Clear image
      setImageLoaded(false)
      setCurrentImageUrl(null)
    }
  }, [imageUrl, currentImageUrl, slotId, slots])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent flex items-center justify-center">
      {currentImageUrl ? (
        <img
          src={currentImageUrl}
          alt={`Slot ${slotId}`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            console.error('Image failed to load:', currentImageUrl)
            e.target.style.display = 'none'
          }}
          style={{
            imageRendering: 'crisp-edges',
          }}
        />
      ) : (
        // Empty slot - show nothing (transparent)
        <div className="w-full h-full bg-transparent" />
      )}

      {/* Connection indicator (only in development) */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-black bg-opacity-50 text-white">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          Slot {slotId} {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}

      {/* Debug info - show for 10 seconds after load, or press 'd' to toggle */}
      <div className="fixed bottom-4 left-4 px-4 py-3 bg-black bg-opacity-75 text-white text-xs font-mono rounded-lg max-w-md">
        <div><strong>Slot ID:</strong> {slotId} (type: {typeof slotId})</div>
        <div><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</div>
        <div><strong>Slot Data:</strong> {JSON.stringify(slotData)}</div>
        <div><strong>Image URL:</strong> {imageUrl || 'none'}</div>
        <div><strong>Current Image:</strong> {currentImageUrl || 'none'}</div>
        <div><strong>All Slots:</strong> {JSON.stringify(Object.keys(slots))}</div>
      </div>
    </div>
  )
}

export default Display
