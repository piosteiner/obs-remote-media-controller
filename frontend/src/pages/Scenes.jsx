import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play } from 'lucide-react'
import Header from '../components/common/Header'
import { scenesAPI } from '../services/api'
import websocketService from '../services/websocket'
import useStore from '../store'

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
      // Uncomment when backend is ready
      // const result = await scenesAPI.getAll()
      // if (result.success) {
      //   setScenes(result.data.scenes)
      // }
      
      // Mock data for now
      setScenes([
        { id: 1, name: 'Intro', description: 'Opening scene', slots: { '1': 1 } },
        { id: 2, name: 'Product Demo', description: '3 products', slots: { '1': 2, '2': 3, '3': 4 } },
      ])
    } catch (error) {
      console.error('Failed to load scenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadScene = async (sceneId) => {
    try {
      // await scenesAPI.load(sceneId)
      websocketService.loadScene(sceneId)
    } catch (error) {
      console.error('Failed to load scene:', error)
    }
  }

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('Are you sure you want to delete this scene?')) return

    try {
      // await scenesAPI.delete(sceneId)
      deleteScene(sceneId)
    } catch (error) {
      console.error('Failed to delete scene:', error)
    }
  }

  const handleCreateScene = () => {
    // For now, create a scene from current slots
    const sceneName = prompt('Enter scene name:')
    if (!sceneName) return

    const newScene = {
      id: Date.now(),
      name: sceneName,
      description: 'Created from current slots',
      slots: { ...slots }
    }

    // Mock - would call API in production
    addScene(newScene)
    alert('Scene created! (Backend integration pending)')
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
