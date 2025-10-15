import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play } from 'lucide-react'
import Header from '../components/common/Header'
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
  const [loading, setLoading] = useState(true)

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

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('Are you sure you want to delete this scene?')) return

    try {
      await scenesAPI.delete(sceneId)
      deleteScene(sceneId)
      useToastStore.getState().success('Scene deleted successfully!')
    } catch (error) {
      console.error('Failed to delete scene:', error)
      useToastStore.getState().error('Failed to delete scene. Please try again.')
    }
  }

  const handleCreateScene = async () => {
    const sceneName = prompt('Enter scene name:')
    if (!sceneName) return

    try {
      // Create scene on backend
      const result = await scenesAPI.create({
        name: sceneName,
        description: 'Created from current slots',
        slots: { ...slots }
      })

      if (result.success) {
        addScene(result.data)
        useToastStore.getState().success(`Scene "${sceneName}" created successfully!`)
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

                <button
                  onClick={() => handleLoadScene(scene.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  <Play className="w-4 h-4" />
                  <span>Load Scene</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Scenes
