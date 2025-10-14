# OBS Remote Media Controller - Project Plan

## 🎯 Project Overview

**Project Name:** OBS Remote Media Controller  
**Repository:** `obs-remote-media-controller`  
**Website:** `obs-media-control.piogino.ch`  
**Version:** 1.0.0  
**Date:** October 2025

### Purpose
A web-based remote control system for OBS Studio that allows dynamic management of images and media sources from any device. Designed specifically for users who run OBS on one device (laptop) but need to control media during presentations/meetings from another device (iPad/phone).

### Key Problem Solved
Eliminates the need to manually update OBS image sources or switch between devices during live streams/presentations. Provides a single-click interface to change images, switch between pre-configured scenes, and manage multiple media slots simultaneously.

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────┐
│     Control Device          │
│  (iPad/Phone/Computer)      │
│                             │
│  Web Interface              │
│  obs-media-control.piogino.ch│
└──────────────┬──────────────┘
               │ HTTPS/WSS
               ↓
┌──────────────────────────────────────┐
│   Cloud Server (piogino.ch)          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Backend (Node.js + Express)  │ │
│  │   - REST API                   │ │
│  │   - WebSocket Server           │ │
│  │   - Image Storage              │ │
│  │   - Scene Management           │ │
│  │   - Authentication             │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Frontend (React)             │ │
│  │   - Control Panel              │ │
│  │   - Scene Manager              │ │
│  │   - Image Library              │ │
│  └────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │ WebSocket
               ↓
