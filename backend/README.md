# OBS Remote Media Controller - Backend

A high-performance Node.js backend server for OBS Remote Media Controller with REST API, WebSocket support, automatic WebP conversion, and comprehensive image management.

## 🚀 Features

- **REST API** for slots, scenes, and image management
- **WebSocket** real-time updates with Socket.io
- **Automatic WebP Conversion** - All uploaded images optimized for 25-50% size reduction
- **File Upload** support with Multer (PNG, JPG, JPEG, GIF → WebP)
- **CORS** enabled for frontend integration
- **Persistent Storage** with JSON-based data persistence
- **PM2 Process Management** with auto-restart and boot startup
- **Nginx Integration** for production deployment

## 📦 Quick Start

### Installation
```bash
# Clone and install dependencies
git clone https://github.com/piosteiner/obs-remote-media-controller.git
cd obs-remote-media-controller/backend
npm install

# Setup environment
cp .env.example .env
nano .env  # Configure your settings
```

### Running
```bash
# Development mode
npm run dev

# Production with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on boot
```

### Quick Test
```bash
# Health check
curl http://localhost:3003/api/health

# Get all slots
curl http://localhost:3003/api/slots
```

## 📡 API Reference

### Base URL
- **Development**: `http://localhost:3003/api`
- **Production**: `https://api.piogino.ch/obs/api`

### 🔧 Health & Status
- `GET /api/health` - Server health status

### 🎰 Slots Management
- `GET /api/slots` - Get all slots
- `GET /api/slots/:slotId` - Get single slot
- `PUT /api/slots/:slotId` - Update slot
- `DELETE /api/slots/:slotId` - Clear slot

**Update Slot Example:**
```bash
curl -X PUT http://localhost:3003/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageId": 123, "imageUrl": "https://example.com/image.webp"}'
```

### 📸 Images Management (with Automatic WebP Conversion)

- `GET /api/images` - Get all images
- `POST /api/images/upload` - Upload image (auto-converts to WebP)
- `POST /api/images/url` - Add image by URL
- `PUT /api/images/:id` - Rename/update image
- `DELETE /api/images/:id` - Delete image

**Image Upload with WebP Conversion:**
```bash
# Upload PNG/JPG/GIF → Automatically converted to WebP
curl -X POST http://localhost:3003/api/images/upload \
  -F "image=@/path/to/image.png"

# Response includes size savings
{
  "success": true,
  "data": {
    "id": 1760547880141,
    "filename": "converted_image.webp",
    "originalName": "image.png",
    "url": "https://api.piogino.ch/obs/uploads/converted_image.webp",
    "type": "uploaded",
    "mimeType": "image/webp",
    "size": 45320,
    "originalSize": 89640,  // 49% size reduction!
    "createdAt": "2025-10-15T17:04:40.141Z"
  }
}
```

**Add Image by URL:**
```bash
curl -X POST http://localhost:3003/api/images/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/image.jpg", "name": "My Image"}'
```

**Rename Image:**
```bash
curl -X PUT http://localhost:3003/api/images/123 \
  -H "Content-Type: application/json" \
  -d '{"originalName": "New Image Name"}'
```

### 🎬 Scenes Management
- `GET /api/scenes` - Get all scenes
- `GET /api/scenes/:id` - Get single scene
- `POST /api/scenes` - Create scene
- `PUT /api/scenes/:id` - Update scene
- `DELETE /api/scenes/:id` - Delete scene
- `POST /api/scenes/:id/load` - Load scene (apply to all slots)

**Create Scene Example:**
```bash
curl -X POST http://localhost:3003/api/scenes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Setup",
    "description": "My gaming scene",
    "slots": {
      "1": {"imageId": 123, "imageUrl": "https://example.com/bg.webp"},
      "2": {"imageId": 456, "imageUrl": "https://example.com/overlay.webp"}
    }
  }'
```

## 🔌 WebSocket Events

### Connection
- **URL**: `ws://localhost:3003` (dev) or `wss://api.piogino.ch/obs` (prod)
- **Library**: Socket.io

### Client → Server Events
```javascript
// Update a slot
socket.emit('slot:update', {
  slot: "1",
  imageUrl: "https://example.com/image.webp",
  imageId: 123
});

// Clear a slot
socket.emit('slot:clear', { slot: "1" });

// Load a scene
socket.emit('scene:load', { sceneId: 123 });

// Keep-alive
socket.emit('ping');
```

### Server → Client Events
```javascript
// Connection established
socket.on('connection:status', (data) => {
  console.log('Connected:', data);
});

// Slots state update
socket.on('slots:state', (slots) => {
  console.log('All slots:', slots);
});

// Slot updated
socket.on('slot:updated', (data) => {
  console.log('Slot updated:', data);
});

// Scene loaded
socket.on('scene:loaded', (scene) => {
  console.log('Scene loaded:', scene);
});
```

## 🎯 Frontend Integration

