# OBS Remote Media Controller

> 🎬 Remote control for OBS Studio media sources via web interface. Manage images, videos, and scenes from any device.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🎯 What is This?

**OBS Remote Media Controller** is a web-based solution that allows you to dynamically control images and media in OBS Studio from any device. Perfect for streamers, presenters, and content creators who need to switch media during live streams without touching their OBS machine.

### The Problem It Solves

- 🔄 No more manually updating image sources in OBS
- 📱 Control OBS media from your iPad, phone, or another computer
- ⚡ Instant image switching with one click
- 🎨 Support for transparent PNGs and multiple image formats
- 🎬 Pre-configured scene presets for quick transitions
- 🖼️ Manage multiple image slots simultaneously

---

## ✨ Key Features

### 🎮 Remote Control
- Control from any device with a web browser
- Real-time updates via WebSocket (200-500ms latency)
- iPad-optimized touch interface
- Works over local network or internet

### 🖼️ Media Management
- Upload images or use web URLs
- Support for PNG (with transparency), JPG, GIF, WebP
- Image library with preview thumbnails
- Drag-and-drop upload
- Recent images quick access

### 🎬 Scene Presets
- Create unlimited scene configurations
- One-click scene switching
- Assign multiple images to multiple slots per scene
- Save and organize your favorite setups

### 🎨 Multi-Slot Support
- Control multiple OBS browser sources
- Independent slot management
- Simultaneous image display
- Flexible positioning in OBS

### 🔧 OBS Integration
- Simple Browser Source setup
- Transparent background support
- Smooth fade transitions
- Auto-reconnection on network issues
- No OBS plugins required

---

## 🚀 Quick Start

### For Users (After Deployment)

1. **Access Control Panel**
   - Visit: `https://obs-media-control.piogino.ch/control`
   - From any device (iPad, phone, laptop)

2. **Configure OBS**
   - Add Browser Source in OBS
   - URL: `https://obs-media-control.piogino.ch/display?slot=1`
   - Width: 1920, Height: 1080 (your canvas size)
   - Check "Shutdown source when not visible"

3. **Upload & Control**
   - Upload images or paste URLs
   - Watch them appear in OBS instantly!

### For Deployment

See detailed guides:
- **[GitHub Pages Setup](GITHUB_PAGES_SETUP.md)** - Deploy frontend (5 minutes)
- **[Backend Deployment](backend/DEPLOY.md)** - Deploy backend to VPS

---

## 📖 Documentation

- **[GitHub Pages Setup](GITHUB_PAGES_SETUP.md)** - Deploy frontend in 5 minutes
- **[Backend Deployment](backend/DEPLOY.md)** - Deploy backend to VPS
- **[Frontend Deployment Guide](frontend/DEPLOY.md)** - Detailed frontend deployment options
- **[Project Plan](PROJECT_PLAN.md)** - Complete project roadmap
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture details
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Backend Code Review](docs/BACKEND_REVIEW.md)** - Code quality assessment (96/100)

---

## 🎨 Use Cases

### 📊 Business Presentations
- Switch product images during demos
- Display QR codes for audience engagement
- Show charts and graphs on demand

### 🎮 Live Streaming
- Rotate sponsor logos
- Display viewer submissions
- Switch between game assets
- Show alerts and notifications

### 🎓 Online Teaching
- Display course materials
- Switch between lesson slides
- Show student work
- Visual demonstrations

### 🎪 Events & Webinars
- Speaker slides
- Sponsor acknowledgments
- Social media graphics
- Live polls and Q&A codes

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Your iPad/    │         │  GitHub Pages    │         │  OBS Machine    │
│   Phone         │◄───────►│  (Frontend)      │◄───────►│  (Laptop)       │
│                 │  HTTPS  │                  │WebSocket│                 │
│  Control Panel  │         │  obs-media-      │         │  Browser Source │
│                 │         │  control.piogino │         │  (Display Page) │
│                 │         │  .ch             │         │                 │
└─────────────────┘         └────────┬─────────┘         └─────────────────┘
                                     │
                                     │ HTTPS/WSS
                                     ▼
                            ┌──────────────────┐
                            │  Infomaniak VPS  │
                            │  (Backend)       │
                            │  83.228.207.199  │
                            │                  │
                            │  - API Server    │
                            │  - WebSocket     │
                            │  - Image Storage │
                            └──────────────────┘
```

**Deployment:**
- **Frontend**: GitHub Pages at `obs-media-control.piogino.ch` (Free!)
- **Backend**: Infomaniak VPS at `83.228.207.199` or `api.piogino.ch`
- **OBS**: Reads from GitHub Pages frontend (Browser Source)
- **Control**: Access from any device via GitHub Pages URL

**How it works:**
1. **Frontend** deployed to GitHub Pages (free hosting!)
2. **Backend** runs on your Infomaniak VPS (83.228.207.199)
3. Control from any device via `obs-media-control.piogino.ch`
4. Backend API at `api.piogino.ch` (or direct IP)
5. OBS Browser Sources point to GitHub Pages display URLs
6. All updates happen in real-time via WebSocket (200-500ms)

---

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- WebSocket (Socket.io)
- SQLite / PostgreSQL
- Multer (file uploads)

### Frontend
- React 18
- Vite
- Tailwind CSS
- Socket.io-client

### Deployment
- **Frontend**: GitHub Pages (free hosting)
- **Backend**: Infomaniak VPS (your existing server)
- **Domain**: obs-media-control.piogino.ch
- Nginx reverse proxy
- PM2 process manager
- Let's Encrypt SSL

---

## 📱 Typical Workflow

### Setup Phase
1. Upload your images to the library
2. Create scene presets (e.g., "Intro", "Products", "Closing")
3. Configure OBS Browser Sources for each slot

### During Your Stream/Meeting
1. Open control panel on iPad
2. Switch between pre-configured scenes with one tap
3. Or update individual slots on the fly
4. OBS updates automatically
5. No need to touch your laptop!

---

## 🎯 Current Status

**Version:** 1.0.0  
**Status:** ✅ Ready for Deployment

### Completed
- ✅ Complete project architecture
- ✅ Frontend fully implemented (React + Vite)
- ✅ Backend fully implemented (Node.js + Express)
- ✅ WebSocket real-time updates
- ✅ GitHub Actions deployment workflow
- ✅ Comprehensive documentation
- ✅ Backend code reviewed (96/100 score)

### Ready to Deploy
- 🚀 Frontend to GitHub Pages (automated)
- 🚀 Backend to Infomaniak VPS
- � DNS configuration
- � SSL certificates

### Coming in v1.1
- 🔜 Video support
- 🔜 Authentication system
- 🔜 Advanced scene features

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📖 Documentation improvements
- 🔧 Code contributions

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for the OBS Studio community
- Inspired by the need for better remote control during presentations
- Special thanks to all contributors and testers

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/piosteiner/obs-remote-media-controller/issues)
- **Discussions:** [GitHub Discussions](https://github.com/piosteiner/obs-remote-media-controller/discussions)
- **Website:** [https://obs-media-control.piogino.ch](https://obs-media-control.piogino.ch)

---

## 🗺️ Roadmap

**Phase 1 (MVP)** - Q4 2024
- Basic image control and scene management
- WebSocket real-time updates
- iPad-optimized interface

**Phase 2** - Q1 2025
- User authentication
- Advanced scene features
- Enhanced image library

**Phase 3** - Q2 2025
- Video support
- External integrations
- Advanced automation

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed roadmap.

---

## ⭐ Show Your Support

If this project helps you, please consider giving it a star on GitHub! It helps others discover the project.

---

**Made with ❤️ for the OBS community**

