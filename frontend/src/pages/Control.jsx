import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Trash2, Link as LinkIcon, Image as ImageIcon, Layers } from 'lucide-react'
import websocketService from '../services/websocket'
import { slotsAPI, scenesAPI } from '../services/api'
import useStore from '../store'
import useToastStore from '../store/toast'
import Header from '../components/common/Header'
import ConnectionStatus from '../components/common/ConnectionStatus'
import SlotControl from '../components/control/SlotControl'

/**
 * Control Panel Page - iPad-optimized interface
 * Main control interface for managing slots and quick scene switching
 */
function Control() {
  const slots = useStore(state => state.slots)
  const setSlots = useStore(state => state.setSlots)
  const scenes = useStore(state => state.scenes)
  const setScenes = useStore(state => state.setScenes)
  const currentScene = useStore(state => state.currentScene)
  const setCurrentScene = useStore(state => state.setCurrentScene)
  const isConnected = useStore(state => state.isConnected)
  
  const [numberOfSlots, setNumberOfSlots] = useState(3)
  const [loading, setLoading] = useState(true)

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

        {/* Quick Scene Switch */}
        {scenes.length > 0 && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Quick Scene Switch
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleLoadScene(scene.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentScene === scene.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {scene.name}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Slot Controls */}
        <section className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Slots</h2>
            <div className="flex items-center space-x-2">
              <Link
                to="/scenes"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Manage Scenes
              </Link>
              <Link
                to="/library"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Image Library
              </Link>
            </div>
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
    </div>
  )
}

export default Control
