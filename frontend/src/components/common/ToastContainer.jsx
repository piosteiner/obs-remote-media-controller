import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import useToastStore from '../../store/toast'

/**
 * Toast Component
 * Beautiful notification toasts with auto-dismiss
 */
function Toast({ id, type, message, duration = 3000 }) {
  const removeToast = useToastStore(state => state.removeToast)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 300) // Start exit 300ms before removal

    return () => clearTimeout(exitTimer)
  }, [duration])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const styles = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  }

  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      removeToast(id)
    }, 300) // Wait for animation to complete
  }

  return (
    <div
      className={`flex items-start space-x-3 px-4 py-3 rounded-lg border-l-4 shadow-lg backdrop-blur-sm ${styles[type]} ${
        isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
      style={{
        minWidth: '300px',
        maxWidth: '500px',
      }}
    >
      <div className={iconStyles[type]}>
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * ToastContainer Component
 * Container for all toast notifications
 */
function ToastContainer() {
  const toasts = useToastStore(state => state.toasts)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      <div className="flex flex-col space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  )
}

export default ToastContainer