┌──────────────────────────────────────┐
│   OBS Machine (Laptop)               │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   OBS Studio                   │ │
│  │                                │ │
│  │   Browser Source 1 → Slot 1   │ │
│  │   Browser Source 2 → Slot 2   │ │
│  │   Browser Source 3 → Slot 3   │ │
│  │   Browser Source N → Slot N   │ │
│  └────────────────────────────────┘ │
│                                      │
│  Points to:                          │
│  https://obs-media-control.piogino   │
│         .ch/display?slot=X           │
└──────────────────────────────────────┘
```

### Technology Stack

#### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **WebSocket:** ws or Socket.io
- **Database:** SQLite (development) / PostgreSQL (production)
- **File Upload:** Multer
- **Authentication:** JWT tokens
- **Image Processing:** Sharp (optional, for thumbnails)

#### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand or Context API
- **WebSocket Client:** Socket.io-client
- **HTTP Client:** Axios
- **UI Components:** Headless UI or Radix UI
- **Icons:** Lucide React or Heroicons

#### Deployment
- **Backend Hosting:** Cloud server (piogino.ch)
- **Frontend Hosting:** GitHub Pages or cloud server
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt
- **Process Manager:** PM2
- **CI/CD:** GitHub Actions

---

## ✨ Core Features

### Phase 1: MVP (Minimum Viable Product)

#### 1.1 Display System
- [ ] Display page with transparent background for OBS
- [ ] Support for multiple slots (display?slot=1, slot=2, etc.)
- [ ] WebSocket connection for real-time updates
- [ ] Automatic reconnection on connection loss
- [ ] Smooth fade transitions between images
- [ ] Support for PNG transparency
- [ ] Responsive image scaling (fit, fill, stretch modes)

#### 1.2 Control Panel
- [ ] Touch-optimized interface for iPad
- [ ] Image URL input and validation
- [ ] File upload (drag & drop + file picker)
- [ ] Per-slot control (update individual slots)
- [ ] Clear slot function
- [ ] Live preview of current display
- [ ] Connection status indicator
- [ ] Supported formats: PNG, JPG, JPEG, GIF, WebP

#### 1.3 Scene Management
- [ ] Create named scene presets
- [ ] Define which images appear in which slots per scene
- [ ] One-click scene switching
- [ ] Scene list with thumbnails
- [ ] Edit/delete scenes
- [ ] Duplicate scene functionality

#### 1.4 Image Library
- [ ] Upload and store images
- [ ] Grid view of all uploaded images
- [ ] Image metadata (name, size, dimensions, upload date)
- [ ] Search/filter images
- [ ] Delete images
- [ ] Quick-assign to slot from library

#### 1.5 Backend API
- [ ] RESTful API for all operations
- [ ] WebSocket server for real-time updates
- [ ] File upload endpoint with validation
- [ ] Image storage and retrieval
- [ ] Scene CRUD operations
- [ ] Slot state management
- [ ] Health check endpoint

### Phase 2: Enhanced Features

#### 2.1 User Experience
- [ ] Keyboard shortcuts (Ctrl+1-9 for scenes)
- [ ] Undo/redo functionality
- [ ] Recent images quick access
- [ ] Image history tracking
- [ ] Dark mode support
- [ ] Mobile-responsive design
- [ ] Offline mode (cached data)

#### 2.2 Advanced Scene Features
- [ ] Scene folders/categories
- [ ] Scene tags for organization
- [ ] Scene templates
- [ ] Import/export scenes (JSON)
- [ ] Bulk scene operations
- [ ] Scene scheduling (time-based switching)

#### 2.3 Image Management
- [ ] Image editing (crop, rotate, resize)
- [ ] Image effects (filters, borders, shadows)
- [ ] Batch upload
- [ ] Image collections/albums
- [ ] External URL monitoring (check if still valid)
- [ ] Image CDN integration

#### 2.4 Multi-User Support
- [ ] User authentication (login/logout)
- [ ] Multiple user accounts
- [ ] Role-based access (admin, editor, viewer)
- [ ] Activity log
- [ ] Session management

### Phase 3: Advanced Features

#### 3.1 Media Expansion
- [ ] Video file support
- [ ] GIF animation control (play/pause)
- [ ] Audio file management
- [ ] Text overlay creation
- [ ] SVG support
- [ ] PDF page display

#### 3.2 Integration & Automation
- [ ] OBS WebSocket integration (advanced control)
- [ ] API for external tools
- [ ] Webhook support
- [ ] Scheduled scene changes
- [ ] Hotkey triggers via external devices
- [ ] Stream Deck integration

#### 3.3 Collaboration
- [ ] Shared image libraries
- [ ] Team workspaces
- [ ] Real-time collaboration (multiple controllers)
- [ ] Comments on scenes/images
- [ ] Version control for scenes

---

## 📁 Repository Structure

```
obs-remote-media-controller/
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml
│       └── frontend-deploy.yml
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── imageController.js
│   │   │   ├── sceneController.js
│   │   │   └── slotController.js
│   │   ├── routes/
│   │   │   ├── api.js
│   │   │   ├── images.js
│   │   │   └── scenes.js
│   │   ├── services/
│   │   │   ├── websocketService.js
│   │   │   └── storageService.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── Scene.js
│   │   │   └── Image.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── server.js
│   ├── uploads/              # Image storage (gitignored)
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── control/
│   │   │   │   ├── SlotControl.jsx
│   │   │   │   ├── SceneSelector.jsx
│   │   │   │   └── ImageUploader.jsx
│   │   │   ├── display/
│   │   │   │   └── MediaDisplay.jsx
│   │   │   ├── library/
│   │   │   │   └── ImageLibrary.jsx
│   │   │   └── common/
│   │   │       ├── Header.jsx
│   │   │       └── ConnectionStatus.jsx
│   │   ├── pages/
│   │   │   ├── Display.jsx
│   │   │   ├── Control.jsx
│   │   │   └── Scenes.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js
│   │   │   └── useSlots.js
│   │   ├── store/
│   │   │   └── index.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── README.md
├── docs/
│   ├── SETUP.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
├── examples/
│   └── sample-scenes.json
├── .gitignore
├── LICENSE
├── PROJECT_PLAN.md
└── README.md
```

---

## 🔌 API Design

### REST Endpoints

#### Images
- `GET /api/images` - List all images
- `POST /api/images/upload` - Upload new image
- `DELETE /api/images/:id` - Delete image
- `GET /api/images/:id` - Get image metadata
- `GET /uploads/:filename` - Serve image file

#### Scenes
- `GET /api/scenes` - List all scenes
- `POST /api/scenes` - Create new scene
- `PUT /api/scenes/:id` - Update scene
- `DELETE /api/scenes/:id` - Delete scene
- `POST /api/scenes/:id/load` - Load scene (update all slots)

#### Slots
- `GET /api/slots` - Get current state of all slots
- `PUT /api/slots/:slotId` - Update specific slot
- `DELETE /api/slots/:slotId` - Clear specific slot

#### System
- `GET /api/health` - Health check
- `GET /api/status` - System status and stats

### WebSocket Events

#### Client → Server
- `slot:update` - Update slot content
- `scene:load` - Load scene
- `slot:clear` - Clear slot
- `ping` - Keep-alive

#### Server → Client
- `slot:updated` - Slot was updated
- `scene:loaded` - Scene was loaded
- `connection:status` - Connection status change
- `error` - Error occurred
- `pong` - Keep-alive response

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Working MVP with basic functionality

**Backend:**
1. Set up Express server with basic routing
2. Implement WebSocket server
3. Create file upload system
4. Build slot state management
5. Add basic scene CRUD operations
6. Set up SQLite database

**Frontend:**
1. Set up React + Vite project
2. Create display page component
3. Build basic control panel
4. Implement WebSocket client
5. Add image upload UI
6. Create slot control interface

**Testing:**
- Test OBS Browser Source integration
- Test WebSocket real-time updates
- Test image upload and display
- Test on iPad

### Phase 2: Enhancement (Week 3-4)
**Goal:** Polished user experience

**Features:**
1. Scene management UI
2. Image library with grid view
3. Smooth transitions and animations
4. Error handling and reconnection logic
5. Loading states and feedback
6. Responsive design optimization

**Testing:**
- User testing with real streaming scenario
- Performance testing with multiple images
- Network resilience testing
- Cross-browser testing

### Phase 3: Deployment (Week 5)
**Goal:** Production-ready deployment

**Tasks:**
1. Set up production server environment
2. Configure Nginx reverse proxy
3. Set up SSL certificates
4. Deploy backend to cloud server
5. Deploy frontend to obs-media-control.piogino.ch
6. Configure GitHub Actions CI/CD
7. Set up monitoring and logging
8. Create user documentation

### Phase 4: Polish & Additional Features (Ongoing)
**Goal:** Continuous improvement

**Features:**
1. User authentication
2. Advanced scene features
3. Media format expansion
4. Performance optimizations
5. Community feedback implementation

---

## 🎨 User Interface Design

### Control Panel Layout (iPad Optimized)

```
┌─────────────────────────────────────────────────┐
│  OBS Remote Media Controller        [●] Online  │
├─────────────────────────────────────────────────┤
│  [Slots] [Scenes] [Library] [Settings]          │
├─────────────────────────────────────────────────┤
│                                                  │
│  Quick Scene Switch:                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Intro  │ │Products │ │ Social  │          │
│  │  [img]  │ │ [imgs]  │ │  [QR]   │          │
│  └─────────┘ └─────────┘ └─────────┘          │
│                                                  │
│  Current Slots:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Slot 1: [preview] product-a.png           │ │
│  │ [Change] [Clear] [🔗 Paste URL]           │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ Slot 2: [preview] Empty                   │ │
│  │ [Choose from Library] [📤 Upload]         │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ Slot 3: [preview] logo.png                │ │
│  │ [Change] [Clear] [🔗 Paste URL]           │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  [+ Add Slot]                                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Display Page (OBS Browser Source)
- Full transparent background
- Single image element
- No UI elements
- Automatic scaling
- Fade transitions

