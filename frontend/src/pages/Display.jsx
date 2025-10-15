import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import websocketService from '../services/websocket'
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
  }, [imageUrl, currentImageUrl])

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
    </div>
  )
}

export default Display
