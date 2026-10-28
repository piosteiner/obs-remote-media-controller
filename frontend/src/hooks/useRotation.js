import { useEffect, useState } from 'react'
import websocketService from '../services/websocket'

// Which of a slot's rotating images is on (the same as backend/src/services/slotState.js rotationIndex): from the
// rotation's start and its interval, on the server's clock — so the display and every controller agree, and a
// reloaded display carries on where it was
export function rotationIndex(rotation, now) {
  if (!rotation?.active || !rotation.items?.length || !rotation.startedAt) return 0
  return Math.floor(Math.max(0, now - rotation.startedAt) / (rotation.intervalSec * 1000)) % rotation.items.length
}

// The slot's image now: a rotating slot's current one (re-rendering when the next one is due), else its image.
// → { url, index (in the rotation, or -1), rotating }
export default function useRotation(slotData = {}) {
  const { rotation, imageUrl } = slotData
  const active = !!(rotation?.active && rotation.items?.length > 1 && rotation.startedAt)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!active) return undefined
    const period = rotation.intervalSec * 1000
    let timer
    const schedule = () => {
      const now = websocketService.serverNow()
      const wait = period - ((now - rotation.startedAt) % period) + 20
      timer = setTimeout(() => { setTick((t) => t + 1); schedule() }, wait)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [active, rotation?.startedAt, rotation?.intervalSec, rotation?.items?.length])

  if (!active) return { url: imageUrl || null, index: -1, rotating: false }
  const index = rotationIndex(rotation, websocketService.serverNow())
  return { url: rotation.items[index]?.url || imageUrl || null, index, rotating: true }
}
