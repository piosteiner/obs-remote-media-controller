import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Search } from 'lucide-react'
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
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadImages()
  }, [])

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

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      setUploading(true)
      
      for (const file of files) {
        const result = await imagesAPI.upload(file)
        if (result.success) {
          addImage(result.data)
        }
      }
      
      useToastStore.getState().success(`Successfully uploaded ${files.length} image(s)`)
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
