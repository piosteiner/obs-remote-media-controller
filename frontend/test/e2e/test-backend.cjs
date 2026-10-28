// The server for the browser tests: backend/src/server.js on port 3113 with its own data and uploads in a fresh
// folder (never the live ones), seeded with a library of six small coloured images. Admin key: test-key.
const fs = require('fs')
const os = require('os')
const path = require('path')
const sharp = require('../../../backend/node_modules/sharp')

const PORT = 3113
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-e2e-'))
const dataDir = path.join(dir, 'data')
const uploadsDir = path.join(dir, 'uploads')
fs.mkdirSync(dataDir, { recursive: true })
fs.mkdirSync(uploadsDir, { recursive: true })

const COLOURS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#16a085']

;(async () => {
  const images = []
  for (const [i, colour] of COLOURS.entries()) {
    const filename = `fixture-${i + 1}.png`
    await sharp({ create: { width: 640, height: 360, channels: 3, background: colour } }).png().toFile(path.join(uploadsDir, filename))
    images.push({
      id: 1000 + i, filename, originalName: `Fixture ${i + 1}`, mimeType: 'image/png', width: 640, height: 360,
      url: `http://localhost:${PORT}/uploads/${filename}`, thumbnailUrl: `http://localhost:${PORT}/uploads/${filename}`,
      createdAt: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
    })
  }
  fs.writeFileSync(path.join(dataDir, 'images.json'), JSON.stringify(images, null, 2))
  fs.writeFileSync(path.join(dataDir, 'slots.json'), '{}')
  fs.writeFileSync(path.join(dataDir, 'scenes.json'), '[]')

  Object.assign(process.env, {
    PORT: String(PORT), OBS_DATA_DIR: dataDir, OBS_UPLOADS_DIR: uploadsDir, ADMIN_API_KEY: 'test-key',
    API_BASE_URL: `http://localhost:${PORT}`, ALLOWED_ORIGINS: 'http://localhost:4175',
  })
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { fs.rmSync(dir, { recursive: true, force: true }); process.exit(0) })
  require('../../../backend/src/server.js')
})()
