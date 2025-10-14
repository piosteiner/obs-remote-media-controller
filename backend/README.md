# OBS Remote Media Controller - Backend

Backend server for OBS Remote Media Controller with REST API and WebSocket support.

## 🚀 Features

- **REST API** for slots, scenes, and image management
- **WebSocket** real-time updates with Socket.io
- **File Upload** support with Multer
- **CORS** enabled for frontend integration
- **In-memory storage** (easily replaceable with database)

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

## 🏃 Running

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Slots
- `GET /api/slots` - Get all slots
- `GET /api/slots/:slotId` - Get single slot
- `PUT /api/slots/:slotId` - Update slot
- `DELETE /api/slots/:slotId` - Clear slot

### Images
- `GET /api/images` - Get all images
- `POST /api/images/upload` - Upload image (multipart/form-data)
- `POST /api/images/url` - Add image by URL
- `DELETE /api/images/:id` - Delete image

### Scenes
- `GET /api/scenes` - Get all scenes
- `GET /api/scenes/:id` - Get single scene
- `POST /api/scenes` - Create scene
- `PUT /api/scenes/:id` - Update scene
- `DELETE /api/scenes/:id` - Delete scene
- `POST /api/scenes/:id/load` - Load scene

## 🔌 WebSocket Events

### Client → Server
- `slot:update` - Update a slot
- `slot:clear` - Clear a slot
- `scene:load` - Load a scene
- `ping` - Keep-alive ping

### Server → Client
- `connection:status` - Connection established
- `slots:state` - Current state of all slots
- `slot:updated` - Slot was updated
- `scene:loaded` - Scene was loaded
- `pong` - Keep-alive response

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Get slots
curl http://localhost:3000/api/slots

# Update slot
curl -X PUT http://localhost:3000/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/1920x1080"}'

# Upload image
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@/path/to/image.png"
```

## 🌐 Frontend Integration

The backend is designed to work with the frontend at:
https://github.com/piosteiner/obs-remote-media-controller

Update `ALLOWED_ORIGINS` in `.env` to match your frontend URL.

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js              # Main entry point
│   ├── routes/
│   │   ├── api.js            # Main router
│   │   ├── slots.js          # Slots endpoints
│   │   ├── scenes.js         # Scenes endpoints
│   │   └── images.js         # Images endpoints
│   ├── services/
│   │   └── websocketService.js  # WebSocket handler
│   └── middleware/
│       └── errorHandler.js   # Error handling
├── uploads/                   # Uploaded images
├── .env                       # Environment config
└── package.json
```

## 🔧 Configuration

Environment variables in `.env`:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `UPLOAD_DIR` - Upload directory
- `MAX_FILE_SIZE` - Max file size in bytes
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `DATABASE_PATH` - SQLite database path (for future use)

## 🚀 Deployment

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name obs-remote-backend

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/obs-remote-media-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📝 License

MIT

## 👤 Author

Pio Steiner
