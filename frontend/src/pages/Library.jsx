import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Search, Clipboard, X } from 'lucide-react'
import Header from '../components/common/Header'
import { imagesAPI, slotsAPI } from '../services/api'
import websocketService from '../services/websocket'
import useStore from '../store'
import useToastStore from '../store/toast'

/**
 * Library Page - Image library management
 */
function Library() {
  const images = useStore(state => state.images)
  const setImages = useStore(state => state.setImages)
  const addImage = useStore(state => state.addImage)
  const deleteImage = useStore(state => state.deleteImage)
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [clipboardSupported, setClipboardSupported] = useState(false)
  const fileInputRef = useRef(null)
  const pasteAreaRef = useRef(null)

  useEffect(() => {
    loadImages()
  }, [])

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

  const loadImages = async () => {
    try {
      setLoading(true)
      // Uncomment when backend is ready
      // const result = await imagesAPI.getAll()
      // if (result.success) {
      //   setImages(result.data.images)
      // }
      
      // Mock data for now
      setImages([])
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }

  // Common upload logic
  const uploadFile = async (file) => {
    try {
      setUploading(true)
      const result = await imagesAPI.upload(file)
      if (result.success) {
        addImage(result.data)
        useToastStore.getState().success(`Image uploaded: ${file.name}`)
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      useToastStore.getState().error('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploading(true)
      
      let successCount = 0
      for (const file of files) {
        const result = await imagesAPI.upload(file)
        if (result.success) {
          addImage(result.data)
          successCount++
        }
      }
      
      useToastStore.getState().success(`Successfully uploaded ${successCount} image(s)`)
    } catch (error) {
      console.error('Failed to upload images:', error)
      useToastStore.getState().error('Failed to upload one or more images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
          console.log('Clipboard API failed, trying paste event approach:', clipboardError)
        }
      }
      
      // Fallback: Show paste area for Ctrl+V
      setShowPasteArea(true)
      useToastStore.getState().info('Click in the blue box below, then press Ctrl+V (Cmd+V on Mac) to paste.')
      setUploading(false)
      
    } catch (error) {
      console.error('Failed to paste from clipboard:', error)
      setShowPasteArea(true)
      useToastStore.getState().info('Click in the blue box below, then press Ctrl+V (Cmd+V on Mac) to paste.')
      setUploading(false)
    }
  }

  const handleDelete = async (imageId) => {
    if (!confirm('Delete this image?')) return

    try {
      await imagesAPI.delete(imageId)
      deleteImage(imageId)
      useToastStore.getState().success('Image deleted successfully')
    } catch (error) {
      console.error('Failed to delete image:', error)
      useToastStore.getState().error('Failed to delete image')
    }
  }

  const handleAssignToSlot = async (image) => {
    const slotId = prompt('Enter slot number:')
    if (!slotId) return

    try {
      await slotsAPI.update(slotId, {
        imageId: image.id,
        imageUrl: image.url
      })
      websocketService.updateSlot(slotId, image.url, image.id)
      useToastStore.getState().success(`Image assigned to Slot ${slotId}`)
    } catch (error) {
      console.error('Failed to assign image:', error)
      useToastStore.getState().error('Failed to assign image to slot')
    }
  }

  const filteredImages = images.filter(img =>
    img.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Image Library</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Paste Button */}
            {clipboardSupported && (
              <button
                onClick={handlePasteFromClipboard}
                disabled={uploading}
                className="flex items-center justify-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                title="Paste image from clipboard"
              >
                <Clipboard className="w-5 h-5" />
                <span>Paste</span>
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {/* Paste Area */}
          {showPasteArea && (
            <div className="relative mt-4">
              <div
                ref={pasteAreaRef}
                contentEditable
                tabIndex={0}
                className="w-full px-4 py-8 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg text-center text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
              >
                <Clipboard className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Click here and press Ctrl+V (⌘+V on Mac)</p>
                <p className="text-sm mt-1">Paste your image from clipboard to add to library</p>
              </div>
              <button
                onClick={() => setShowPasteArea(false)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No images found' : 'No images yet. Upload your first image!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Upload Images
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleAssignToSlot(image)}
                  />
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-700 truncate" title={image.originalName}>
                    {image.originalName || image.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {image.width} × {image.height}
                  </p>
                </div>

                {/* Delete Button (on hover) */}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Click to assign overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={() => handleAssignToSlot(image)}>
                  <p className="text-white font-medium text-sm">
                    Click to assign
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Library
