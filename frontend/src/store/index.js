import { create } from 'zustand'

const useStore = create((set, get) => ({
  // Slots state
  slots: {},
  
  // Scenes
  scenes: [],
  currentScene: null,
  
  // Images library
  images: [],
  
  // Shared YouTube player state (from the server)
  player: null,

  // The slot the keyboard shortcuts work on (components/control/QuickSlots.jsx): the last one used
  activeSlot: 1,
  setActiveSlot: (activeSlot) => set({ activeSlot }),

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

  setPlayer: (player) => set({ player }),
  
  // no image, no rotation — the prepared quick images stay (as on the server)
  clearSlot: (slotId) => set((state) => ({
    slots: {
      ...state.slots,
      [slotId]: { ...state.slots[slotId], imageId: null, imageUrl: null, rotation: null, updatedAt: null }
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
