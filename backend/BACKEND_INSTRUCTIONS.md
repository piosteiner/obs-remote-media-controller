# Backend Development Instructions

## Overview

The frontend is now complete and waiting for the backend API and WebSocket server. This document provides comprehensive instructions for building the backend.

---

## What the Backend Needs to Provide

### 1. REST API Endpoints
- **Slots Management** - CRUD operations for image slots
- **Scenes Management** - CRUD operations for scene presets  
- **Images Management** - Upload, list, delete images
- **System** - Health check and status endpoints

### 2. WebSocket Server
- Real-time updates for slot changes
- Scene loading broadcasts
- Connection management

### 3. File Storage
- Image upload handling
- File storage in `/uploads` directory
- Serve static files

### 4. Database
- Store scene configurations
- Store image metadata
- Track slot states (optional - can be in-memory)

---

## Technology Stack

```
- Node.js 18+
- Express.js (web framework)
- Socket.io (WebSocket)
- Multer (file uploads)
- SQLite or PostgreSQL (database)
- Sharp (optional - image processing)
```

---

## Project Structure

Create this structure in `backend/`:

```
backend/
├── src/
│   ├── server.js              # Entry point
│   ├── controllers/
│   │   ├── imageController.js
│   │   ├── sceneController.js
│   │   └── slotController.js
│   ├── routes/
│   │   ├── api.js            # Main router
│   │   ├── images.js
│   │   ├── scenes.js
│   │   └── slots.js
│   ├── services/
│   │   ├── websocketService.js
│   │   └── storageService.js
│   ├── middleware/
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── Scene.js
│   │   └── Image.js
│   └── config/
│       └── database.js
├── uploads/                   # Image storage (gitignored)
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## Step-by-Step Implementation

### Step 1: Initialize Project

```bash
cd backend
npm init -y
```

Install dependencies:
```bash
npm install express socket.io cors dotenv multer better-sqlite3
npm install --save-dev nodemon
```

Optional dependencies:
```bash
npm install sharp  # For image processing/thumbnails
```

### Step 2: Create package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

### Step 3: Create .env.example

```env
NODE_ENV=development
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_PATH=./database.sqlite
```

### Step 4: Create Main Server (src/server.js)

```javascript
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const httpServer = createServer(app)

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Socket.io setup
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }
})

// Make io available to routes
app.set('io', io)

// Routes
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)

// WebSocket handling
require('./services/websocketService')(io)

