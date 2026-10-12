import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play, Pause, SkipForward, Repeat, Repeat1, Volume2, VolumeX,
  ChevronDown, ChevronUp, ListVideo, X
} from 'lucide-react'
import useStore from '../../store'
import websocketService from '../../services/websocket'
import { expectedPosition, formatTime, playerAction, loadYouTubeAPI } from '../../services/player'

// YouTube player states
const ENDED = 0, PLAYING = 1, BUFFERING = 3, CUED = 5
const DRIFT_TOLERANCE = 1.0 // seconds before a device is pulled back to the shared timeline
const SYNC_INTERVAL = 1000
const BLOCKED_AFTER_MS = 3000 // not started by then: assume autoplay is blocked
const COLLAPSED_KEY = 'obs-player-collapsed'

const REPEAT_NEXT = { off: 'all', all: 'one', one: 'off' }
const REPEAT_LABEL = { off: 'Repeat off', all: 'Repeat queue', one: 'Repeat this video' }

/**
 * PlayerOverlay Component
 * Shared YouTube player pinned to the bottom-right of every control page.
 * The server owns the timeline; this keeps the local player in step with it.
 */
function PlayerOverlay() {
  const player = useStore(state => state.player)
  const stateRef = useRef(player)
  stateRef.current = player

  const containerRef = useRef(null)
  const ytRef = useRef(null)
  const readyRef = useRef(false)
  const reportedRef = useRef(new Set())
  const stalledSinceRef = useRef(null) // when playback should have started but hasn't

  const [needsUnmute, setNeedsUnmute] = useState(false)
  const [muted, setMuted] = useState(false)
  const [position, setPosition] = useState(0)
  const [dragPosition, setDragPosition] = useState(null)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1' } catch { return false }
  })

  const current = player?.current

  useEffect(() => {
    websocketService.connect()
  }, [])

  // Bring the local YouTube player in line with the shared state
  const sync = () => {
    const state = stateRef.current
    const yt = ytRef.current
    if (!yt || !readyRef.current || !state?.current) return

    const { videoId, sessionId, duration } = state.current
    const expected = expectedPosition(state)
    const loadedId = yt.getVideoData?.()?.video_id

    if (loadedId !== videoId) {
      stalledSinceRef.current = null
      if (state.playing) yt.loadVideoById({ videoId, startSeconds: expected })
      else yt.cueVideoById({ videoId, startSeconds: expected })
      return
    }

    const ytState = yt.getPlayerState()
    const ytDuration = yt.getDuration?.() || 0
    if (!duration && ytDuration > 0 && !reportedRef.current.has(sessionId)) {
      reportedRef.current.add(sessionId)
      websocketService.reportDuration(sessionId, ytDuration)
    }

    if (state.playing) {
      if (ytState === BUFFERING) return
      if (ytState === ENDED || Math.abs(yt.getCurrentTime() - expected) > DRIFT_TOLERANCE) {
        yt.seekTo(expected, true)
      }
      if (ytState !== PLAYING) {
        yt.playVideo()
        // Browsers block autoplay with sound until the user interacts with the
        // page; fall back to muted playback and offer a one-click unmute.
        // (onAutoplayBlocked usually reports this first; this is the backup.)
        // After any click on the page sound is allowed, so a slow start is just loading.
        const interacted = navigator.userActivation?.hasBeenActive
        stalledSinceRef.current ??= Date.now()
        const stalledFor = Date.now() - stalledSinceRef.current
        if (!interacted && stalledFor >= BLOCKED_AFTER_MS && !yt.isMuted()) {
          yt.mute()
          yt.playVideo()
          setMuted(true)
          setNeedsUnmute(true)
        }
      } else {
        stalledSinceRef.current = null
      }
    } else {
      stalledSinceRef.current = null
      if (ytState === PLAYING || ytState === BUFFERING) yt.pauseVideo()
      if (Math.abs(yt.getCurrentTime() - expected) > 0.5) {
        // seekTo would start a cued video, so re-cue at the new spot instead
        if (ytState === CUED) yt.cueVideoById({ videoId, startSeconds: expected })
        else yt.seekTo(expected, true)
      }
    }
  }

  // Create the YouTube player once there is something to play
  useEffect(() => {
    if (!current || ytRef.current) return
    let cancelled = false
    loadYouTubeAPI().then((YT) => {
      if (cancelled || ytRef.current || !containerRef.current) return
      const mount = document.createElement('div')
      containerRef.current.appendChild(mount)
      ytRef.current = new YT.Player(mount, {
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, disablekb: 1, rel: 0, playsinline: 1, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onReady: () => {
            readyRef.current = true
            setMuted(ytRef.current.isMuted())
            sync()
          },
          onStateChange: () => sync(),
          onAutoplayBlocked: () => {
            ytRef.current.mute()
            ytRef.current.playVideo()
            setMuted(true)
            setNeedsUnmute(true)
          }
        }
      })
    })
    return () => { cancelled = true }
  }, [current?.videoId])

  // React to every state change, and re-check regularly against drift
  useEffect(() => {
    sync()
  }, [player])

  useEffect(() => {
    const interval = setInterval(() => {
      sync()
      setPosition(expectedPosition(stateRef.current))
    }, SYNC_INTERVAL / 2)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setPosition(expectedPosition(player))
  }, [player])

  // The overlay unmounts its container when playback is stopped, so drop the
  // player too; a new one is created for the next video
  useEffect(() => {
    if (current || !ytRef.current) return
    ytRef.current.destroy?.()
    ytRef.current = null
    readyRef.current = false
    setNeedsUnmute(false)
  }, [current])

  // Leave room at the bottom of the page so content can scroll out from under the player
  useEffect(() => {
    if (!current) return
    const { paddingBottom, backgroundColor } = document.body.style
    document.body.style.paddingBottom = collapsed ? '120px' : '330px'
    document.body.style.backgroundColor = '#f9fafb' // match the pages' gray-50 below their content
    return () => {
      document.body.style.paddingBottom = paddingBottom
      document.body.style.backgroundColor = backgroundColor
    }
  }, [current, collapsed])

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try { localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1') } catch { /* ignore */ }
      return !value
    })
  }

  const toggleMute = () => {
    const yt = ytRef.current
    if (!yt) return
    if (yt.isMuted()) yt.unMute()
    else yt.mute()
    setMuted(!muted)
    setNeedsUnmute(false)
  }

  const unmute = () => {
    ytRef.current?.unMute()
    ytRef.current?.playVideo()
    setMuted(false)
    setNeedsUnmute(false)
  }

  const commitSeek = () => {
    if (dragPosition == null) return
    const target = dragPosition
    setDragPosition(null)
    playerAction(api => api.seek(target))
  }

  if (!current) return null

  const duration = current.duration || 0
  const shownPosition = dragPosition ?? position
  const queueLength = player.queue?.length || 0
  const RepeatIcon = player.repeat === 'one' ? Repeat1 : Repeat

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] sm:w-80 bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden">
      {/* Video (kept mounted while collapsed so playback continues) */}
      <div className={`relative bg-black ${collapsed ? 'h-0' : 'aspect-video'}`}>
        <div ref={containerRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
        {needsUnmute && !collapsed && (
          <button
            onClick={unmute}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white"
          >
            <VolumeX className="w-8 h-8" />
            <span className="text-sm font-medium">Click to turn on sound</span>
          </button>
        )}
      </div>

      <div className="px-3 pt-2 pb-3 space-y-2">
        {/* Title */}
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm font-medium truncate" title={current.title}>{current.title}</p>
          <Link to="/player" className="p-1 text-gray-400 hover:text-white" title="Queue & saved links">
            <ListVideo className="w-4 h-4" />
          </Link>
          <button onClick={toggleCollapsed} className="p-1 text-gray-400 hover:text-white" title={collapsed ? 'Show video' : 'Hide video'}>
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => playerAction(api => api.stop())}
            className="p-1 text-gray-400 hover:text-white"
            title="Stop and close player for everyone"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 tabular-nums">
          <span>{formatTime(shownPosition)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={1}
            value={Math.min(shownPosition, duration || 1)}
            disabled={!duration}
            onChange={(e) => setDragPosition(Number(e.target.value))}
            onMouseUp={commitSeek}
            onTouchEnd={commitSeek}
            onKeyUp={commitSeek}
            className="flex-1 h-1 accent-red-500 cursor-pointer disabled:cursor-default"
            aria-label="Seek"
          />
          <span>{duration ? formatTime(duration) : '--:--'}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => playerAction(api => (player.playing ? api.pause() : api.play()))}
              className="p-2 rounded-full bg-white text-gray-900 hover:bg-gray-200"
              title={player.playing ? 'Pause for everyone' : 'Play for everyone'}
            >
              {player.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => playerAction(api => api.next())}
              disabled={queueLength === 0}
              className="p-2 text-gray-300 hover:text-white disabled:opacity-30"
              title={queueLength ? `Next (${queueLength} in queue)` : 'Queue is empty'}
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => playerAction(api => api.setRepeat(REPEAT_NEXT[player.repeat] || 'off'))}
              className={`p-2 hover:text-white ${player.repeat === 'off' ? 'text-gray-500' : 'text-red-400'}`}
              title={REPEAT_LABEL[player.repeat] || 'Repeat off'}
            >
              <RepeatIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {queueLength > 0 && <span className="text-[11px] text-gray-400">{queueLength} queued</span>}
            <button onClick={toggleMute} className="p-2 text-gray-300 hover:text-white" title={muted ? 'Unmute on this device' : 'Mute on this device'}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerOverlay
