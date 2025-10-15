import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Camera } from 'lucide-react'
import Header from '../components/common/Header'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { scenesAPI } from '../services/api'
import websocketService from '../services/websocket'
import useStore from '../store'
import useToastStore from '../store/toast'

/**
 * Scenes Page - Manage scene presets
 */
function Scenes() {
  const scenes = useStore(state => state.scenes)
  const setScenes = useStore(state => state.setScenes)
  const addScene = useStore(state => state.addScene)
  const deleteScene = useStore(state => state.deleteScene)
  const slots = useStore(state => state.slots)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sceneToDelete, setSceneToDelete] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newSceneName, setNewSceneName] = useState('')
  const [newSceneDescription, setNewSceneDescription] = useState('')

  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = async () => {
    try {
      setLoading(true)
      
      // Load scenes from backend
      const result = await scenesAPI.getAll()
      if (result.success) {
        setScenes(result.data.scenes)
      }
    } catch (error) {
      console.error('Failed to load scenes:', error)
      useToastStore.getState().error('Failed to load scenes from server')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadScene = async (sceneId) => {
    try {
      // Call REST API to load scene (updates backend state)
      await scenesAPI.load(sceneId)
      
      // WebSocket will broadcast the update to all clients
      // No need to call websocketService.loadScene() separately
      
      useToastStore.getState().success('Scene loaded successfully!')
    } catch (error) {
      console.error('Failed to load scene:', error)
      useToastStore.getState().error('Failed to load scene. Please try again.')
    }
  }

  const handleCaptureScene = async (sceneId, sceneName) => {
    try {
      // Capture current slots to the scene
      const result = await scenesAPI.capture(sceneId)
      
      if (result.success) {
        const slotCount = result.data.slotsCaptured || Object.keys(result.data.slots || {}).length
        useToastStore.getState().success(
          `Scene "${sceneName}" updated with ${slotCount} slot${slotCount !== 1 ? 's' : ''}!`
        )
        // Reload scenes to get updated data
        await loadScenes()
      }
    } catch (error) {
      console.error('Failed to capture scene:', error)
      useToastStore.getState().error('Failed to update scene. Please try again.')
    }
  }

  const handleDeleteScene = async (sceneId) => {
    setSceneToDelete(sceneId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteScene = async () => {
    if (!sceneToDelete) return

    try {
      await scenesAPI.delete(sceneToDelete)
      deleteScene(sceneToDelete)
      useToastStore.getState().success('Scene deleted successfully!')
    } catch (error) {
      console.error('Failed to delete scene:', error)
      useToastStore.getState().error('Failed to delete scene. Please try again.')
    } finally {
      setSceneToDelete(null)
    }
  }

  const handleCreateScene = () => {
    setNewSceneName('')
    setNewSceneDescription('')
    setShowCreateModal(true)
  }

  const submitCreateScene = async () => {
    if (!newSceneName.trim()) {
      useToastStore.getState().warning('Please enter a scene name')
      return
    }

    try {
      // Create scene on backend
      const result = await scenesAPI.create({
        name: newSceneName.trim(),
        description: newSceneDescription.trim() || 'Created from current slots',
        slots: { ...slots }
      })

      if (result.success) {
        addScene(result.data)
        useToastStore.getState().success(`Scene "${newSceneName}" created successfully!`)
        setShowCreateModal(false)
        setNewSceneName('')
        setNewSceneDescription('')
      }
    } catch (error) {
      console.error('Failed to create scene:', error)
      useToastStore.getState().error('Failed to create scene. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scene Presets</h1>
          <button
            onClick={handleCreateScene}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span>Create Scene</span>
          </button>
        </div>

        {scenes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No scenes yet. Create your first scene!</p>
            <button
              onClick={handleCreateScene}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              Create Scene from Current Slots
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {scene.name}
                    </h3>
                    <p className="text-sm text-gray-600">{scene.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteScene(scene.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Slots configured: {Object.keys(scene.slots || {}).length}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCaptureScene(scene.id, scene.name)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    title="Update scene with current slots"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Update</span>
                  </button>
                  <button
                    onClick={() => handleLoadScene(scene.id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    title="Load this scene"
                  >
                    <Play className="w-4 h-4" />
                    <span>Load</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Scene Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Scene"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="sceneName" className="block text-sm font-medium text-gray-700 mb-2">
              Scene Name *
            </label>
            <input
              id="sceneName"
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="e.g., Opening Presentation"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submitCreateScene()
                }
              }}
            />
          </div>

          <div>
            <label htmlFor="sceneDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="sceneDescription"
              value={newSceneDescription}
              onChange={(e) => setNewSceneDescription(e.target.value)}
              placeholder="Describe when to use this scene..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Current slots:</strong> {Object.keys(slots).length} configured
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This scene will save your current slot configuration
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitCreateScene}
              disabled={!newSceneName.trim()}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Scene
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSceneToDelete(null)
        }}
        onConfirm={confirmDeleteScene}
        title="Delete Scene?"
        message="Are you sure you want to delete this scene? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default Scenes