---

## 🔒 Security Considerations

### Authentication
- JWT token-based authentication (Phase 2)
- Secure password hashing (bcrypt)
- Session management
- CORS configuration

### File Upload
- File type validation (whitelist)
- File size limits (e.g., 10MB per image)
- Filename sanitization
- Virus scanning (optional, Phase 3)

### API Security
- Rate limiting
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention
- HTTPS only in production

### WebSocket Security
- Authentication required
- Origin validation
- Connection rate limiting
- Automatic timeout for inactive connections

---

## 📊 Performance Targets

### Backend
- API response time: < 100ms (95th percentile)
- Image upload: < 2s for 5MB file
- WebSocket latency: < 50ms
- Concurrent WebSocket connections: 100+
- Image serving: < 200ms

### Frontend
- Initial load time: < 2s
- Time to interactive: < 3s
- Image switch latency: < 500ms (including network)
- Smooth 60fps animations
- Bundle size: < 500KB (gzipped)

### OBS Integration
- Display page load: < 1s
- Image update in OBS: < 500ms from control action
- No frame drops during transitions
- Memory usage: < 100MB per browser source

---

## 🧪 Testing Strategy

### Unit Tests
- Backend API endpoints
- WebSocket event handlers
- Frontend components
- Utility functions

### Integration Tests
- API + Database interactions
- WebSocket client-server communication
- File upload flow
- Scene loading flow

