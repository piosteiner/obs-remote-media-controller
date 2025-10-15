# OBS Remote Media Controller# OBS Remote Media Controller



> 🎬 Control OBS Studio media remotely from any device - iPad, phone, or computer.> 🎬 Control OBS Studio media remotely from any device - iPad, phone, or computer.



[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)



**Live Demo:** [obs-media-control.piogino.ch](https://obs-media-control.piogino.ch)**Live Demo:** [obs-media-control.piogino.ch](https://obs-media-control.piogino.ch)



------



## 🎯 What is This?## 🎯 What is This?



A web-based remote control for OBS Studio that lets you manage images and scenes from any device. Perfect for:A web-based remote control for OBS Studio that lets you manage images and scenes from any device. Perfect for:

- 📊 **Business presentations** - Switch slides from your iPad- 📊 **Business presentations** - Switch slides from your iPad

- 🎮 **Live streaming** - Update overlays without touching OBS- 🎮 **Live streaming** - Update overlays without touching OBS

- 🎓 **Online teaching** - Display materials on demand- 🎓 **Online teaching** - Display materials on demand

- 🎪 **Events & webinars** - Professional media management- 🎪 **Events & webinars** - Professional media management



### The Problem It Solves### The Problem It Solves



❌ Manually updating OBS image sources during live events  ❌ Manually updating OBS image sources during live events  

❌ Interrupting presentations to change media  ❌ Interrupting presentations to change media  

❌ Complex OBS navigation while presenting  ❌ Complex OBS navigation while presenting  



✅ Control OBS remotely from iPad/phone  ✅ Control OBS remotely from iPad/phone  

✅ One-click scene switching  ✅ One-click scene switching  

✅ Real-time updates (200-500ms)  ✅ Real-time updates (200-500ms)  



------



## ✨ Key Features## ✨ Key Features



- 🎮 **Remote Control** - Manage from iPad, phone, or any device## ✨ Key Features

- ⚡ **Real-time Updates** - WebSocket sync (200-500ms latency)

- 🎬 **Scene Presets** - Save and load complete configurations- 🎮 **Remote Control** - Manage from iPad, phone, or any device

- 🖼️ **Image Library** - Organize and reuse images- ⚡ **Real-time Updates** - WebSocket sync (200-500ms latency)

- 📋 **Multiple Inputs** - Upload, paste, URL, or library- 🎬 **Scene Presets** - Save and load complete configurations

- 💾 **Save to Library** - Keep images for reuse- 🖼️ **Image Library** - Organize and reuse images

- 📱 **Mobile-Optimized** - Touch-friendly iPad interface- 📋 **Multiple Inputs** - Upload, paste, URL, or library

- 🔄 **Auto-Reconnect** - Handles network interruptions- 💾 **Save to Library** - Keep images for reuse

- 📱 **Mobile-Optimized** - Touch-friendly iPad interface

---- 🔄 **Auto-Reconnect** - Handles network interruptions



## 🚀 Quick Start---



### 1. Access Control Panel## 🚀 Quick Start



Visit from any device:### 1. Access Control Panel

```

https://obs-media-control.piogino.ch/controlVisit from any device:

``````

https://obs-media-control.piogino.ch/control

### 2. Configure OBS```



Add a **Browser Source**:### 2. Configure OBS

- **URL:** `https://obs-media-control.piogino.ch/display?slot=1`

- **Width:** 1920, **Height:** 1080Add a **Browser Source**:

- ✅ Check "Shutdown source when not visible"- **URL:** `https://obs-media-control.piogino.ch/display?slot=1`

- **Width:** 1920, **Height:** 1080

### 3. Control Images- ✅ Check "Shutdown source when not visible"



- Upload, paste, or use URLs### 3. Control Images

- Images appear in OBS instantly

- Create scenes for quick switching- Upload, paste, or use URLs

- Images appear in OBS instantly

**That's it!** See **[DOCUMENTATION.md](DOCUMENTATION.md)** for the complete guide.- Create scenes for quick switching



---**That's it!** See [DOCUMENTATION.md](DOCUMENTATION.md) for complete guide.



## 📖 Documentation---



- **[Complete Documentation](DOCUMENTATION.md)** - Full user guide with all features## 📖 Documentation

- **[API Reference](docs/API.md)** - Complete API documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Technical architecture details- **[Complete Documentation](DOCUMENTATION.md)** - Full user guide

- **[Contributing](CONTRIBUTING.md)** - How to contribute- **[API Reference](docs/API.md)** - API documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Technical details

---- **[Contributing](CONTRIBUTING.md)** - Contribution guide



## 🏗️ Architecture---



```## 🏗️ Architecture

┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐

│   Your iPad/    │         │  GitHub Pages    │         │  OBS Machine    │```

│   Phone         │◄───────►│  (Frontend)      │◄───────►│  (Laptop)       │┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐

│                 │  HTTPS  │                  │WebSocket│                 ││   Your iPad/    │         │  GitHub Pages    │         │  OBS Machine    │

│  Control Panel  │         │  obs-media-      │         │  Browser Source ││   Phone         │◄───────►│  (Frontend)      │◄───────►│  (Laptop)       │

│                 │         │  control.piogino │         │  (Display Page) ││                 │  HTTPS  │                  │WebSocket│                 │

│                 │         │  .ch             │         │                 ││  Control Panel  │         │  obs-media-      │         │  Browser Source │

└─────────────────┘         └────────┬─────────┘         └─────────────────┘│                 │         │  control.piogino │         │  (Display Page) │

                                     ││                 │         │  .ch             │         │                 │

                                     │ HTTPS/WSS└─────────────────┘         └────────┬─────────┘         └─────────────────┘

                                     ▼                                     │

                            ┌──────────────────┐                                     │ HTTPS/WSS

                            │  VPS Backend     │                                     ▼

                            │  api.piogino.ch  │                            ┌──────────────────┐

                            │                  │                            │  VPS Backend     │

                            │  - REST API      │                            │  api.piogino.ch  │

                            │  - WebSocket     │                            │                  │

                            │  - SQLite DB     │                            │  - REST API      │

                            │  - Image Storage │                            │  - WebSocket     │

                            └──────────────────┘                            │  - SQLite DB     │

```                            │  - Image Storage │

                            └──────────────────┘

**Deployment:**```

- Frontend: GitHub Pages (free hosting)

- Backend: VPS at api.piogino.ch**Deployment:**

- OBS: Reads from GitHub Pages display URLs- Frontend: GitHub Pages (free hosting)

- Backend: VPS at api.piogino.ch

---- OBS: Reads from GitHub Pages display URLs



## 🛠️ Technology Stack---



**Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client  ## 🛠️ Technology Stack

**Backend:** Node.js, Express, Socket.io, SQLite, PM2  

**Deployment:** GitHub Pages, Nginx, Let's Encrypt SSL**Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client  

**Backend:** Node.js, Express, Socket.io, SQLite, PM2  

---**Deployment:** GitHub Pages, Nginx, Let's Encrypt SSL



## 🎨 Use Cases---



**📊 Business Presentations** - Switch product images, display QR codes, show charts  ## 🎨 Use Cases

**🎮 Live Streaming** - Rotate sponsor logos, display viewer submissions  

**🎓 Online Teaching** - Display course materials, switch lesson slides  ### 📊 Business Presentations

**🎪 Events & Webinars** - Speaker slides, sponsor acknowledgments, polls  - Switch product images during demos

- Display QR codes for audience engagement

---- Show charts and graphs on demand



## 📱 Typical Workflow### 🎮 Live Streaming

- Rotate sponsor logos

**Setup Phase:**- Display viewer submissions

1. Upload images to library- Switch between game assets

2. Create scene presets- Show alerts and notifications

3. Configure OBS Browser Sources

### 🎓 Online Teaching

**During Event (iPad):**- Display course materials

1. Open control panel- Switch between lesson slides

2. Load scenes with one tap- Show student work

3. Update individual slots as needed- Visual demonstrations

4. No touching your laptop!

### 🎪 Events & Webinars

---- Speaker slides

- Sponsor acknowledgments

## 🎯 Current Status- Social media graphics

- Live polls and Q&A codes

**Version:** 1.0.0 ✅ Production Ready

---

**Completed:**

- ✅ Frontend & backend fully implemented## 🏗️ Architecture Overview

- ✅ Real-time WebSocket updates

- ✅ GitHub Pages deployment```

- ✅ Scene management & image library┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐

- ✅ Mobile-optimized interface│   Your iPad/    │         │  GitHub Pages    │         │  OBS Machine    │

- ✅ Comprehensive documentation│   Phone         │◄───────►│  (Frontend)      │◄───────►│  (Laptop)       │

│                 │  HTTPS  │                  │WebSocket│                 │

**Coming Soon (v1.1):**│  Control Panel  │         │  obs-media-      │         │  Browser Source │

- 🔜 Video support│                 │         │  control.piogino │         │  (Display Page) │

- 🔜 User authentication│                 │         │  .ch             │         │                 │

- 🔜 Advanced scene features└─────────────────┘         └────────┬─────────┘         └─────────────────┘

                                     │

---                                     │ HTTPS/WSS

                                     ▼

## 🤝 Contributing                            ┌──────────────────┐

                            │  Infomaniak VPS  │

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.                            │  (Backend)       │

                            │  83.228.207.199  │

- 🐛 Bug reports                            │                  │

- 💡 Feature suggestions                            │  - API Server    │

- 📖 Documentation improvements                            │  - WebSocket     │

- 🔧 Code contributions                            │  - Image Storage │

                            └──────────────────┘

---```



## 📄 License**Deployment:**

- **Frontend**: GitHub Pages at `obs-media-control.piogino.ch` (Free!)

MIT License - see [LICENSE](LICENSE) file for details.- **Backend**: Infomaniak VPS at `83.228.207.199` or `api.piogino.ch`

- **OBS**: Reads from GitHub Pages frontend (Browser Source)

---- **Control**: Access from any device via GitHub Pages URL



## 📞 Support**How it works:**

1. **Frontend** deployed to GitHub Pages (free hosting!)

- **Documentation:** [DOCUMENTATION.md](DOCUMENTATION.md)2. **Backend** runs on your Infomaniak VPS (83.228.207.199)

- **Issues:** [GitHub Issues](https://github.com/piosteiner/obs-remote-media-controller/issues)3. Control from any device via `obs-media-control.piogino.ch`

- **Discussions:** [GitHub Discussions](https://github.com/piosteiner/obs-remote-media-controller/discussions)4. Backend API at `api.piogino.ch` (or direct IP)

5. OBS Browser Sources point to GitHub Pages display URLs

---6. All updates happen in real-time via WebSocket (200-500ms)



## ⭐ Show Your Support---



If this project helps you, give it a star on GitHub! ⭐## 🛠️ Technology Stack



---### Backend

- Node.js + Express

**Made with ❤️ for the OBS community**- WebSocket (Socket.io)

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

