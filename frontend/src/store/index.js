import { create } from 'zustand'

const useStore = create((set, get) => ({
  // Slots state
  slots: {},
  
  // Scenes
  scenes: [],
  currentScene: null,
  
  // Images library
  images: [],
  
  // Connection status
  isConnected: false,
  
  // Loading states
  isLoading: false,
  
  // Actions
  setSlot: (slotId, data) => set((state) => ({
    slots: {
      ...state.slots,
      [slotId]: data
    }
  })),
  
  setSlots: (slots) => set({ slots }),
  
  clearSlot: (slotId) => set((state) => ({
    slots: {
      ...state.slots,
      [slotId]: { imageId: null, imageUrl: null, updatedAt: null }
    }
  })),
  
  setScenes: (scenes) => set({ scenes }),
  
  addScene: (scene) => set((state) => ({
    scenes: [...state.scenes, scene]
  })),
  
  updateScene: (sceneId, data) => set((state) => ({
    scenes: state.scenes.map(s => s.id === sceneId ? { ...s, ...data } : s)
  })),
  
  deleteScene: (sceneId) => set((state) => ({
    scenes: state.scenes.filter(s => s.id !== sceneId)
  })),
  
  setCurrentScene: (sceneId) => set({ currentScene: sceneId }),
  
  setImages: (images) => set({ images }),
  
  addImage: (image) => set((state) => ({
    images: [...state.images, image]
  })),
  
  deleteImage: (imageId) => set((state) => ({
    images: state.images.filter(img => img.id !== imageId)
  })),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setLoading: (isLoading) => set({ isLoading }),
}))

export default useStore
