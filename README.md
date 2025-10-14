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

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **OBS Studio** 28+ ([Download](https://obsproject.com/))
- A web server (local or cloud) for hosting

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/piosteiner/obs-remote-media-controller.git
   cd obs-remote-media-controller
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Configure OBS**
   - Add a Browser Source in OBS
   - URL: `https://obs-media-control.piogino.ch/display?slot=1`
   - Width: 1920, Height: 1080 (or your canvas size)
   - Check "Shutdown source when not visible"

5. **Open Control Panel**
   - Navigate to `https://obs-media-control.piogino.ch/control`
   - Upload an image or paste a URL
   - Watch it appear in OBS!

---

## 📖 Documentation

- **[Project Plan](PROJECT_PLAN.md)** - Complete project roadmap and architecture
- **[Setup Guide](docs/SETUP.md)** - Detailed setup instructions *(coming soon)*
- **[API Reference](docs/API.md)** - API documentation *(coming soon)*
- **[User Guide](docs/USER_GUIDE.md)** - How to use all features *(coming soon)*
- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture details *(coming soon)*

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
│   Your iPad/    │◄───────►│  Cloud Server    │◄───────►│  OBS Machine    │
│   Phone         │  HTTPS  │                  │WebSocket│  (Laptop)       │
│                 │         │  - Backend API   │         │                 │
│  Control Panel  │         │  - Frontend      │         │  Browser Source │
└─────────────────┘         │  - WebSocket     │         │  (Display Page) │
                            │  - Image Storage │         └─────────────────┘
                            └──────────────────┘
```

**How it works:**
1. You control media from any device via the web interface
2. Changes are sent to the cloud server
3. Server broadcasts updates via WebSocket
4. OBS Browser Sources receive updates and display new media
5. All happens in real-time (200-500ms)

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
- Cloud Server (backend)
- GitHub Pages (frontend option)
- Nginx (reverse proxy)
- PM2 (process manager)

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

**Version:** 1.0.0 (In Development)  
**Status:** 🚧 Planning & Initial Development

### Completed
- ✅ Project planning and architecture design
- ✅ Repository setup
- ✅ Documentation framework

### In Progress
- ⏳ Backend API development
- ⏳ Frontend UI development
- ⏳ WebSocket implementation

### Coming Soon
- 🔜 MVP release
- 🔜 Deployment to production
- 🔜 User testing and feedback
- 🔜 Video support
- 🔜 Authentication system

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

