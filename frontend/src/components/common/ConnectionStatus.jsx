import { Wifi, WifiOff } from 'lucide-react'

function ConnectionStatus({ isConnected }) {
  if (isConnected) {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
        <Wifi className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-900">Connected</p>
          <p className="text-xs text-green-700">Real-time updates active</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
      <WifiOff className="w-5 h-5 text-red-600" />
      <div>
        <p className="text-sm font-medium text-red-900">Disconnected</p>
        <p className="text-xs text-red-700">Attempting to reconnect...</p>
      </div>
    </div>
  )
}

export default ConnectionStatus
