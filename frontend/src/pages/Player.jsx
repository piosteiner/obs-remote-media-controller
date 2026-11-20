import { useEffect, useState } from 'react'
import {
  Play, ListPlus, BookmarkPlus, Trash2, ChevronUp, ChevronDown,
  Repeat, Repeat1, ExternalLink, Square, Youtube
} from 'lucide-react'
import Header from '../components/common/Header'
import MusicLibrary, { IconButton } from '../components/player/MusicLibrary'
import useStore from '../store'
import useToastStore from '../store/toast'
import websocketService from '../services/websocket'
import { playerAPI } from '../services/api'
import { playerAction, thumbnailFor, formatTime } from '../services/player'

const REPEAT_OPTIONS = [
  { mode: 'off', label: 'Off', icon: null },
  { mode: 'all', label: 'Repeat queue', icon: Repeat },
  { mode: 'one', label: 'Repeat video', icon: Repeat1 },
]

/**
 * Player Page - Shared YouTube player: current link, queue, the library (the Grimoire's music section:
 * components/player/MusicLibrary.jsx), repeat.
 * Playback itself happens in the overlay in the bottom-right corner.
 */
function Player() {
  const player = useStore(state => state.player)
  const setPlayer = useStore(state => state.setPlayer)

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [justSaved, setJustSaved] = useState(null) // opened in the library's editor: sound, setting and mood

  useEffect(() => {
    websocketService.connect()
    playerAPI.get().then((result) => {
      if (result?.success) setPlayer(result.data)
    }).catch(() => {
      useToastStore.getState().error('Failed to load player')
    })
  }, [])

  // Add-link form actions; the link is cleared after a successful action
  const submitLink = async (call, successMessage) => {
    if (!url.trim()) return null
    setBusy(true)
    const result = await playerAction(call, 'Not a valid YouTube link')
    setBusy(false)
    if (result?.success) {
      setUrl('')
      setName('')
      useToastStore.getState().success(successMessage)
    }
    return result
  }

  const current = player?.current
  const queue = player?.queue || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">YouTube Player</h1>
          <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
            Plays in sync on every open device. Controls are in the player bottom-right.
          </p>
        </div>

        {/* Now playing + repeat */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {current ? (
              <img src={thumbnailFor(current.videoId)} alt="" className="w-full sm:w-48 aspect-video object-cover rounded" />
            ) : (
              <div className="w-full sm:w-48 aspect-video rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Youtube className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {current ? (player.playing ? 'Now playing' : 'Paused') : 'Nothing playing'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {current ? current.title : 'Add a link below to start'}
                </p>
                {current && (
                  <a
                    href={`https://www.youtube.com/watch?v=${current.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Open on YouTube <ExternalLink className="w-3 h-3" />
                    {current.duration ? <span className="text-gray-500 dark:text-gray-400 ml-1">({formatTime(current.duration)})</span> : null}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-1">Repeat:</span>
                {REPEAT_OPTIONS.map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => playerAction(api => api.setRepeat(mode))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                      (player?.repeat || 'off') === mode
                        ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
                {current && (
                  <button
                    onClick={() => playerAction(api => api.stop())}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 sm:ml-auto"
                    title="Stop and close the player on all devices"
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Add link */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add a YouTube link</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitLink(api => api.load(url, name), 'Playing now')
            }}
            className="flex flex-col lg:flex-row gap-2"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="lg:w-56 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy || !url.trim()}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> Play now
              </button>
              <button
                type="button"
                disabled={busy || !url.trim()}
                onClick={() => submitLink(api => api.queueAdd(url, name), current ? 'Added to queue' : 'Playing now')}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                <ListPlus className="w-4 h-4" /> Queue
              </button>
              <button
                type="button"
                disabled={busy || !url.trim()}
                onClick={async () => { const r = await submitLink(api => api.save(url, name), 'Saved to the library — now its sound, setting and mood'); if (r?.success) setJustSaved({ ...r.data, at: Date.now() }) }}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <BookmarkPlus className="w-4 h-4" /> Save
              </button>
            </div>
          </form>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Queue: the narrow column — the library has far more */}
          <section className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Up next ({queue.length})</h2>
              {queue.length > 0 && (
                <button onClick={() => playerAction(api => api.queueClear())} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                  Clear queue
                </button>
              )}
            </div>
            {queue.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Queue is empty. Use “Queue” on a link to add it.</p>
            ) : (
              <ol className="space-y-2">
                {queue.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="w-5 text-sm text-gray-400 dark:text-gray-500 text-right">{index + 1}</span>
                    <img src={thumbnailFor(item.videoId)} alt="" className="w-16 aspect-video object-cover rounded" />
                    <p className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate" title={item.title}>{item.title}</p>
                    <div className="flex items-center">
                      <IconButton title="Play now" onClick={() => playerAction(api => api.queuePlay(item.id))}><Play className="w-4 h-4" /></IconButton>
                      <IconButton title="Move up" disabled={index === 0} onClick={() => playerAction(api => api.queueMove(item.id, 'up'))}><ChevronUp className="w-4 h-4" /></IconButton>
                      <IconButton title="Move down" disabled={index === queue.length - 1} onClick={() => playerAction(api => api.queueMove(item.id, 'down'))}><ChevronDown className="w-4 h-4" /></IconButton>
                      <IconButton title="Remove from queue" danger onClick={() => playerAction(api => api.queueRemove(item.id))}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="lg:col-span-2">
            <MusicLibrary editRequest={justSaved} />
          </div>
        </div>
      </main>

    </div>
  )
}

export default Player
