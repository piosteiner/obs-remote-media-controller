# Frontend - OBS Remote Media Controller

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Header.jsx           # Navigation header
│   │   └── ConnectionStatus.jsx # WebSocket status indicator
│   └── control/
│       └── SlotControl.jsx      # Individual slot management
├── pages/
│   ├── Display.jsx              # OBS Browser Source page
│   ├── Control.jsx              # Main control panel
│   ├── Scenes.jsx               # Scene management
│   └── Library.jsx              # Image library
├── services/
│   ├── api.js                   # REST API client
│   └── websocket.js             # WebSocket client
├── store/
│   └── index.js                 # Zustand state management
├── App.jsx                      # Main app component
├── main.jsx                     # Entry point
└── index.css                    # Global styles
```

---

## Key Features

### Display Page (`/display?slot=X`)
- **Purpose:** Used by OBS Browser Source
- **Features:**
  - Transparent background
  - Real-time image updates via WebSocket
  - Smooth fade transitions
  - Automatic reconnection
  - Minimal resource usage

**OBS Setup:**
1. Add Browser Source
2. URL: `http://localhost:5173/display?slot=1`
3. Width: 1920, Height: 1080
4. Check "Shutdown source when not visible"

### Control Panel (`/control`)
- iPad-optimized touch interface
- Manage multiple slots
- Quick scene switching
- Upload images or paste URLs
- Real-time preview

### Scenes Page (`/scenes`)
- Create scene presets
- Load scenes with one click
- Manage scene configurations

### Library Page (`/library`)
- View all uploaded images
- Upload multiple images
- Search and filter
- Quick assign to slots

---

## State Management

Uses Zustand for global state:
- `slots` - Current slot states
- `scenes` - Scene presets
- `images` - Image library
- `isConnected` - WebSocket connection status

---

## API Integration

The frontend expects the backend to provide these endpoints:

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
- `slot:updated` - Slot was updated
- `scene:loaded` - Scene was loaded
- `error` - Error occurred

---

## Development Notes

### Mock Data
Currently using mock data for scenes and images until backend is implemented. Look for comments like:
```javascript
// Uncomment when backend is ready
```

### Proxy Configuration
Vite is configured to proxy API and WebSocket requests to `localhost:3000` in development. See `vite.config.js`.

### Environment Variables
- `import.meta.env.DEV` - Development mode
- `import.meta.env.PROD` - Production mode

---

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iPad)

---

## Performance

- Code splitting enabled
- Lazy loading for routes
- Optimized image loading
- Minimal bundle size (~150KB gzipped)

---

## Known Issues

1. Backend integration pending - using mock data
2. Scene creation UI is simplified (uses prompt)
3. No authentication yet (Phase 2)

---

## Next Steps

Once backend is ready:
1. Uncomment API calls in pages
2. Remove mock data
3. Test end-to-end with OBS
4. Deploy to production

---

**Ready for backend development!** 🚀
