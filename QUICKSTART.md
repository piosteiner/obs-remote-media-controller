# Quick Start Guide

## Architecture Overview

- **Backend**: Runs on cloud server at `obs-media-control.piogino.ch`
- **Frontend**: Runs locally on your laptop
- **OBS**: Uses Browser Source pointing to frontend Display page

---

## Local Setup (Your Laptop)

### First Time Setup

1. **Install Dependencies**
   ```powershell
   cd frontend
   npm install
   ```

2. **Backend Connection**
   
   The frontend is already configured to connect to your cloud backend via proxy.  
   Check `frontend/vite.config.js` - it proxies API calls to `obs-media-control.piogino.ch`

### Running the Frontend

**Option 1: Double-click** `start.bat` (easiest!)

**Option 2: Command line**
```powershell
npm run dev
```

**Option 3: From frontend directory**
```powershell
cd frontend
npm run dev
```

### Access URLs

- **Control Panel** (iPad/Phone): http://localhost:5173/control
- **OBS Display**: http://localhost:5173/display?slot=1
- **Scene Management**: http://localhost:5173/scenes
- **Image Library**: http://localhost:5173/library

### Accessing from iPad

Find your laptop's IP address:
```powershell
ipconfig
```

Look for "IPv4 Address" (e.g., 192.168.1.100)

On iPad, navigate to: `http://192.168.1.100:5173/control`

---

## Cloud Server Setup (Backend)

### First Time Deployment

See **`backend/DEPLOY.md`** for complete deployment guide.

**Quick Steps:**

1. **SSH into your cloud server**
   ```bash
   ssh user@your-server.com
   ```

2. **Clone and setup**
   ```bash
   git clone https://github.com/piosteiner/obs-remote-media-controller.git
   cd obs-remote-media-controller/backend
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Set:
   ```env
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://obs-media-control.piogino.ch
   ```

4. **Install and start with PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx reverse proxy** (see `backend/DEPLOY.md` for full config)

### Managing Backend

```bash
# Start
pm2 start ecosystem.config.js

# Restart
pm2 restart obs-media-controller

# View logs
pm2 logs obs-media-controller

# Check status
pm2 status

# Monitor
pm2 monit
```

### Update Backend Code

```bash
cd ~/obs-remote-media-controller/backend
git pull origin main
npm install
pm2 restart obs-media-controller
```

---

## OBS Configuration

### Add Browser Source

1. In OBS, click **+** under Sources
2. Select **Browser**
3. Configure:
   - **Name**: "Image Slot 1"
   - **URL**: `http://localhost:5173/display?slot=1`
   - **Width**: `1920` (your screen resolution)
   - **Height**: `1080` (your screen resolution)
   - **Custom CSS**: 
     ```css
     body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
     ```
   - ✅ **Shutdown source when not visible**
   - ✅ **Refresh browser when scene becomes active**

### Multiple Slots

Create separate Browser Sources for each slot:
- Slot 1: `http://localhost:5173/display?slot=1`
- Slot 2: `http://localhost:5173/display?slot=2`
- Slot 3: `http://localhost:5173/display?slot=3`

---

## Workflow During Meetings

1. **Before meeting:**
   - Ensure backend is running on cloud server (`pm2 status`)
   - Start frontend on laptop (double-click `start.bat`)
   - Configure OBS Browser Sources

2. **During meeting:**
   - Open Control Panel on iPad: `http://LAPTOP-IP:5173/control`
   - Upload images or paste URLs
   - Click slots to update
   - Load scene presets
   - OBS updates in real-time via WebSocket

3. **Scene Presets:**
   - Create scenes in Scene Management page
   - Configure multiple slots at once
   - Load complete scenes with one click

---

## Troubleshooting

### Frontend won't start
```powershell
cd frontend
Remove-Item node_modules -Recurse -Force
npm install
npm run dev
```

### Backend connection issues
Check backend status:
```bash
pm2 status
curl https://obs-media-control.piogino.ch/api/health
sudo systemctl status nginx
```

