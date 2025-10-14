# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBS Remote Media Controller                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Control Layer   │         │  Server Layer    │         │  Display Layer   │
│                  │         │                  │         │                  │
│  - Web UI        │◄───────►│  - REST API      │◄───────►│  - OBS Browser   │
│  - iPad/Phone    │  HTTPS  │  - WebSocket     │WebSocket│    Sources       │
│  - Desktop       │         │  - Business Logic│         │  - Display Pages │
│                  │         │  - Data Storage  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## Component Architecture

### 1. Frontend (Control Panel)

**Purpose:** User interface for managing media and scenes

**Technology:** React + Vite + Tailwind CSS

**Components:**
```
frontend/src/
├── pages/
│   ├── Control.jsx          # Main control interface
│   ├── Display.jsx          # OBS display page
│   └── Scenes.jsx           # Scene management
├── components/
│   ├── control/
│   │   ├── SlotControl      # Individual slot management
│   │   ├── SceneSelector    # Quick scene switching
│   │   └── ImageUploader    # Upload interface
│   ├── library/
│   │   └── ImageLibrary     # Image grid view
│   └── common/
│       ├── Header           # Navigation
│       └── ConnectionStatus # WebSocket status
└── services/
    ├── api.js               # REST API client
    └── websocket.js         # WebSocket client
```

**Key Features:**
- Responsive design (mobile-first)
- Real-time updates via WebSocket
- Optimistic UI updates
- Offline support with cached data
- Touch-optimized for iPad

---

### 2. Backend (API Server)

**Purpose:** Business logic, data storage, WebSocket server

**Technology:** Node.js + Express + Socket.io

**Structure:**
```
backend/src/
├── server.js                # Entry point
├── controllers/
│   ├── imageController      # Image CRUD operations
│   ├── sceneController      # Scene management
│   └── slotController       # Slot state management
├── routes/
│   ├── api.js              # Main API routes
│   ├── images.js           # Image endpoints
│   └── scenes.js           # Scene endpoints
├── services/
│   ├── websocketService    # WebSocket event handling
│   └── storageService      # File storage management
├── middleware/
│   ├── auth.js             # Authentication (Phase 2)
│   ├── upload.js           # File upload validation
│   └── errorHandler.js     # Error handling
└── models/
    ├── Scene.js            # Scene data model
    └── Image.js            # Image metadata model
```

**Key Responsibilities:**
- Handle HTTP requests
- Manage WebSocket connections
- Store uploaded images
- Maintain slot state
- Broadcast updates to connected clients

---

### 3. Display Layer (OBS Integration)

**Purpose:** Render media in OBS Studio

**Technology:** HTML + CSS + JavaScript (vanilla)

**Implementation:**
```javascript
// Display page accessed by OBS Browser Source
// URL: https://obs-media-control.piogino.ch/display?slot=1

- Lightweight HTML page
- Transparent background
- WebSocket connection to backend
- Listens for image updates
- Smooth CSS transitions
- Automatic reconnection logic
```

**Features:**
- Transparent background for compositing
- Minimal resource usage
- Fast image loading
- Graceful degradation on connection loss

---

## Data Flow

### Image Update Flow

```
1. User Action (Control Panel)
   ↓
   User taps "Change Image" on Slot 1
   ↓
2. Frontend sends HTTP POST
   ↓
   POST /api/slots/1
   Body: { imageUrl: "https://..." }
   ↓
3. Backend processes request
   ↓
   - Validates image URL
   - Updates slot state in memory/DB
   - Responds to HTTP request
   ↓
4. Backend broadcasts via WebSocket
   ↓
   Emit: 'slot:updated' { slot: 1, url: "..." }
   ↓
5. All connected clients receive update
   ↓
   - Display pages (OBS) update image
   - Control panels update UI
   ↓
6. OBS renders new image
   ↓
   Total latency: 200-500ms
```

### Scene Loading Flow

```
1. User taps "Load Scene"
   ↓
2. Frontend → Backend
   POST /api/scenes/{id}/load
   ↓
3. Backend retrieves scene config
   {
     "name": "Product Demo",
     "slots": {
       "1": "product-a.png",
       "2": "product-b.png",
       "3": "product-c.png"
     }
   }
   ↓
4. Backend updates all slots atomically
   ↓
5. Backend broadcasts scene update
   Emit: 'scene:loaded' { sceneId, slots }
   ↓
6. All OBS display pages update simultaneously
```

---

## Database Schema

### SQLite (Development) / PostgreSQL (Production)

#### Images Table
```sql
CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    url VARCHAR(512),
    type VARCHAR(50), -- 'uploaded' or 'url'
    mime_type VARCHAR(50),
    size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Scenes Table
```sql
CREATE TABLE scenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slots JSON NOT NULL, -- {"1": "image_id", "2": "image_id"}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Slots State (In-Memory with optional DB persistence)
```javascript
{
  "1": {
    "imageId": 123,
    "imageUrl": "https://...",
    "updatedAt": "2024-10-14T12:00:00Z"
  },
  "2": {
    "imageId": null,
    "imageUrl": null,
    "updatedAt": null
  }
}
```

---

## WebSocket Protocol

### Events

#### Client → Server

**`slot:update`**
```json
{
  "slot": 1,
  "imageUrl": "https://example.com/image.png",
  "imageId": 123
}
```

**`scene:load`**
```json
{
  "sceneId": 5
}
```

**`slot:clear`**
```json
{
  "slot": 2
}
```

#### Server → Client

**`slot:updated`**
```json
{
  "slot": 1,
  "imageUrl": "https://...",
  "imageId": 123,
  "timestamp": "2024-10-14T12:00:00Z"
}
```

