import { useEffect, useState } from 'react'
import {
  Play, ListPlus, BookmarkPlus, Trash2, Edit2, ChevronUp, ChevronDown,
  Repeat, Repeat1, ExternalLink, Square, Youtube
} from 'lucide-react'
import Header from '../components/common/Header'
import Modal from '../components/common/Modal'
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
 * Player Page - Shared YouTube player: current link, queue, saved links, repeat.
 * Playback itself happens in the overlay in the bottom-right corner.
 */
function Player() {
  const player = useStore(state => state.player)
  const setPlayer = useStore(state => state.setPlayer)

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState(null)
  const [newName, setNewName] = useState('')

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
    if (!url.trim()) return
    setBusy(true)
    const result = await playerAction(call, 'Not a valid YouTube link')
    setBusy(false)
    if (result?.success) {
      setUrl('')
      setName('')
      useToastStore.getState().success(successMessage)
    }
  }

  const submitRename = async (e) => {
    e.preventDefault()
    if (!renaming || !newName.trim()) return
    const result = await playerAction(api => api.rename(renaming.id, newName.trim()))
    if (result?.success) setRenaming(null)
  }

  const current = player?.current
  const queue = player?.queue || []
  const saved = player?.saved || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">YouTube Player</h1>
          <p className="hidden sm:block text-sm text-gray-500">
            Plays in sync on every open device. Controls are in the player bottom-right.
          </p>
        </div>

        {/* Now playing + repeat */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {current ? (
              <img src={thumbnailFor(current.videoId)} alt="" className="w-full sm:w-48 aspect-video object-cover rounded" />
            ) : (
              <div className="w-full sm:w-48 aspect-video rounded bg-gray-100 flex items-center justify-center">
                <Youtube className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {current ? (player.playing ? 'Now playing' : 'Paused') : 'Nothing playing'}
                </p>
                <p className="text-lg font-semibold text-gray-900 truncate">
                  {current ? current.title : 'Add a link below to start'}
                </p>
                {current && (
                  <a
                    href={`https://www.youtube.com/watch?v=${current.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                  >
                    Open on YouTube <ExternalLink className="w-3 h-3" />
                    {current.duration ? <span className="text-gray-500 ml-1">({formatTime(current.duration)})</span> : null}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 mr-1">Repeat:</span>
                {REPEAT_OPTIONS.map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => playerAction(api => api.setRepeat(mode))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                      (player?.repeat || 'off') === mode
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
                {current && (
                  <button
                    onClick={() => playerAction(api => api.stop())}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 sm:ml-auto"
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
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Add a YouTube link</h2>
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="lg:w-56 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                onClick={() => submitLink(api => api.save(url, name), 'Link saved')}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <BookmarkPlus className="w-4 h-4" /> Save
              </button>
            </div>
          </form>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue */}
          <section className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Up next ({queue.length})</h2>
              {queue.length > 0 && (
                <button onClick={() => playerAction(api => api.queueClear())} className="text-sm text-gray-500 hover:text-red-600">
                  Clear queue
                </button>
              )}
            </div>
            {queue.length === 0 ? (
              <p className="text-sm text-gray-500">Queue is empty. Use “Queue” on a link to add it.</p>
            ) : (
              <ol className="space-y-2">
                {queue.map((item, index) => (
                  <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <span className="w-5 text-sm text-gray-400 text-right">{index + 1}</span>
                    <img src={thumbnailFor(item.videoId)} alt="" className="w-20 aspect-video object-cover rounded" />
                    <p className="flex-1 min-w-0 text-sm text-gray-900 truncate" title={item.title}>{item.title}</p>
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

          {/* Saved links */}
          <section className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Saved links ({saved.length})</h2>
            {saved.length === 0 ? (
              <p className="text-sm text-gray-500">No saved links yet. Use “Save” on a link to keep it here.</p>
            ) : (
              <ul className="space-y-2">
                {saved.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <img src={thumbnailFor(item.videoId)} alt="" className="w-20 aspect-video object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={item.name}>{item.name}</p>
                      {item.title !== item.name && (
                        <p className="text-xs text-gray-500 truncate" title={item.title}>{item.title}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <IconButton title="Play now" onClick={() => playerAction(api => api.load(item.videoId, item.title))}><Play className="w-4 h-4" /></IconButton>
                      <IconButton title="Add to queue" onClick={() => playerAction(api => api.queueAdd(item.videoId, item.title))}><ListPlus className="w-4 h-4" /></IconButton>
                      <IconButton title="Rename" onClick={() => { setRenaming(item); setNewName(item.name) }}><Edit2 className="w-4 h-4" /></IconButton>
                      <IconButton title="Delete saved link" danger onClick={() => playerAction(api => api.removeSaved(item.id))}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <Modal isOpen={!!renaming} onClose={() => setRenaming(null)} title="Rename saved link">
        <form onSubmit={submitRename} className="space-y-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setRenaming(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={!newName.trim()} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function IconButton({ title, onClick, disabled, danger, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg text-gray-500 disabled:opacity-30 ${danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-gray-900 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  )
}

export default Player