### OBS not updating
- Refresh Browser Source in OBS (right-click → Refresh)
- Check frontend console (F12) for WebSocket errors
- Verify backend WebSocket is accessible

### Can't connect from iPad
- Ensure laptop and iPad are on same WiFi network
- Find laptop IP: `ipconfig` in PowerShell
- Check Windows Firewall allows port 5173
- Try: `http://LAPTOP-IP:5173/control`

### WebSocket disconnected
- Check backend PM2 logs: `pm2 logs obs-media-controller`
- Verify Nginx WebSocket configuration
- Ensure `Upgrade` and `Connection` headers are set in Nginx

---

## Project Structure

```
obs-remote-media-controller/
├── frontend/              # React app (runs locally)
│   ├── src/
│   │   ├── pages/        # Display, Control, Scenes, Library
│   │   ├── components/   # UI components
│   │   ├── services/     # API & WebSocket
│   │   └── store/        # State management
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Node.js server (runs on cloud)
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # WebSocket
│   │   └── middleware/   # Error handling
│   ├── uploads/          # Uploaded images
│   ├── package.json
│   ├── ecosystem.config.js    # PM2 config
│   ├── DEPLOY.md         # Deployment guide
│   └── start-server.sh   # Server start script
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── BACKEND_REVIEW.md
│
├── package.json          # Root config (frontend shortcuts)
├── start.bat             # Windows quick start
└── QUICKSTART.md         # This file
```

---

## Network Architecture

### Development Setup
- **Frontend**: Laptop (`http://localhost:5173`)
- **Backend**: Cloud (`https://obs-media-control.piogino.ch`)
- **OBS**: Reads from laptop frontend
- **iPad**: Controls via laptop frontend

### Data Flow
```
iPad (Control Panel)
  ↓ HTTP/WebSocket
Laptop (Frontend)
  ↓ Proxy to Cloud
Cloud Server (Backend)
  ↓ WebSocket broadcast
Laptop (Frontend)
  ↓ Update display
OBS (Browser Source)
```

---

## Key Features

### Display Page
✅ Transparent background for OBS  
✅ Real-time image updates via WebSocket  
✅ Smooth fade transitions  
✅ Auto-reconnection  
✅ Multiple slots support  

### Control Panel
✅ Upload images  
✅ Paste image URLs  
✅ Clear slots  
✅ Real-time preview  
✅ Scene quick-load  
✅ iPad-optimized touch interface  

### Scene Management
✅ Create scene presets  
✅ Save current slot configuration  
✅ Load scenes with one click  
✅ Delete scenes  

### Image Library
✅ View all uploaded images  
✅ Search and filter  
✅ Quick assign to slots  
✅ Delete unused images  

---

## Next Steps

1. ✅ **Deploy backend** to cloud server (see `backend/DEPLOY.md`)
2. ✅ **Start frontend** locally (`start.bat`)
3. ✅ **Configure OBS** Browser Source
4. ✅ **Test from iPad** Control Panel
5. 🎉 **Use in meetings!**

---

## Documentation

- **Full deployment guide**: `backend/DEPLOY.md`
- **API documentation**: `docs/API.md`
- **Architecture details**: `docs/ARCHITECTURE.md`
- **Backend code review**: `docs/BACKEND_REVIEW.md`

---

## Support

### Health Checks
- Backend API: `https://obs-media-control.piogino.ch/api/health`
- Frontend: `http://localhost:5173`

### Logs
```bash
# Backend logs
pm2 logs obs-media-controller

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Commands

**Local (Windows):**
```powershell
# Start frontend
.\start.bat

# Or manually
cd frontend
npm run dev

# Find laptop IP
ipconfig
```

**Cloud Server (Linux):**
```bash
# Manage backend
pm2 status
pm2 restart obs-media-controller
pm2 logs obs-media-controller

# Update code
cd ~/obs-remote-media-controller/backend
git pull
npm install
pm2 restart obs-media-controller
```

---

**Ready to go! Start with `start.bat` and open the Control Panel!** 🚀
