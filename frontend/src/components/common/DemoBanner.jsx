import { FlaskConical, MonitorPlay, Trash2, LogOut } from 'lucide-react'
import { leaveDemo } from '../../demo/mode'
import { wipe } from '../../demo/db'

/**
 * DemoBanner Component
 * Shown on every page of the demo (demo/mode.js): what it is, the display page to open beside it (another tab,
 * like OBS would show it), deleting what was tried out, and leaving.
 */
function DemoBanner() {
  const removeAll = async () => {
    if (!window.confirm('Delete everything added in the demo (pictures, slots, scenes, player)?')) return
    await wipe()
    window.location.reload()
  }
  const btn = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 border border-amber-300 dark:border-amber-700'
  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm" role="status">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5 font-medium"><FlaskConical className="w-4 h-4" /> Demo</span>
        <span className="flex-1 min-w-[16rem]">Try everything — nothing is sent to the server: pictures, slots and scenes stay in this browser only.</span>
        <a href="/display?slot=1&demo=1" target="_blank" rel="noreferrer" className={btn}><MonitorPlay className="w-4 h-4" /> Open display (slot 1)</a>
        <button type="button" onClick={removeAll} className={btn}><Trash2 className="w-4 h-4" /> Delete demo data</button>
        <button type="button" onClick={leaveDemo} className={btn}><LogOut className="w-4 h-4" /> Leave demo</button>
      </div>
    </div>
  )
}

export default DemoBanner
