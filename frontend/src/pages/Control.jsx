import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Trash2, Link as LinkIcon, Image as ImageIcon, Layers, Plus, Play, Camera } from 'lucide-react'
import websocketService from '../services/websocket'
import { slotsAPI, scenesAPI } from '../services/api'
import useStore from '../store'
import useToastStore from '../store/toast'
import Header from '../components/common/Header'
import ConnectionStatus from '../components/common/ConnectionStatus'
import SlotControl from '../components/control/SlotControl'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'

/**
 * Control Panel Page - iPad-optimized interface
 * Main control interface for managing slots and quick scene switching
 */
function Control() {
  const slots = useStore(state => state.slots)
  const setSlots = useStore(state => state.setSlots)
  const scenes = useStore(state => state.scenes)
  const setScenes = useStore(state => state.setScenes)
  const addScene = useStore(state => state.addScene)
  const deleteScene = useStore(state => state.deleteScene)
  const currentScene = useStore(state => state.currentScene)
  const setCurrentScene = useStore(state => state.setCurrentScene)
  const isConnected = useStore(state => state.isConnected)
  
  const [numberOfSlots, setNumberOfSlots] = useState(3)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sceneToDelete, setSceneToDelete] = useState(null)
  const [newSceneName, setNewSceneName] = useState('')
  const [newSceneDescription, setNewSceneDescription] = useState('')

  // Initialize: Connect WebSocket and fetch data
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true)
        
        // Connect WebSocket
        websocketService.connect()
        
        // Fetch initial data
        const [slotsData, scenesData] = await Promise.all([
          slotsAPI.getAll(),
          scenesAPI.getAll(), // Backend is ready!
        ])
        
        if (slotsData.success) {
          setSlots(slotsData.data.slots)
        }
        
        if (scenesData.success) {
          setScenes(scenesData.data.scenes)
        }
        
      } catch (error) {
        console.error('Failed to initialize:', error)
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [])

  // Handle scene load
  const handleLoadScene = async (sceneId) => {
    try {
      // Call REST API to load scene
      await scenesAPI.load(sceneId)
      
      // Backend will broadcast via WebSocket automatically
      setCurrentScene(sceneId)
      
      useToastStore.getState().success('Scene loaded!')
    } catch (error) {
      console.error('Failed to load scene:', error)
      useToastStore.getState().error('Failed to load scene')
    }
  }

  const handleCaptureScene = async (sceneId, sceneName) => {
    try {
      const result = await scenesAPI.capture(sceneId)
      
      if (result.success) {
        const slotCount = result.data.slotsCaptured || Object.keys(result.data.slots || {}).length
        useToastStore.getState().success(
          `Scene "${sceneName}" updated with ${slotCount} slot${slotCount !== 1 ? 's' : ''}!`
        )
        // Reload scenes
        const scenesData = await scenesAPI.getAll()
        if (scenesData.success) {
          setScenes(scenesData.data.scenes)
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Connection Status */}
        <ConnectionStatus isConnected={isConnected} />

        {/* Scene Management */}
        <section className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Scene Presets
            </h2>
            <button
              onClick={handleCreateScene}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Scene</span>
            </button>
          </div>

          {scenes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
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
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {scene.name}
                      </h3>
                      <p className="text-sm text-gray-600">{scene.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
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
        </section>

        {/* Slot Controls */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Slots</h2>
            <Link
              to="/library"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Image Library
            </Link>
          </div>

          <div className="space-y-4">
            {Array.from({ length: numberOfSlots }, (_, i) => i + 1).map((slotId) => (
              <SlotControl
                key={slotId}
                slotId={slotId}
                slotData={slots[slotId] || {}}
              />
            ))}
          </div>

          {/* Add Slot Button */}
          <button
            onClick={() => setNumberOfSlots(n => n + 1)}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Slot
          </button>
        </section>
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

export default Control