### End-to-End Tests
- Complete user workflows
- OBS Browser Source integration
- Multi-device scenarios
- Network failure recovery

### Manual Testing
- Real-world streaming scenarios
- iPad control during live stream
- Cross-browser compatibility
- Performance under load

---

## 📚 Documentation Plan

### For Users
- **README.md** - Project overview, quick start
- **USER_GUIDE.md** - Detailed usage instructions
- **SETUP.md** - OBS configuration guide
- **FAQ.md** - Common questions and troubleshooting

### For Developers
- **ARCHITECTURE.md** - System design and architecture
- **API.md** - Complete API reference
- **DEPLOYMENT.md** - Deployment instructions
- **CONTRIBUTING.md** - Contribution guidelines

### Video Tutorials (Future)
- Initial setup walkthrough
- Creating scenes
- Using on iPad during stream
- Advanced features

---

## 🎯 Success Metrics

### MVP Success Criteria
- ✅ Can upload and display images in OBS
- ✅ Can switch images from iPad
- ✅ Latency < 500ms for image updates
- ✅ Transparent background works in OBS
- ✅ Scene presets working
- ✅ Stable WebSocket connection

### User Adoption (Future)
- GitHub stars: 100+ (6 months)
- Active users: 50+ (6 months)
- Community contributions
- Positive user feedback

---

## 🛠️ Development Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)
- OBS Studio (for testing)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Full Stack Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Watch for changes
npm run test:watch
```

---

## 🚢 Deployment Strategy

### Backend Deployment
1. SSH to cloud server
2. Clone repository
3. Install dependencies
4. Configure environment variables
5. Set up PM2 for process management
6. Configure Nginx reverse proxy
7. Set up SSL with Let's Encrypt
8. Configure firewall

### Frontend Deployment
**Option A: GitHub Pages**
1. Build production bundle
2. Deploy to gh-pages branch
3. Configure custom domain CNAME

**Option B: Cloud Server**
1. Build production bundle
2. Copy to server
3. Serve via Nginx

### CI/CD Pipeline
- Automated testing on push
- Automated deployment on main branch
- Version tagging
- Changelog generation

---

## 📝 License

MIT License (to be determined)

---

## 🤝 Contributing

(Guidelines to be added in CONTRIBUTING.md)

---

## 📞 Support & Contact

- **Issues:** GitHub Issues
- **Email:** (to be added)
- **Website:** obs-media-control.piogino.ch

---

## 🗺️ Roadmap

### Q4 2024
- ✅ Project planning
- ⏳ MVP development
- ⏳ Initial deployment

### Q1 2025
- Enhanced features
- User authentication
- Advanced scene management
- Community feedback integration

### Q2 2025
- Video support
- External integrations
- Mobile app (optional)
- Advanced automation

---

**Last Updated:** October 14, 2025  
**Version:** 1.0  
**Status:** 🚧 In Planning
