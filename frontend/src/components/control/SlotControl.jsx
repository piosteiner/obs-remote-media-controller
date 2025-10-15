import { useState, useRef, useEffect } from 'react'
import { Link as LinkIcon, Upload, X, Image as ImageIcon, Clipboard, Library, Save } from 'lucide-react'
import { slotsAPI, imagesAPI } from '../../services/api'
import websocketService from '../../services/websocket'
import useStore from '../../store'
import useToastStore from '../../store/toast'
import LibraryPicker from '../common/LibraryPicker'

function SlotControl({ slotId, slotData }) {
  const clearSlot = useStore(state => state.clearSlot)
  const setSlot = useStore(state => state.setSlot)
  
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [clipboardSupported, setClipboardSupported] = useState(false)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const fileInputRef = useRef(null)
  const pasteAreaRef = useRef(null)

  const { imageUrl, updatedAt } = slotData

  // Check if clipboard API is supported
  useEffect(() => {
    setClipboardSupported(
      typeof navigator !== 'undefined' && 
      navigator.clipboard && 
      typeof navigator.clipboard.read === 'function'
    )
  }, [])

  // Handle paste event
  useEffect(() => {
    const handlePaste = async (e) => {
      if (!showPasteArea) return
      
      e.preventDefault()
      const items = e.clipboardData?.items
      
      if (!items) return
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            const file = new File([blob], `pasted-${Date.now()}.png`, { type: blob.type })
            await uploadFile(file)
            setShowPasteArea(false)
            return
          }
        }
      }
      
      useToastStore.getState().warning('No image found in clipboard. Please copy an image first.')
    }

    if (showPasteArea && pasteAreaRef.current) {
      pasteAreaRef.current.addEventListener('paste', handlePaste)
      pasteAreaRef.current.focus()
      
      return () => {
        pasteAreaRef.current?.removeEventListener('paste', handlePaste)
      }
    }
  }, [showPasteArea])

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
      useToastStore.getState().success(`Slot ${slotId} updated successfully`)
    } catch (error) {
      console.error('Failed to update slot:', error)
      useToastStore.getState().error('Failed to update slot. Please try again.')
    }
  }

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  // Handle clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      setUploading(true)
      
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read()
          
          // Find image in clipboard
          let imageFile = null
          for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'))
            if (imageType) {
              const blob = await item.getType(imageType)
              imageFile = new File([blob], `clipboard-${Date.now()}.png`, { type: imageType })
              break
            }
          }

          if (!imageFile) {
            useToastStore.getState().info('No image in clipboard. Try: Copy an image, then click Paste again.')
            setUploading(false)
            return
          }

          await uploadFile(imageFile)
          return
        } catch (clipboardError) {
          // If clipboard.read() fails, fall back to paste event approach
          console.log('Clipboard API failed, trying paste event approach:', clipboardError)
        }
      }
      
      // Fallback: Show paste area for Ctrl+V
      setShowPasteArea(true)
      useToastStore.getState().info('Click in the blue box below, then press Ctrl+V (Cmd+V on Mac) to paste.')
      setUploading(false)
      
    } catch (error) {
      console.error('Failed to paste from clipboard:', error)
      // Always offer the paste area as fallback
      setShowPasteArea(true)
      useToastStore.getState().info('Click in the blue box below, then press Ctrl+V (Cmd+V on Mac) to paste.')
      setUploading(false)
    }
  }

  // Common upload logic
  const uploadFile = async (file) => {
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
        useToastStore.getState().success(`Image uploaded to Slot ${slotId}`)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      useToastStore.getState().error('Failed to upload image. Please try again.')
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

  // Handle library image selection
  const handleLibrarySelect = async (image) => {
    try {
      // Update slot with selected library image
      await slotsAPI.update(slotId, { 
        imageId: image.id,
        imageUrl: image.url 
      })
      websocketService.updateSlot(slotId, image.url, image.id)
      useToastStore.getState().success(`Selected "${image.name}" for Slot ${slotId}`)
    } catch (error) {
      console.error('Failed to update slot:', error)
      useToastStore.getState().error('Failed to update slot. Please try again.')
    }
  }

  // Handle save to library
  const handleSaveToLibrary = async () => {
    if (!imageUrl) {
      useToastStore.getState().warning('No image to save')
      return
    }

    try {
      setUploading(true)
      
      // Get the image name from URL or generate one
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1] || `slot-${slotId}-${Date.now()}.png`
      
      // Add URL to library
      const result = await imagesAPI.addUrl(imageUrl, fileName)
      
      if (result.success) {
        useToastStore.getState().success(`Saved "${fileName}" to library!`)
      }
    } catch (error) {
      console.error('Failed to save to library:', error)
      useToastStore.getState().error('Failed to save to library. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Slot {slotId}</h3>
        {imageUrl && (
          <div className="flex gap-2">
            <button
              onClick={handleSaveToLibrary}
              disabled={uploading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save to library"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear slot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
        {/* Paste Area */}
        {showPasteArea && (
          <div className="relative">
            <div
              ref={pasteAreaRef}
              contentEditable
              tabIndex={0}
              className="w-full px-4 py-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg text-center text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
            >
              <Clipboard className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Click here and press Ctrl+V (⌘+V on Mac)</p>
              <p className="text-sm mt-1">Paste your image from clipboard</p>
            </div>
            <button
              onClick={() => setShowPasteArea(false)}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setShowLibraryPicker(true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              title="Choose from library"
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </button>

            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>URL</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>

            {clipboardSupported && (
              <button
                onClick={handlePasteFromClipboard}
                disabled={uploading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Paste image from clipboard"
              >
                <Clipboard className="w-4 h-4" />
                <span>Paste</span>
              </button>
            )}
            
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

      {/* Library Picker Modal */}
      <LibraryPicker
        isOpen={showLibraryPicker}
        onClose={() => setShowLibraryPicker(false)}
        onSelect={handleLibrarySelect}
      />
    </div>
  )
}

export default SlotControl
