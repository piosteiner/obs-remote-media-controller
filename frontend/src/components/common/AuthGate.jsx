import { useState, useEffect } from 'react'
import { MonitorPlay, KeyRound } from 'lucide-react'
import { systemAPI } from '../../services/api'
import { getApiKey, setApiKey } from '../../services/auth'
import websocketService from '../../services/websocket'

/**
 * AuthGate Component
 * Asks for the admin key once per browser before showing the control pages
 */
function AuthGate({ children, fallback }) {
  const [hasKey, setHasKey] = useState(() => !!getApiKey())
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const onAuthRequired = () => setHasKey(false)
    const onAuthGranted = () => setHasKey(true)
    window.addEventListener('auth:required', onAuthRequired)
    window.addEventListener('auth:granted', onAuthGranted)

    // A stored key may have been changed on the server; a 401 brings the form back
    const stored = getApiKey()
    if (stored) systemAPI.checkKey(stored).catch(() => {})

    return () => {
      window.removeEventListener('auth:required', onAuthRequired)
      window.removeEventListener('auth:granted', onAuthGranted)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const candidate = key.trim()
    if (!candidate) return

    setChecking(true)
    setError('')
    try {
      await systemAPI.checkKey(candidate)
      setApiKey(candidate)
      setKey('')
      setHasKey(true)
      // Reconnect so the socket presents the new key
      if (websocketService.socket) {
        websocketService.socket.disconnect().connect()
      }
    } catch (err) {
      setError(err?.error?.code === 'UNAUTHORIZED' ? 'Wrong key' : 'Could not reach the server')
    } finally {
      setChecking(false)
    }
  }

  if (hasKey) return children
  // Used where a second key form would be redundant (e.g. the player overlay)
  if (fallback !== undefined) return fallback

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <MonitorPlay className="w-8 h-8 text-primary-600" />
          <span className="font-bold text-xl text-gray-900">OBS Media Controller</span>
        </div>
        <div>
          <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
            Admin key
          </label>
          <input
            id="adminKey"
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-2">Only needed once per browser. OBS display pages work without it.</p>
        </div>
        <button
          type="submit"
          disabled={checking || !key.trim()}
          className="w-full flex items-center justify-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          <span>{checking ? 'Checking...' : 'Unlock'}</span>
        </button>
        <p className="text-xs text-center text-gray-500">
          <a href="/privacy.html" className="hover:text-gray-700 underline">Privacy</a>
        </p>
      </form>
    </div>
  )
}

export default AuthGate
