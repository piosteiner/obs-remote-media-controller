import { playerAPI } from './api'
import websocketService from './websocket'
import useStore from '../store'
import useToastStore from '../store/toast'

// Position on the shared timeline right now (seconds)
export function expectedPosition(state) {
  if (!state?.current) return 0
  const elapsed = state.playing ? (websocketService.serverNow() - state.updatedAt) / 1000 : 0
  const position = Math.max(0, state.position + elapsed)
  return state.current.duration ? Math.min(position, state.current.duration) : position
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export const thumbnailFor = (videoId) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`

// Run a player API call and apply the returned state right away
// (the socket broadcast follows, but this keeps the clicking device snappy)
export async function playerAction(call, errorMessage = 'Player action failed') {
  try {
    const result = await call(playerAPI)
    if (result?.success) useStore.getState().setPlayer(result.data)
    return result
  } catch (error) {
    useToastStore.getState().error(error?.error?.message || errorMessage)
    return null
  }
}

// Load the YouTube IFrame API once
let apiPromise = null
export function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    })
  }
  return apiPromise
}
