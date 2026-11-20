import { Wifi, WifiOff } from 'lucide-react'

function ConnectionStatus({ isConnected }) {
  if (isConnected) {
    return (
      <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3">
        <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-200">Connected</p>
          <p className="text-xs text-green-700 dark:text-green-300">Real-time updates active</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3">
      <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-900 dark:text-red-200">Disconnected</p>
        <p className="text-xs text-red-700 dark:text-red-300">Attempting to reconnect...</p>
      </div>
    </div>
  )
}

export default ConnectionStatus
