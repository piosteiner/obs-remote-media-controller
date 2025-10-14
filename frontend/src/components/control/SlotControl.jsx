import { useState, useRef } from 'react'
import { Link as LinkIcon, Upload, X, Image as ImageIcon } from 'lucide-react'
import { slotsAPI, imagesAPI } from '../../services/api'
import websocketService from '../../services/websocket'
import useStore from '../../store'

function SlotControl({ slotId, slotData }) {
  const clearSlot = useStore(state => state.clearSlot)
  const setSlot = useStore(state => state.setSlot)
  
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const { imageUrl, updatedAt } = slotData

  // Handle URL input
  const handleUrlSubmit = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    try {
      // Update slot with URL
      await slotsAPI.update(slotId, { imageUrl: urlInput })
      websocketService.updateSlot(slotId, urlInput)
      
      setUrlInput('')
      setShowUrlInput(false)
    } catch (error) {
      console.error('Failed to update slot:', error)
      alert('Failed to update slot. Please try again.')
    }
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      // Upload image
      const result = await imagesAPI.upload(file)
      
      if (result.success) {
        const uploadedImage = result.data
        const imageUrl = uploadedImage.url
        
        // Update slot
        await slotsAPI.update(slotId, { 
          imageId: uploadedImage.id,
          imageUrl: imageUrl 
        })
        websocketService.updateSlot(slotId, imageUrl, uploadedImage.id)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle clear slot
  const handleClear = async () => {
    try {
      await slotsAPI.clear(slotId)
      websocketService.clearSlot(slotId)
      clearSlot(slotId)
    } catch (error) {
      console.error('Failed to clear slot:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Slot {slotId}</h3>
        {imageUrl && (
          <button
            onClick={handleClear}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear slot"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Image Preview */}
      <div className="mb-4">
        {imageUrl ? (
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={`Slot ${slotId}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg=='
              }}
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}
        {updatedAt && (
          <p className="text-xs text-gray-500 mt-2">
            Updated: {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* URL Input */}
        {showUrlInput ? (
          <form onSubmit={handleUrlSubmit} className="flex space-x-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.png"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false)
                setUrlInput('')
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Paste URL</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default SlotControl
