// The demo's storage (demo/mode.js): IndexedDB in this browser — the state (slots, scenes, library, player) under a
// few keys, and the pictures added to the library as files. Nothing of it leaves the browser.
const NAME = 'obs-demo'
let opened = null

function open() {
  opened ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, 1)
    req.onupgradeneeded = () => { req.result.createObjectStore('state'); req.result.createObjectStore('files') }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return opened
}

async function run(store, mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = fn(tx.objectStore(store))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const getState = (key) => run('state', 'readonly', (s) => s.get(key))
export const setState = (key, value) => run('state', 'readwrite', (s) => s.put(value, key))
export const getFile = (id) => run('files', 'readonly', (s) => s.get(id))
export const putFile = (id, blob) => run('files', 'readwrite', (s) => s.put(blob, id))
export const deleteFile = (id) => run('files', 'readwrite', (s) => s.delete(id))
export const allFileIds = () => run('files', 'readonly', (s) => s.getAllKeys())

// everything of the demo gone (the "Delete demo data" button)
export async function wipe() {
  const db = await open()
  db.close(); opened = null
  await new Promise((resolve) => { const r = indexedDB.deleteDatabase(NAME); r.onsuccess = r.onerror = r.onblocked = () => resolve() })
}
