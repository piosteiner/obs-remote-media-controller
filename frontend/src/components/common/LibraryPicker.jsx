import { useState, useEffect } from 'react'
import { Search, X, CheckCircle2 } from 'lucide-react'
import { imagesAPI } from '../../services/api'
import Modal from '../common/Modal'

/**
 * LibraryPicker Component
 * Modal for selecting an image from the library
 */
function LibraryPicker({ isOpen, onClose, onSelect }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)

  // Load images when modal opens
  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen])

  const loadImages = async () => {
    try {
      setLoading(true)
      const result = await imagesAPI.getAll()
      
      if (result.success) {
        setImages(result.data.images || [])
      }
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter images based on search
  const filteredImages = images.filter(img =>
    img.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      onClose()
      setSelectedImage(null)
      setSearchTerm('')
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedImage(null)
    setSearchTerm('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Choose from Library"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search images..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Image Grid */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? 'No images match your search' : 'No images in library yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage?.id === image.id
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selected Indicator */}
                  {selectedImage?.id === image.id && (
                    <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Image Name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {image.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Image Info */}
        {selectedImage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedImage.name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedImage}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select Image
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default LibraryPicker
