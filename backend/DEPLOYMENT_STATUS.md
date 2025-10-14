# OBS Remote Media Controller - Backend Setup Complete

## ✅ **Backend Successfully Deployed!**

Your backend is now running and ready to integrate with the frontend.

---

## 🎯 **Backend Status**

- **Location**: `/var/www/obs-remote-media-backend`
- **Port**: `3003`
- **Process Manager**: PM2 (auto-restart enabled)
- **Auto-Start on Boot**: ✅ **ENABLED** (systemd configured)
- **Status**: ✅ **ONLINE**

---

## 🌐 **API Endpoints Available**

### **Base URL**: `http://localhost:3003/api`

### **Health Check**
- `GET /api/health` - Server health status

### **Slots Management**
- `GET /api/slots` - Get all slots
- `GET /api/slots/:slotId` - Get single slot
- `PUT /api/slots/:slotId` - Update slot
  ```json
  {
    "imageId": 123,
    "imageUrl": "https://example.com/image.jpg"
  }
  ```
- `DELETE /api/slots/:slotId` - Clear slot

### **Images Management**
- `GET /api/images` - Get all images
- `POST /api/images/upload` - Upload image (multipart/form-data)
  - Field name: `image`
  - Max size: 10MB
  - Allowed types: PNG, JPG, GIF, WebP
- `POST /api/images/url` - Add image by URL
  ```json
  {
    "url": "https://example.com/image.jpg",
    "name": "My Image"
  }
  ```
- `DELETE /api/images/:id` - Delete image

### **Scenes Management**
- `GET /api/scenes` - Get all scenes
- `GET /api/scenes/:id` - Get single scene
- `POST /api/scenes` - Create scene
  ```json
  {
    "name": "Scene Name",
    "description": "Optional description",
    "slots": {
      "1": { "imageId": 123, "imageUrl": "..." },
      "2": { "imageId": 456, "imageUrl": "..." }
    }
  }
  ```
- `PUT /api/scenes/:id` - Update scene
- `DELETE /api/scenes/:id` - Delete scene
- `POST /api/scenes/:id/load` - Load scene (apply to all slots)

---

## 📡 **WebSocket Events**

### **Connection**
- **URL**: `ws://localhost:3003`
- **Library**: Socket.io

### **Client → Server Events**
- `slot:update` - Update a slot
  ```javascript
  {
    slot: "1",
    imageUrl: "https://example.com/image.jpg",
    imageId: 123
  }
  ```
- `slot:clear` - Clear a slot
  ```javascript
  { slot: "1" }
  ```
- `scene:load` - Load a scene
  ```javascript
  { sceneId: 123 }
  ```
- `ping` - Keep-alive ping

### **Server → Client Events**
- `connection:status` - Connection established
- `slots:state` - Current state of all slots
- `slot:updated` - Slot was updated
- `scene:loaded` - Scene was loaded
- `pong` - Keep-alive response

---

## 🧪 **Testing the Backend**

### **Test with cURL:**

```bash
# Health check
curl http://localhost:3003/api/health

# Get all slots
curl http://localhost:3003/api/slots

# Update slot 1
curl -X PUT http://localhost:3003/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/1920x1080", "imageId": 1}'

# Get slot 1
curl http://localhost:3003/api/slots/1

# Upload an image
curl -X POST http://localhost:3003/api/images/upload \
  -F "image=@/path/to/image.png"

# Add image by URL
curl -X POST http://localhost:3003/api/images/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://via.placeholder.com/1920x1080", "name": "Test Image"}'

# Create a scene
curl -X POST http://localhost:3003/api/scenes \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Scene", "slots": {"1": {"imageUrl": "https://via.placeholder.com/1920x1080"}}}'

# Get all scenes
curl http://localhost:3003/api/scenes
```

---

## 🔗 **Frontend Integration**

Update your frontend configuration to point to:

```javascript
// In your frontend config
const API_BASE_URL = 'http://localhost:3003/api';
const WEBSOCKET_URL = 'http://localhost:3003';
```

Or for production:
```javascript
const API_BASE_URL = 'https://your-domain.com/api';
const WEBSOCKET_URL = 'https://your-domain.com';
```

---

## 🚀 **PM2 Management Commands**

```bash
# View status
pm2 list

# View logs
pm2 logs obs-remote-backend

# Restart
pm2 restart obs-remote-backend

# Stop
pm2 stop obs-remote-backend

# Start
pm2 start obs-remote-backend

# Monitor
pm2 monit
```

---

## 📁 **File Structure**

```
/var/www/obs-remote-media-backend/
├── src/
│   ├── server.js                    # Main entry point
│   ├── routes/
│   │   ├── api.js                  # Main router
│   │   ├── slots.js                # Slots endpoints
│   │   ├── scenes.js               # Scenes endpoints
│   │   └── images.js               # Images endpoints
│   ├── services/
│   │   └── websocketService.js     # WebSocket handler
│   └── middleware/
│       └── errorHandler.js         # Error handling
├── uploads/                         # Uploaded images
├── logs/                           # PM2 logs
├── .env                            # Environment variables
├── ecosystem.config.js             # PM2 configuration
├── package.json
└── README.md
```

---

## ⚙️ **Configuration**

Environment variables in `.env`:

```env
NODE_ENV=development
PORT=3003
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3003,https://obs-remote.piogino.ch
DATABASE_PATH=./database.sqlite
```

---

## 🔒 **Security Notes**

1. **CORS**: Configure `ALLOWED_ORIGINS` for your frontend domains
2. **File Upload**: Max 10MB, only image files allowed
3. **Production**: Set `NODE_ENV=production` in production
4. **SSL**: Use HTTPS/WSS in production with reverse proxy

---

## 🌐 **Nginx Reverse Proxy (Optional)**

For production deployment, configure Nginx:

```nginx
server {
    listen 80;
    server_name obs-api.your-domain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /var/www/obs-remote-media-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 **Current Status**

```
✅ Server running on port 3003
✅ REST API endpoints operational
✅ WebSocket server ready
✅ File upload configured
✅ PM2 auto-restart enabled
✅ System boot auto-start configured
✅ CORS configured for frontend
✅ All health checks passing
```

---

## 🔄 **Auto-Start Configuration**

The backend is configured to automatically start on system reboot:

- **Systemd Service**: `pm2-ubuntu.service`
- **Status**: ✅ **Enabled and Active**
- **All PM2 processes**: Will automatically restart after server reboot

To verify auto-start status:
```bash
systemctl status pm2-ubuntu
```

To disable auto-start (not recommended):
```bash
pm2 unstartup systemd
```

---

## 🎉 **Next Steps**

1. **Test the API** - Use the cURL commands above
2. **Update Frontend Config** - Point to `http://localhost:3003`
3. **Test WebSocket** - Connect from frontend
4. **Upload Test Images** - Verify file upload works
5. **Create Test Scenes** - Verify scene management

---

## 🐛 **Troubleshooting**

### **Backend not responding:**
```bash
pm2 logs obs-remote-backend
pm2 restart obs-remote-backend
```

### **Port already in use:**
Edit `.env` and change `PORT=3003` to another port

### **Upload not working:**
Check permissions: `chmod 755 /var/www/obs-remote-media-backend/uploads`

### **CORS errors:**
Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

---

**Backend is ready for integration with your frontend!** 🚀

For frontend repository: https://github.com/piosteiner/obs-remote-media-controller
