import { AlertTriangle } from 'lucide-react'

/**
 * ConfirmDialog Component - Beautiful confirmation dialog
 * 
 * @param {boolean} isOpen - Whether the dialog is open
 * @param {function} onClose - Callback when dialog is closed
 * @param {function} onConfirm - Callback when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text (default: 'Confirm')
 * @param {string} cancelText - Cancel button text (default: 'Cancel')
 * @param {string} variant - Color variant: 'danger' | 'warning' | 'primary' (default: 'primary')
 */
function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'primary'
}) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  // Color variants
  const variants = {
    danger: {
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    primary: {
      icon: 'text-primary-600',
      button: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
    }
  }

  const style = variants[variant] || variants.primary

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100">
              <AlertTriangle className={`w-6 h-6 ${style.icon}`} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 text-center mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${style.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