// Error handler
app.use(require('./middleware/errorHandler'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket server ready`)
})
```

### Step 5: Create WebSocket Service (src/services/websocketService.js)

```javascript
// In-memory slot state (or load from database)
const slots = {}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    // Send current slot states on connect
    socket.emit('connection:status', {
      status: 'connected',
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    })

    // Handle slot update
    socket.on('slot:update', (data) => {
      const { slot, imageUrl, imageId } = data
      
      // Update state
      slots[slot] = {
        imageId: imageId || null,
        imageUrl: imageUrl || null,
        updatedAt: new Date().toISOString(),
      }

      // Broadcast to all clients
      io.emit('slot:updated', {
        slot,
        imageId: imageId || null,
        imageUrl: imageUrl || null,
        timestamp: new Date().toISOString(),
      })

      console.log(`Slot ${slot} updated:`, imageUrl)
    })

    // Handle scene load
    socket.on('scene:load', async (data) => {
      const { sceneId } = data
      
      // Load scene from database
      // const scene = await Scene.findById(sceneId)
      
      // Mock scene data
      const scene = {
        id: sceneId,
        name: 'Test Scene',
        slots: {
          '1': { imageUrl: 'https://via.placeholder.com/1920x1080', imageId: 1 },
          '2': { imageUrl: null, imageId: null },
        }
      }

      // Update slots
      Object.entries(scene.slots).forEach(([slotId, slotData]) => {
        slots[slotId] = slotData
      })

      // Broadcast to all clients
      io.emit('scene:loaded', {
        sceneId: scene.id,
        sceneName: scene.name,
        slots: scene.slots,
      })

      console.log(`Scene ${sceneId} loaded`)
    })

    // Handle slot clear
    socket.on('slot:clear', (data) => {
      const { slot } = data
      
      slots[slot] = {
        imageId: null,
        imageUrl: null,
        updatedAt: null,
      }

      io.emit('slot:updated', {
        slot,
        imageId: null,
        imageUrl: null,
        timestamp: new Date().toISOString(),
      })

      console.log(`Slot ${slot} cleared`)
    })

    // Keep-alive
    socket.on('ping', () => {
      socket.emit('pong')
    })

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
    })
  })

  // Export slots state for API routes
  global.slots = slots
}
```

### Step 6: Create API Routes (src/routes/api.js)

```javascript
const express = require('express')
const router = express.Router()

const slotsRoutes = require('./slots')
const scenesRoutes = require('./scenes')
const imagesRoutes = require('./images')

router.use('/slots', slotsRoutes)
router.use('/scenes', scenesRoutes)
router.use('/images', imagesRoutes)

module.exports = router
```

### Step 7: Create Slots Routes (src/routes/slots.js)

```javascript
const express = require('express')
const router = express.Router()

// Get all slots
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      slots: global.slots || {}
    }
  })
})

// Get single slot
router.get('/:slotId', (req, res) => {
  const { slotId } = req.params
  const slotData = global.slots?.[slotId] || {
    imageId: null,
    imageUrl: null,
    updatedAt: null
  }

  res.json({
    success: true,
    data: {
      slot: slotId,
      ...slotData
    }
  })
})

// Update slot
router.put('/:slotId', (req, res) => {
  const { slotId } = req.params
  const { imageId, imageUrl } = req.body

  const slotData = {
    imageId: imageId || null,
    imageUrl: imageUrl || null,
    updatedAt: new Date().toISOString()
  }

  global.slots = global.slots || {}
  global.slots[slotId] = slotData

  // Broadcast via WebSocket
  const io = req.app.get('io')
  io.emit('slot:updated', {
    slot: slotId,
    ...slotData,
    timestamp: slotData.updatedAt
  })

  res.json({
    success: true,
    data: {
      slot: slotId,
      ...slotData
    }
  })
})

// Clear slot
router.delete('/:slotId', (req, res) => {
  const { slotId } = req.params

  global.slots = global.slots || {}
  global.slots[slotId] = {
    imageId: null,
    imageUrl: null,
    updatedAt: null
  }

  // Broadcast via WebSocket
  const io = req.app.get('io')
  io.emit('slot:updated', {
    slot: slotId,
    imageId: null,
    imageUrl: null,
    timestamp: new Date().toISOString()
  })

  res.json({
    success: true,
    message: 'Slot cleared',
    data: {
      slot: slotId,
      imageId: null,
      imageUrl: null
    }
  })
})

module.exports = router
```

### Step 8: Create Images Routes (src/routes/images.js)

```javascript
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads')
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error)

// Multer configuration
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname)
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.'))
    }
  }
})

// In-memory image storage (replace with database in production)
const images = []

// Get all images
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { images }
  })
})

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded' }
    })
  }

  const imageData = {
    id: Date.now(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    type: 'uploaded',
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date().toISOString()
  }

  images.push(imageData)

  res.status(201).json({
    success: true,
    data: imageData
  })
})

// Add image by URL
router.post('/url', (req, res) => {
  const { url, name } = req.body

  if (!url) {
    return res.status(400).json({
      success: false,
      error: { message: 'URL is required' }
    })
  }

  const imageData = {
    id: Date.now(),
    url,
    originalName: name || 'External Image',
    type: 'url',
    createdAt: new Date().toISOString()
  }

  images.push(imageData)

  res.status(201).json({
    success: true,
    data: imageData
  })
})

// Delete image
router.delete('/:id', async (req, res) => {
  const imageId = parseInt(req.params.id)
  const imageIndex = images.findIndex(img => img.id === imageId)

  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Image not found' }
    })
  }

  const image = images[imageIndex]

  // Delete file if it's an uploaded image
  if (image.type === 'uploaded' && image.filename) {
    try {
      await fs.unlink(path.join(uploadsDir, image.filename))
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  images.splice(imageIndex, 1)

  res.json({
    success: true,
    message: 'Image deleted successfully'
  })
})

module.exports = router
```

### Step 9: Create Scenes Routes (src/routes/scenes.js)

```javascript
const express = require('express')
const router = express.Router()

// In-memory scene storage (replace with database in production)
const scenes = []

// Get all scenes
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { scenes }
  })
})

// Get single scene
router.get('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id)
  const scene = scenes.find(s => s.id === sceneId)

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    })
  }

  res.json({
    success: true,
    data: scene
  })
})

// Create scene
router.post('/', (req, res) => {
  const { name, description, slots } = req.body

  if (!name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene name is required' }
    })
  }

  const scene = {
    id: Date.now(),
    name,
    description: description || '',
    slots: slots || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  scenes.push(scene)

  res.status(201).json({
    success: true,
    data: scene
  })
})

// Update scene
router.put('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id)
  const sceneIndex = scenes.findIndex(s => s.id === sceneId)

  if (sceneIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    })
  }

  const { name, description, slots } = req.body

  scenes[sceneIndex] = {
    ...scenes[sceneIndex],
    name: name || scenes[sceneIndex].name,
    description: description !== undefined ? description : scenes[sceneIndex].description,
    slots: slots !== undefined ? slots : scenes[sceneIndex].slots,
    updatedAt: new Date().toISOString()
  }

  res.json({
    success: true,
    data: scenes[sceneIndex]
  })
})

// Delete scene
router.delete('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id)
  const sceneIndex = scenes.findIndex(s => s.id === sceneId)

  if (sceneIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    })
  }

  scenes.splice(sceneIndex, 1)

  res.json({
    success: true,
    message: 'Scene deleted successfully'
  })
})

// Load scene (apply to slots)
router.post('/:id/load', (req, res) => {
  const sceneId = parseInt(req.params.id)
  const scene = scenes.find(s => s.id === sceneId)

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    })
  }

  // Update global slots
  global.slots = global.slots || {}
  Object.entries(scene.slots).forEach(([slotId, slotData]) => {
    global.slots[slotId] = slotData
  })

  // Broadcast via WebSocket
  const io = req.app.get('io')
  io.emit('scene:loaded', {
    sceneId: scene.id,
    sceneName: scene.name,
    slots: scene.slots
  })

  res.json({
    success: true,
    message: 'Scene loaded',
    data: {
      sceneId: scene.id,
      sceneName: scene.name,
      slotsUpdated: Object.keys(scene.slots).length
    }
  })
})

module.exports = router
```

### Step 10: Create Error Handler (src/middleware/errorHandler.js)

```javascript
module.exports = (err, req, res, next) => {
  console.error(err.stack)

  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}
```

### Step 11: Create uploads/.gitkeep

```bash
mkdir uploads
touch uploads/.gitkeep
```

---

## Testing the Backend

### 1. Start the server:
```bash
npm run dev
```

### 2. Test with cURL:

**Health check:**
```bash
curl http://localhost:3000/api/health
```

**Get slots:**
```bash
curl http://localhost:3000/api/slots
```

**Upload image:**
```bash
curl -X POST http://localhost:3000/api/images/upload -F "image=@/path/to/image.png"
```

**Update slot:**
```bash
curl -X PUT http://localhost:3000/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/1920x1080"}'
```

---

## Integration with Frontend

Once the backend is running:

1. Start frontend: `cd frontend && npm run dev`
2. Navigate to `http://localhost:5173/control`
3. Try uploading an image
4. Open `http://localhost:5173/display?slot=1` in another tab
5. Watch it update in real-time!

---

## Deployment Checklist

- [ ] Set up PostgreSQL database (if using)
- [ ] Configure environment variables
- [ ] Set up PM2 for process management
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Configure firewall
- [ ] Test WebSocket connections
- [ ] Test file uploads
- [ ] Monitor logs

---

## Optional Enhancements

1. **Database Integration:**
   - Replace in-memory storage with SQLite/PostgreSQL
   - Add migration scripts
   - Implement proper data persistence

2. **Image Processing:**
   - Generate thumbnails with Sharp
   - Compress uploaded images
   - Validate image dimensions

3. **Authentication:**
   - Add JWT authentication
   - User management
   - Role-based access control

4. **Performance:**
   - Add Redis for caching
   - Implement rate limiting
   - Add request logging

---

**Ready to build! The frontend is waiting for these endpoints.** 🚀