### JavaScript Examples

**Upload Image with WebP Conversion:**
```javascript
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    console.log(`Size optimized: ${result.data.originalSize} → ${result.data.size} bytes`);
    return result.data;
  }
}
```

**WebSocket Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003');

socket.on('connect', () => {
  console.log('Connected to backend');
});

socket.on('slots:state', (slots) => {
  updateSlotsUI(slots);
});
```

**Complete CRUD Operations:**
```javascript
// Load images library
const images = await fetch('/api/images').then(r => r.json());

// Rename image
await fetch(`/api/images/${imageId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ originalName: 'New Name' })
});

// Delete image
await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
```

## ⚙️ Configuration

### Environment Variables (`.env`)
```env
NODE_ENV=development
PORT=3003
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_ORIGINS=http://localhost:5173,https://obs-media-control.piogino.ch
API_BASE_URL=https://api.piogino.ch/obs  # For WebP URL generation
DATABASE_PATH=./data
```

### PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'obs-remote-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

## 🚀 Production Deployment

### PM2 Process Management
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Enable auto-start on boot
pm2 startup
pm2 save

# Monitor
pm2 list
pm2 logs obs-remote-backend
pm2 monit
```

### Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl;
    server_name api.piogino.ch;
    
    # SSL configuration...
    
    location /obs/ {
        proxy_pass http://127.0.0.1:3003/;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload support
        client_max_body_size 10M;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://obs-media-control.piogino.ch" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }
    
    # Serve uploaded images with caching
    location /obs/uploads/ {
        alias /var/www/obs-remote-media-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📁 Project Structure

```
/var/www/obs-remote-media-backend/
├── src/
│   ├── server.js                    # Main entry point
│   ├── routes/
│   │   ├── api.js                  # Main router
│   │   ├── slots.js                # Slots CRUD operations
│   │   ├── scenes.js               # Scenes CRUD operations
│   │   └── images.js               # Images CRUD + WebP conversion
│   ├── services/
│   │   ├── storage.js              # JSON-based data persistence
│   │   └── websocketService.js     # WebSocket event handling
│   └── middleware/
│       └── errorHandler.js         # Global error handling
├── data/
│   ├── slots.json                  # Slots data
│   ├── scenes.json                 # Scenes data
│   └── images.json                 # Images metadata
├── uploads/                        # WebP converted images
├── logs/                           # PM2 logs
├── .env                            # Environment configuration
├── ecosystem.config.js             # PM2 configuration
├── package.json
└── README.md
```

## 🔧 WebP Conversion Details

### Automatic Optimization
- **Input Formats**: PNG, JPG, JPEG, GIF
- **Output Format**: Always WebP
- **Quality**: 85% (configurable via sharp)
- **Size Reduction**: Typically 25-50% smaller
- **Processing**: Automatic on upload, no user action required

### Performance Benefits
- **OBS Studio**: Faster image loading and scene switching
- **Streaming**: Reduced bandwidth usage
- **Storage**: Less disk space required
- **Network**: Faster image transfers

### Example Size Reductions
```
Original PNG: 89.6 KB → WebP: 45.3 KB (49% reduction)
Original JPG: 120.0 KB → WebP: 72.0 KB (40% reduction)
Original GIF: 256.0 KB → WebP: 128.0 KB (50% reduction)
```

## � Troubleshooting

### Server Issues
```bash
# Check server status
pm2 list
pm2 logs obs-remote-backend --lines 50

# Restart server
pm2 restart obs-remote-backend

# Check port availability
netstat -tlnp | grep 3003
```

### API Issues
```bash
# Test health endpoint
curl http://localhost:3003/api/health

# Check CORS configuration
curl -H "Origin: https://obs-media-control.piogino.ch" \
     -H "Content-Type: application/json" \
     http://localhost:3003/api/health
```

### Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/
chmod 755 uploads/

# Test upload with curl
curl -X POST http://localhost:3003/api/images/upload \
     -F "image=@test.png"
```

### WebSocket Issues
```javascript
// Test WebSocket connection
const socket = io('http://localhost:3003', {
  transports: ['websocket', 'polling']
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});
```

## 📊 Current Status

✅ **All Systems Operational**
- Server running on port 3003
- REST API endpoints functional
- WebSocket server ready
- WebP conversion active
- File upload configured (10MB limit)
- PM2 auto-restart enabled
- System boot auto-start configured
- CORS configured for frontend
- Nginx reverse proxy configured
- SSL/TLS enabled in production

## 🔗 Related Links

- **Frontend Repository**: https://github.com/piosteiner/obs-remote-media-controller
- **Production API**: https://api.piogino.ch/obs/api
- **Frontend Demo**: https://obs-media-control.piogino.ch

## 📝 License

MIT

## 👤 Author

Pio Steiner - [@piosteiner](https://github.com/piosteiner)

---

**Ready for production use with automatic WebP optimization!** 🚀
