import { create } from 'zustand'

/**
 * Toast Store
 * Manages toast notifications throughout the app
 */
const useToastStore = create((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      message: '',
      duration: 3000,
      ...toast,
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }))
      }, newToast.duration)
    }
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },
  
  // Helper methods
  success: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'success', message, duration })
  },
  
  error: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'error', message, duration })
  },
  
  warning: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'warning', message, duration })
  },
  
  info: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'info', message, duration })
  },
}))

export default useToastStore
