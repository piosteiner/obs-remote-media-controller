import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Search, Clipboard, X, Link as LinkIcon, Edit2 } from 'lucide-react'
import Header from '../components/common/Header'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
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
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [clipboardSupported, setClipboardSupported] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [slotNumber, setSlotNumber] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [imageToDelete, setImageToDelete] = useState(null)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [imageToRename, setImageToRename] = useState(null)
  const [newImageName, setNewImageName] = useState('')
  const fileInputRef = useRef(null)
  const pasteAreaRef = useRef(null)

  // Helper function to format file sizes
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Helper function to calculate savings
  const getSavingsInfo = (image) => {
    if (!image.originalSize || !image.size) return null
    const savings = image.originalSize - image.size
    const percentage = Math.round((savings / image.originalSize) * 100)
    return { savings, percentage }
  }

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
      const result = await imagesAPI.getAll()
      if (result.success) {
        setImages(result.data.images)
      }
    } catch (error) {
      console.error('Failed to load images:', error)
      useToastStore.getState().error('Failed to load images from library')
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
        
        // Show optimization info if available
        const savingsInfo = getSavingsInfo(result.data)
        let message = `Image uploaded: ${file.name}`
        if (savingsInfo) {
          message += ` • Optimized to WebP (${savingsInfo.percentage}% smaller)`
        }
        useToastStore.getState().success(message)
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
      let totalSavings = 0
      for (const file of files) {
        const result = await imagesAPI.upload(file)
        if (result.success) {
          addImage(result.data)
          successCount++
          // Track optimization savings
          if (result.data.originalSize && result.data.size) {
            totalSavings += (result.data.originalSize - result.data.size)
          }
        }
      }
      
      let message = `Successfully uploaded ${successCount} image(s)`
      if (totalSavings > 0) {
        const savingsPercent = Math.round((totalSavings / files.reduce((sum, f) => sum + f.size, 0)) * 100)
        message += ` • Optimized to WebP (saved ${savingsPercent}%)`
      }
      useToastStore.getState().success(message)
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

  // Handle URL input
  const handleUrlSubmit = async (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    try {
      setUploading(true)
      const result = await imagesAPI.addUrl(urlInput, `Image from URL`)
      
      if (result.success) {
        addImage(result.data)
        useToastStore.getState().success('Image added from URL')
        setUrlInput('')
        setShowUrlInput(false)
      }
    } catch (error) {
      console.error('Failed to add image from URL:', error)
      useToastStore.getState().error('Failed to add image from URL. Please check the URL.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId) => {
    setImageToDelete(imageId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!imageToDelete) return

    try {
      await imagesAPI.delete(imageToDelete)
      deleteImage(imageToDelete)
      useToastStore.getState().success('Image deleted successfully')
    } catch (error) {
      console.error('Failed to delete image:', error)
      useToastStore.getState().error('Failed to delete image')
    } finally {
      setShowDeleteDialog(false)
      setImageToDelete(null)
    }
  }

  const handleRename = (image) => {
    setImageToRename(image)
    setNewImageName(image.originalName || image.filename || '')
    setShowRenameModal(true)
  }

  const submitRename = async (e) => {
    e.preventDefault()
    if (!imageToRename || !newImageName.trim()) return

    try {
      const result = await imagesAPI.update(imageToRename.id, {
        originalName: newImageName.trim()
      })
      
      if (result.success) {
        // Update the image in the store
        const updatedImages = images.map(img => 
          img.id === imageToRename.id 
            ? { ...img, originalName: newImageName.trim() }
            : img
        )
        setImages(updatedImages)
        
        useToastStore.getState().success('Image renamed successfully')
        setShowRenameModal(false)
        setImageToRename(null)
        setNewImageName('')
      }
    } catch (error) {
      console.error('Failed to rename image:', error)
      useToastStore.getState().error('Failed to rename image')
    }
  }

  const handleAssignToSlot = async (image) => {
    setSelectedImage(image)
    setSlotNumber('')
    setShowAssignModal(true)
  }

  const submitAssignToSlot = async (e) => {
    e.preventDefault()
    if (!slotNumber || !selectedImage) return

    try {
      await slotsAPI.update(slotNumber, {
        imageId: selectedImage.id,
        imageUrl: selectedImage.url
      })
      websocketService.updateSlot(slotNumber, selectedImage.url, selectedImage.id)
      useToastStore.getState().success(`Image assigned to Slot ${slotNumber}`)
      setShowAssignModal(false)
      setSelectedImage(null)
      setSlotNumber('')
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

            {/* Add URL Button */}
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
              title="Add image by URL"
            >
              <LinkIcon className="w-5 h-5" />
              <span>Add URL</span>
            </button>

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

          {/* URL Input Form */}
          {showUrlInput && (
            <form onSubmit={handleUrlSubmit} className="mt-4 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                disabled={uploading}
              />
              <button
                type="submit"
                disabled={uploading || !urlInput.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput('')
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </form>
          )}

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
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      {image.width} × {image.height}
                    </p>
                    {image.mimeType === 'image/webp' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                        WebP
                      </span>
                    )}
                  </div>
                  {image.size && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatFileSize(image.size)}
                      {getSavingsInfo(image) && (
                        <span className="text-green-600 ml-1">
                          (↓{getSavingsInfo(image).percentage}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Action Buttons (on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRename(image)
                  }}
                  className="absolute top-2 left-2 p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Rename image"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button (on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id)
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Delete image"
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

      {/* Assign to Slot Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedImage(null)
          setSlotNumber('')
        }}
        title="Assign to Slot"
      >
        <form onSubmit={submitAssignToSlot} className="space-y-4">
          <div>
            <label htmlFor="slotNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Slot Number
            </label>
            <input
              id="slotNumber"
              type="number"
              min="1"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              placeholder="Enter slot number (e.g., 1, 2, 3...)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              required
            />
          </div>

          {selectedImage && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Image to assign:</p>
              <div className="flex items-center space-x-3">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.originalName}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedImage.originalName || selectedImage.filename}
                    </p>
                    {selectedImage.mimeType === 'image/webp' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium flex-shrink-0">
                        WebP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedImage.width} × {selectedImage.height}
                    {selectedImage.size && ` • ${formatFileSize(selectedImage.size)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAssignModal(false)
                setSelectedImage(null)
                setSlotNumber('')
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!slotNumber}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign to Slot
            </button>
          </div>
        </form>
      </Modal>

      {/* Rename Image Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false)
          setImageToRename(null)
          setNewImageName('')
        }}
        title="Rename Image"
      >
        <form onSubmit={submitRename} className="space-y-4">
          <div>
            <label htmlFor="imageName" className="block text-sm font-medium text-gray-700 mb-1">
              Image Name
            </label>
            <input
              id="imageName"
              type="text"
              value={newImageName}
              onChange={(e) => setNewImageName(e.target.value)}
              placeholder="Enter new image name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              required
            />
          </div>

          {imageToRename && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center space-x-3">
                <img
                  src={imageToRename.url}
                  alt={imageToRename.originalName}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Current name:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {imageToRename.originalName || imageToRename.filename}
                    </p>
                    {imageToRename.mimeType === 'image/webp' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium flex-shrink-0">
                        WebP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {imageToRename.width} × {imageToRename.height}
                    {imageToRename.size && ` • ${formatFileSize(imageToRename.size)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowRenameModal(false)
                setImageToRename(null)
                setNewImageName('')
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newImageName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Rename
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setImageToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default Library