**`scene:loaded`**
```json
{
  "sceneId": 5,
  "sceneName": "Product Demo",
  "slots": {
    "1": { "imageUrl": "...", "imageId": 123 },
    "2": { "imageUrl": "...", "imageId": 124 }
  }
}
```

**`connection:status`**
```json
{
  "status": "connected",
  "clientId": "abc123",
  "timestamp": "2024-10-14T12:00:00Z"
}
```

**`error`**
```json
{
  "code": "INVALID_IMAGE",
  "message": "Image URL is not accessible",
  "slot": 1
}
```

---

## Network Architecture

### Development Setup
```
Frontend: http://localhost:5173 (Vite dev server)
Backend:  http://localhost:3000 (Express)
OBS:      http://localhost:3000/display?slot=X
```

### Production Setup
```
┌────────────────────────────────────────┐
│  obs-media-control.piogino.ch          │
│  (Cloud Server)                        │
├────────────────────────────────────────┤
│                                        │
│  Nginx (Reverse Proxy + SSL)          │
│  ├── / → Frontend (Static files)      │
│  ├── /api → Backend (Port 3000)       │
│  └── /socket.io → WebSocket           │
│                                        │
└────────────────────────────────────────┘

SSL: Let's Encrypt (auto-renewal)
Ports: 443 (HTTPS), 80 (redirect to HTTPS)
```

### Nginx Configuration Example
```nginx
server {
    server_name obs-media-control.piogino.ch;
    
    # Frontend
    location / {
        root /var/www/obs-media-controller/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Uploaded images
    location /uploads {
        alias /var/www/obs-media-controller/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/obs-media-control.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obs-media-control.piogino.ch/privkey.pem;
}
```

---

## Security Architecture

### Authentication (Phase 2)

**JWT-based Authentication**
```
1. User logs in → POST /api/auth/login
2. Server validates credentials
3. Server generates JWT token
4. Client stores token (localStorage/cookie)
5. Client includes token in all requests
   Header: Authorization: Bearer <token>
6. Server validates token on each request
```

### File Upload Security

**Validation Pipeline:**
1. File type check (whitelist: jpg, png, gif, webp)
2. File size limit (10MB)
3. Filename sanitization
4. Virus scanning (optional)
5. Store with UUID filename
6. Generate thumbnail

### API Security

- Rate limiting (100 req/min per IP)
- CORS configuration (whitelist origins)
- Input validation (Joi/Zod)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)
- HTTPS only in production

---

## Performance Optimizations

### Backend
- Image compression on upload
- Thumbnail generation
- Response caching (Redis - Phase 3)
- Database connection pooling
- Gzip compression for API responses

### Frontend
- Code splitting (React.lazy)
- Image lazy loading
- Debounced search inputs
- Virtualized lists for large image libraries
- Service Worker for offline support (Phase 2)

### WebSocket
- Keep-alive pings
- Automatic reconnection
- Message batching for bulk updates
- Compression for large payloads

### OBS Display
- Minimal JavaScript
- CSS transitions (GPU-accelerated)
- Image preloading
- Fallback to polling if WebSocket fails

---

## Error Handling

### Frontend
```javascript
try {
  await api.updateSlot(1, imageUrl);
} catch (error) {
  if (error.response?.status === 404) {
    toast.error("Image not found");
  } else if (error.response?.status === 413) {
    toast.error("File too large");
  } else {
    toast.error("Failed to update image");
  }
  // Log to monitoring service
  Sentry.captureException(error);
}
```

### Backend
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Log to monitoring
  logger.error(err);
  
  // Send appropriate response
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

### WebSocket
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Attempt reconnection
  setTimeout(() => socket.connect(), 1000);
});
```

---

## Monitoring & Logging

### Backend Logging
- Winston or Pino for structured logging
- Log levels: error, warn, info, debug
- Log rotation (daily, max 10 files)
- Centralized logging (future: ELK stack)

### Metrics to Track
- API response times
- WebSocket connection count
- Image upload success rate
- Slot update latency
- Error rates by endpoint
- Active users

### Health Checks
```javascript
GET /api/health
Response: {
  "status": "healthy",
  "uptime": 3600,
  "connections": {
    "websocket": 5,
    "database": "connected"
  },
  "memory": {
    "used": "150MB",
    "free": "850MB"
  }
}
```

---

## Scalability Considerations

### Current (Single Server)
- Suitable for: 1-100 concurrent users
- Vertical scaling: Increase server resources

### Future (Multi-Server)
- Redis for shared session state
- Message queue (Redis Pub/Sub) for WebSocket scaling
- CDN for image serving
- Load balancer (Nginx/HAProxy)
- Database replication

---

## Deployment Architecture

### Production Deployment
```
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
    ├── Backend Tests → Build → Deploy to Server (PM2)
    └── Frontend Tests → Build → Deploy to Cloud/GitHub Pages
    ↓
Live at obs-media-control.piogino.ch
```

### Rollback Strategy
- PM2 for zero-downtime deployments
- Git tags for version tracking
- Automated backups before deployment
- Quick rollback command: `pm2 reload ecosystem.config.js --update-env`

---

## Technology Decisions

### Why Node.js?
- JavaScript everywhere (frontend + backend)
- Excellent WebSocket support
- Large ecosystem (npm)
- Good performance for I/O operations

### Why React?
- Component reusability
- Large community
- Good mobile support
- Fast development

### Why SQLite/PostgreSQL?
- SQLite: Simple, no setup (dev)
- PostgreSQL: Production-ready, reliable
- Easy migration path between them

### Why Socket.io over raw WebSocket?
- Automatic reconnection
- Fallback to polling
- Room support (future multi-user)
- Event-based API

---

**Last Updated:** October 14, 2025  
**Version:** 1.0
