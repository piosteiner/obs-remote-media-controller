# 🚀 OBS Remote Media Controller - Quick Start Guide

## ✅ Backend Setup Complete!

Your backend server is now running and fully functional.

---

## 📍 **Quick Reference**

### **Backend Location**
```
/var/www/obs-remote-media-backend
```

### **Server Details**
- **Port**: 3003
- **API Base**: `http://localhost:3003/api`
- **WebSocket**: `ws://localhost:3003`
- **Status**: ✅ ONLINE (PM2 managed)

---

## 🔥 **Quick Commands**

```bash
# Check status
pm2 list

# View logs
pm2 logs obs-remote-backend

# Restart server
pm2 restart obs-remote-backend

# Stop server
pm2 stop obs-remote-backend

# Start server
pm2 start obs-remote-backend
```

---

## 🧪 **Quick API Tests**

```bash
# Health check
curl http://localhost:3003/api/health

# Get all slots
curl http://localhost:3003/api/slots

# Update a slot
curl -X PUT http://localhost:3003/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/1920x1080", "imageId": 1}'

# Get all images
curl http://localhost:3003/api/images

# Get all scenes
curl http://localhost:3003/api/scenes
```

---

## 🔗 **Frontend Integration**

Update your frontend to use:

```javascript
// Frontend configuration
const API_BASE_URL = 'http://localhost:3003/api';
const WEBSOCKET_URL = 'http://localhost:3003';
```

---

## 📂 **Key Files**

```
/var/www/obs-remote-media-backend/
├── .env                    ← Environment configuration
├── ecosystem.config.js     ← PM2 configuration
├── src/server.js          ← Main server file
├── uploads/               ← Uploaded images stored here
└── logs/                  ← Server logs
```

---

## 🎯 **API Endpoints**

- `GET /api/health` - Health check
- `GET /api/slots` - Get all slots
- `PUT /api/slots/:id` - Update slot
- `GET /api/images` - Get images
- `POST /api/images/upload` - Upload image
- `GET /api/scenes` - Get scenes
- `POST /api/scenes` - Create scene
- `POST /api/scenes/:id/load` - Load scene

---

## 🐛 **Troubleshooting**

### Server not responding?
```bash
pm2 restart obs-remote-backend
pm2 logs obs-remote-backend --lines 50
```

### Port conflict?
Edit `/var/www/obs-remote-media-backend/.env` and change `PORT=3003`

### CORS issues?
Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

---

## 📚 **Documentation**

- **Full Setup Guide**: `DEPLOYMENT_STATUS.md`
- **API Documentation**: `README.md`
- **Frontend Repo**: https://github.com/piosteiner/obs-remote-media-controller

---

**Ready to integrate with your frontend!** 🎉
