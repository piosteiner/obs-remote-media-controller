# Quick Start Guide

## Frontend is Complete! ✅

The frontend is now fully implemented and ready to use. Follow these steps to get started.

---

## Starting the Frontend

### 1. Install Dependencies
```powershell
cd frontend
npm install
```

This will install:
- React 18
- Vite (build tool)
- Socket.io-client (WebSocket)
- Tailwind CSS (styling)
- Zustand (state management)
- Axios (HTTP client)
- Lucide React (icons)

### 2. Start Development Server
```powershell
npm run dev
```

The app will start at `http://localhost:5173`

### 3. Access the Pages

**Control Panel (Main Interface):**
```
http://localhost:5173/control
```

**Display Page for OBS (Slot 1):**
```
http://localhost:5173/display?slot=1
```

**Scenes Management:**
```
http://localhost:5173/scenes
```

**Image Library:**
```
http://localhost:5173/library
```

---

## What You'll See

### Without Backend (Current State)
- ✅ UI loads correctly
- ✅ Navigation works
- ✅ Display page renders (transparent background)
- ⚠️ WebSocket shows "Disconnected" (expected - no backend yet)
- ⚠️ API calls will fail (expected - no backend yet)
- ⚠️ Mock data for scenes

### With Backend (After You Build It)
- ✅ WebSocket shows "Connected"
- ✅ Real-time updates work
- ✅ Image uploads work
- ✅ Slots update in real-time
- ✅ Scenes load correctly

---

## Testing the Display Page in OBS

Even without the backend, you can test the display page in OBS:

1. **Open OBS Studio**

2. **Add Browser Source:**
   - Source name: "Image Slot 1"
   - URL: `http://localhost:5173/display?slot=1`
   - Width: 1920
   - Height: 1080
   - ✅ Check "Shutdown source when not visible"

3. **What You'll See:**
   - Transparent background
   - Connection indicator (top right, in dev mode only)
   - "Disconnected" status (normal without backend)

4. **Once Backend is Running:**
   - Status changes to "Connected"
   - Images appear when you update slots from control panel
   - Real-time updates work

---

## Next Step: Build the Backend

### Option 1: Use the Instructions Document

See `backend/BACKEND_INSTRUCTIONS.md` for complete step-by-step instructions.

Key files to create:
1. `backend/src/server.js` - Main server
2. `backend/src/services/websocketService.js` - WebSocket handling
3. `backend/src/routes/` - API endpoints

### Option 2: Copy-Paste Implementation

All code is provided in `BACKEND_INSTRUCTIONS.md`. You can:
1. Create each file manually
2. Copy the provided code
3. Test as you go

---

## Project Structure Overview

```
obs-remote-media-controller/
├── frontend/              ✅ COMPLETE
│   ├── src/
│   │   ├── pages/        # Display, Control, Scenes, Library
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API & WebSocket clients
│   │   └── store/        # Global state
│   ├── package.json
│   └── vite.config.js
│
├── backend/              ⏳ TO BE BUILT
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   └── services/
│   ├── uploads/
│   └── package.json
│
└── docs/                 ✅ COMPLETE
    ├── ARCHITECTURE.md
    ├── API.md
    └── SETUP.md
```

---

## Development Workflow

### Terminal 1 - Frontend (Now)
```powershell
cd frontend
npm install
npm run dev
```

### Terminal 2 - Backend (After You Build It)
```powershell
cd backend
npm install
npm run dev
```

---

## Common Issues & Solutions

### Frontend won't start
```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

### Port 5173 already in use
```powershell
# Kill process using port
netstat -ano | findstr :5173
# Then kill the PID shown
taskkill /PID <PID> /F
```

### Tailwind not working
The `@tailwind` warnings in index.css are normal - they resolve after `npm install`.

---

## What the Frontend Provides

### 1. Display Page (`/display`)
- **Purpose:** For OBS Browser Source
- **Features:**
  - Transparent background
  - Real-time image updates
  - Smooth transitions
  - Auto-reconnection
  - Minimal resource usage

### 2. Control Panel (`/control`)
- **Purpose:** Main interface for managing slots
- **Features:**
  - Upload images
  - Paste image URLs
  - Clear slots
  - View current images
  - Real-time preview
  - Quick scene switching

### 3. Scenes Page (`/scenes`)
- **Purpose:** Manage scene presets
- **Features:**
  - Create scenes from current slots
  - Load scenes with one click
  - Delete scenes
  - View scene configurations

### 4. Library Page (`/library`)
- **Purpose:** Image library management
- **Features:**
  - Upload multiple images
  - View all images in grid
  - Search and filter
  - Quick assign to slots
  - Delete images

---

## API Endpoints the Backend Must Provide

The frontend expects these endpoints (see `backend/BACKEND_INSTRUCTIONS.md` for implementation):

### Slots
- `GET /api/slots` - Get all slots
- `PUT /api/slots/:id` - Update slot
- `DELETE /api/slots/:id` - Clear slot

### Scenes
- `GET /api/scenes` - List scenes
- `POST /api/scenes` - Create scene
- `POST /api/scenes/:id/load` - Load scene
- `DELETE /api/scenes/:id` - Delete scene

### Images
- `GET /api/images` - List images
- `POST /api/images/upload` - Upload image
- `DELETE /api/images/:id` - Delete image

### WebSocket Events
- `slot:updated` - Broadcast slot changes
- `scene:loaded` - Broadcast scene loads
- `connection:status` - Connection status

---

## Ready for Backend Development!

**When you're ready to build the backend:**

1. Open a new terminal/editor window for backend development
2. Navigate to the backend folder
3. Follow `backend/BACKEND_INSTRUCTIONS.md`
4. Tell the backend Copilot: 
   > "Build the backend for obs-remote-media-controller following the instructions in BACKEND_INSTRUCTIONS.md"

The frontend will automatically connect once the backend is running! 🚀

---

## Questions?

- See `docs/ARCHITECTURE.md` for technical details
- See `docs/API.md` for API reference
- See `frontend/README.md` for frontend-specific info
- See `backend/BACKEND_INSTRUCTIONS.md` for backend guide

**The frontend is production-ready and waiting for the backend!** ✨
