# OBS Remote Media Controller - Complete Documentation

> **Version:** 1.0.0  
> **Last Updated:** October 15, 2025  
> **Live Site:** https://obs-media-control.piogino.ch

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [User Interface](#user-interface)
5. [Usage Guide](#usage-guide)
6. [OBS Configuration](#obs-configuration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Tips & Best Practices](#tips--best-practices)

---

## Overview

### What is OBS Remote Media Controller?

A web-based remote control system for OBS Studio that allows you to manage images and media sources from any device. Perfect for presenters, streamers, and content creators who need to control OBS media during live sessions without touching their main computer.

### Key Benefits

- 🎮 **Remote Control** - Manage OBS from iPad, phone, or another computer
- ⚡ **Real-time Updates** - Images appear in OBS instantly (200-500ms latency)
- 🎬 **Scene Presets** - Save and load complete slot configurations with one click
- 📱 **Mobile-Optimized** - Touch-friendly interface designed for iPad
- 🖼️ **Image Library** - Organize and reuse your images efficiently
- 🔄 **Multiple Input Methods** - Upload, paste, or use URLs

### Use Cases

#### 📊 Business Presentations
- Switch product images during demos
- Display QR codes for audience engagement
- Show charts and graphs on demand
- Professional image transitions

#### 🎮 Live Streaming
- Rotate sponsor logos
- Display viewer submissions
- Switch between game assets
- Show alerts and notifications

#### 🎓 Online Teaching
- Display course materials
- Switch between lesson slides
- Show student work
- Visual demonstrations

#### 🎪 Events & Webinars
- Speaker slides
- Sponsor acknowledgments
- Social media graphics
- Live polls and Q&A codes

---

## Getting Started

### Requirements

- **OBS Studio** 28.0 or higher
- **Web Browser** (Chrome, Edge, Firefox, or Safari)
- **Internet Connection** (for cloud deployment)
- **Device** (Windows, Mac, iPad, or smartphone)

### Quick Start (3 Steps)

#### 1. Access the Control Panel

Open your web browser and navigate to:
```
https://obs-media-control.piogino.ch/control
```

You can access this from:
- Your iPad during meetings
- Your phone for quick changes
- Another laptop for remote control
- Same computer running OBS

#### 2. Configure OBS

Add a Browser Source to your OBS scene:

1. Click **+** under Sources in OBS
2. Select **Browser**
3. Configure:
   - **Name:** Image Slot 1
   - **URL:** `https://obs-media-control.piogino.ch/display?slot=1`
   - **Width:** 1920 (match your canvas)
   - **Height:** 1080 (match your canvas)
   - ✅ Check "Shutdown source when not visible"

4. Position and resize in your scene

#### 3. Start Controlling

1. Go to the Control Panel
2. Click on Slot 1
3. Choose an input method:
   - **Library** - Pick from your saved images
   - **URL** - Enter an image URL
   - **Upload** - Select a file from your device
   - **Paste** - Paste from clipboard (Ctrl+V)
4. Watch the image appear in OBS instantly!

---

## Features

### 🎨 Image Management

#### Multiple Input Methods

**1. Library Picker**
- Browse your saved images
- Search by filename
- Click to select
- Visual thumbnail preview

**2. URL Input**
- Paste any image URL
- Supports: PNG, JPG, GIF, WebP
- Instant loading
- No upload needed

**3. File Upload**
- Select from your device
- Drag-and-drop support
- Multiple file selection
- Supports transparent PNGs

**4. Clipboard Paste**
- Copy image anywhere (Ctrl+C)
- Paste directly into slot (Ctrl+V)
- Works from screenshots, browsers, apps
- Fastest method for quick changes

#### Image Library Features

- 📚 **Central Library** - All images in one place
- 🔍 **Search** - Find images by filename
- 💾 **Save to Library** - Save any slot image for reuse
- 🗑️ **Delete** - Remove unused images
- 📱 **Responsive Grid** - Adapts to screen size
- ✨ **Quick Assign** - Click image to assign to slot

### 🎬 Scene Management

#### What are Scenes?

Scenes are saved configurations of multiple slots. Instead of manually setting up each slot every time, you can:
- Save current slot configuration as a scene
- Load entire scenes with one click
- Update existing scenes
- Delete scenes you no longer need

#### Scene Features

**Create Scene**
- Save current slot configuration
- Add name and description
- Captures all active slots
- Accessible from Control page

**Update Scene**
- Capture current slot state
- Overwrites existing scene
- Quick update button on each scene card
- No need to recreate scenes

**Load Scene**
- One-click loading
- Updates all slots simultaneously
- Visual feedback (toast notification)
- Instant OBS update

**Delete Scene**
- Confirmation dialog prevents accidents
- Permanent deletion
- Clean up unused scenes

#### Unified Scene Management

All scene operations are available directly on the Control page:
- ✅ No tab switching required
- ✅ Create scenes without leaving control
- ✅ Update scenes with one click
- ✅ Perfect for live events

### 🎯 Slot Controls

#### What are Slots?

Slots are individual image containers that correspond to OBS Browser Sources. Each slot:
- Has a unique number (1, 2, 3, 4...)
- Can display one image at a time
- Updates independently
- Has its own OBS Browser Source URL

#### Slot Operations

**Set Image**
- Four input methods (Library, URL, Upload, Paste)
- Preview before OBS update
- Automatic WebSocket sync
- Visual confirmation

**Save to Library**
- Blue save icon button
- Saves current image to library
- Extracts filename automatically
- Reuse image in other slots

**Clear Slot**
- Red X button
- Removes image from slot
- Clears OBS display
- Instant update

### 🔔 Real-time Updates

#### WebSocket Technology

- **Live Connection** - Always connected to backend
- **Instant Sync** - Changes appear in 200-500ms
- **All Devices** - Updates sent to all connected clients
- **Auto-Reconnect** - Handles network interruptions
- **Status Indicator** - Green dot shows connection status

#### Connection Status

**🟢 Connected** - Real-time updates active
- All features working
- Instant OBS updates
- Multiple device sync

**🔴 Disconnected** - Attempting to reconnect
- Automatic reconnection attempts
- Features may be limited
- Check your internet connection

### 🎨 User Interface

#### Pages

**Control Page** (`/control`)
- Main control interface
- Scene management
- Slot controls
- Most used page

**Library Page** (`/library`)
- Browse all images
- Search and filter
- Upload images
- Paste from clipboard
- Delete images

**Scenes Page** (`/scenes`)
- Alternative scene view
- Full scene list
- Create/edit/delete

**Help Page** (`/help`)
- Quick setup guide
- Feature documentation
- Troubleshooting tips
- OBS configuration

#### Navigation

Simple header menu:
- **Control** - Main page
- **Scenes** - Scene list (optional)
- **Library** - Image library
- **Help** - Documentation

#### Responsive Design

**Desktop (>1024px)**
- Full grid layouts
- Side-by-side panels
- Maximum information density

**Tablet (640-1024px)**
- Optimized for iPad
- Touch-friendly buttons (44px minimum)
- Compact layouts

**Mobile (<640px)**
- Single column
- Large touch targets
- Essential features only

### 🎨 Visual Feedback

#### Toast Notifications

Appear in bottom-right corner with:
- ✅ **Success** (green) - Operation completed
- ❌ **Error** (red) - Something went wrong
- ⚠️ **Warning** (yellow) - Important notice
- ℹ️ **Info** (blue) - General information

Auto-dismiss after 3 seconds with smooth fade-out animation.

#### Modals

**Custom Dialog Boxes**
- Beautiful, professional design
- Keyboard shortcuts (ESC to close, Enter to submit)
- Click outside to dismiss
- Smooth animations

**Types:**
- Create Scene modal
- Delete confirmation dialog
- Library picker modal

---

## User Interface

### Control Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  OBS Media Controller                    [Control] [Library] [Help] │
├─────────────────────────────────────────────────────────┤
│  🟢 Connected                                           │
├─────────────────────────────────────────────────────────┤
│  📚 Scene Presets                    [+ Create Scene]  │
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │ Intro    │ Main     │ Products │ Outro    │        │
│  │ Slots: 2 │ Slots: 3 │ Slots: 4 │ Slots: 1 │        │
│  │ [📸][▶] │ [📸][▶] │ [📸][▶] │ [📸][▶] │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
├─────────────────────────────────────────────────────────┤
│  📺 Current Slots                    [Image Library]   │
│  ┌───────────────────────────────────────────────┐     │
│  │ Slot 1                              [💾][❌]   │     │
│  │ ┌───────────────────────────────────────────┐ │     │
│  │ │         [Preview Image]                   │ │     │
│  │ └───────────────────────────────────────────┘ │     │
│  │ [📚 Library][🔗 URL][📤 Upload][📋 Paste]    │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Slot 2                              [💾][❌]   │     │
│  │ ┌───────────────────────────────────────────┐ │     │
│  │ │         [Empty - No Image]                │ │     │
│  │ └───────────────────────────────────────────┘ │     │
│  │ [📚 Library][🔗 URL][📤 Upload][📋 Paste]    │     │
│  └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Scene Card Features

Each scene shows:
- **Name** - Scene title
- **Description** - Optional details
- **Slot Count** - Number of slots configured
- **Update Button** (📸) - Capture current slots
- **Load Button** (▶) - Apply scene
- **Delete Button** (🗑️) - Remove scene

### Slot Control Features

Each slot shows:
- **Slot Number** - Identifier
- **Image Preview** - Current image or placeholder
- **Save Button** (💾) - Save to library
- **Clear Button** (❌) - Remove image
- **Four Input Buttons** - Library, URL, Upload, Paste

---

## Usage Guide

### Basic Workflow

#### For iPad Control During Meetings

**Before Meeting:**
1. Open Library page on laptop
2. Upload all images you might need
3. Create scene presets (Intro, Main, Closing)
4. Test scenes in OBS

**During Meeting:**
1. Open Control page on iPad: `https://obs-media-control.piogino.ch/control`
2. Load "Intro" scene
3. When ready, load "Main" scene
4. Change individual slots as needed
5. Load "Closing" scene at end

**Advantages:**
- No touching laptop during meeting
- Professional image transitions
- Quick scene switching
- Prepare everything in advance

### Common Workflows

#### Workflow 1: Quick Image Update

```
1. Copy image (Ctrl+C)
2. Open Control page
3. Click slot card
4. Click "Paste" button
5. Press Ctrl+V
6. Image appears in OBS immediately!
```

**Time:** < 5 seconds

#### Workflow 2: Library Management

```
1. Open Library page
2. Click "Upload Images"
3. Select multiple files
4. Images upload to library
5. Go to Control page
6. Click "Library" on any slot
7. Select image from library
8. Image loads into slot
```

**Time:** ~30 seconds for multiple images

#### Workflow 3: Scene Presets

```
1. Set up Slot 1: logo.png
2. Set up Slot 2: product-a.jpg
3. Set up Slot 3: qr-code.png
4. Click "Create Scene"
5. Name: "Product Demo"
6. Click "Create Scene"
7. Scene saved!

Next time:
1. Click "Load" on "Product Demo"
2. All 3 slots load instantly!
```

**Time:** 5 seconds to load complete scene

#### Workflow 4: Update Existing Scene

```
1. Load "Product Demo" scene
2. Change Slot 2 to different product
3. Click "Update" button on scene card
4. Scene updated with new configuration!
```

**Time:** < 3 seconds

### Advanced Features

#### Save Slot to Library

1. Add image to slot (any method)
2. Click **Save** button (💾) in slot header
3. Image saved to library
4. Success notification appears
5. Now available in Library picker

**Use Cases:**
- Paste temporary image → test → save if good
- Convert URL images to library for faster loading
- Build library from active slots

#### Multi-Slot Scenes

1. Configure multiple slots:
   - Slot 1: Company logo
   - Slot 2: Presenter photo
   - Slot 3: Slide content
   - Slot 4: QR code
2. Click "Create Scene"
3. Name: "Full Presentation"
4. All 4 slots saved together
5. Load all 4 with one click next time!

#### Library Organization

**Tips:**
- Use descriptive filenames
- Group similar images (prefix naming)
- Delete unused images regularly
- Search bar for quick finding

**Examples:**
- `logo-company.png`
- `product-a-front.jpg`
- `slide-01-intro.png`
- `qr-website.png`

---

## OBS Configuration

### Basic Setup

#### Adding Browser Sources

**For Each Slot:**

1. In OBS, click **+** under Sources
2. Select **Browser**
3. Name it: "Image Slot 1"
4. Click **OK**

**Configure:**
```
URL: https://obs-media-control.piogino.ch/display?slot=1
Width: 1920
Height: 1080
FPS: 30
Custom CSS: body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
```

**Options:**
- ✅ Shutdown source when not visible
- ✅ Refresh browser when scene becomes active (optional)

5. Click **OK**
6. Position and resize in your scene

#### Multiple Slots

Create separate Browser Sources:
- Slot 1: `...display?slot=1`
- Slot 2: `...display?slot=2`
- Slot 3: `...display?slot=3`
- Slot 4: `...display?slot=4`

### Advanced OBS Setup

#### Transparent Backgrounds

Browser sources support transparency:
- PNG images with alpha channel display correctly
- Black background replaced with transparency
- Perfect for overlays

#### Positioning & Sizing

**Full Screen:**
- Match canvas size (1920x1080)
- Position at 0,0
- Fill entire screen

**Picture-in-Picture:**
- Smaller browser source (640x360)
- Position in corner
- Scale to fit

**Multiple Overlays:**
- Different sizes for different slots
- Layer with other sources
- Independent control

#### Scene Organization

**Recommended Structure:**

```
Scene: Opening
├── Browser Source (Slot 1) - Full screen logo
└── Audio Source

Scene: Main Content
├── Video Capture
├── Browser Source (Slot 1) - Logo overlay
├── Browser Source (Slot 2) - Lower third
└── Browser Source (Slot 3) - QR code corner

Scene: Closing
├── Browser Source (Slot 1) - Thank you image
└── Audio Source
```

#### Performance Tips

1. **Shutdown when not visible** - Saves resources
2. **Limit FPS to 30** - Images don't need 60fps
3. **Size appropriately** - Don't use 4K for small overlays
4. **Refresh on scene activate** - Ensures fresh content

### Troubleshooting OBS

#### Images not showing

**Check:**
1. Browser source URL is correct
2. Internet connection is active
3. Control panel shows green "Connected"
4. Right-click source → **Interact** to see browser console

**Solutions:**
- Click "Refresh cache of current page" in source properties
- Re-enter URL and click OK
- Check firewall isn't blocking connection

#### Slow updates

**Possible causes:**
- Slow internet connection
- Large image files (>5MB)
- Server issues

**Solutions:**
- Use smaller image files
- Compress images before upload
- Check backend server status

#### Connection lost

**When this happens:**
- Display pages attempt auto-reconnect
- Images remain visible
- Updates resume when connection restored

**Actions:**
- Wait for auto-reconnect (30 seconds)
- Check internet connection
- Refresh browser source manually

---

## Deployment

### Frontend Deployment (GitHub Pages)

The frontend is hosted on GitHub Pages for free, fast, global delivery.

#### One-Time Setup

**1. Configure GitHub Pages:**

Go to: https://github.com/piosteiner/obs-remote-media-controller/settings/pages

Settings:
- **Source:** Deploy from a branch
- **Branch:** `gh-pages` / `root`
- **Custom domain:** `obs-media-control.piogino.ch`
- **Enforce HTTPS:** ✅

**2. Configure DNS:**

Add CNAME record in your DNS:
```
Type: CNAME
Name: obs-media-control
Target: piosteiner.github.io.
TTL: 3600
```

#### Deploy Updates

From your Windows PC:

```powershell
cd frontend
npm run deploy
```

**That's it!** The command:
1. Builds the React application
2. Pushes to `gh-pages` branch
3. GitHub Pages serves the new version

**Wait 1-2 minutes**, then visit: `https://obs-media-control.piogino.ch`

#### First Deployment Checklist

- ✅ Node.js installed
- ✅ Run `npm install` in frontend folder
- ✅ GitHub Pages settings configured
- ✅ DNS CNAME record added
- ✅ Run `npm run deploy`
- ⏳ Wait 5-10 minutes for DNS propagation
- ✅ Visit site and test!

### Backend Configuration

The backend runs on your VPS at `api.piogino.ch/obs`.

Frontend connects automatically - no additional configuration needed.

**Backend API:** `https://api.piogino.ch/obs`
**WebSocket:** `wss://api.piogino.ch/obs`

### Local Development

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

**Backend:**
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:3003
```

---

## Troubleshooting

### Frontend Issues

#### Changes not appearing after deploy

**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache
3. Wait 2-3 minutes for CDN propagation
4. Try incognito mode

#### Deploy command fails

**Solution:**
```powershell
cd frontend
npm install  # Reinstall dependencies
npm run deploy
```

#### Site shows 404

**Check:**
- GitHub Pages settings are correct
- `gh-pages` branch exists
- Wait 10 minutes after first deploy
- DNS CNAME is configured

### Connection Issues

#### "Disconnected" status

**Causes:**
- Backend server down
- Network issues
- Firewall blocking WebSocket

**Solutions:**
1. Check backend status
2. Verify internet connection
3. Try different network
4. Check browser console for errors

#### WebSocket connection failed

**Check:**
1. Backend is running (`pm2 status` on server)
2. Firewall allows WebSocket connections
3. Nginx WebSocket config is correct
4. SSL certificate is valid

### Image Issues

#### Images not loading

**Check:**
1. File size < 10MB
2. Supported format (PNG, JPG, GIF, WebP)
3. Valid image URL
4. Network connection active

**Solutions:**
- Try smaller file
- Use different format
- Re-upload image
- Check browser console

#### Paste not working

**Try:**
1. Click the paste button first
2. Use the blue paste area (Ctrl+V)
3. Grant clipboard permission if prompted
4. Use Upload button as alternative

#### Library images not showing

**Check:**
1. Backend PUBLIC_URL configured
2. Images uploaded successfully
3. Network tab shows 200 responses
4. Clear browser cache

### OBS Issues

#### Browser source blank

**Solutions:**
1. Right-click → **Refresh cache of current page**
2. Check URL is correct
3. Enable **Interact** and check console
4. Verify internet connection

#### Updates not appearing in OBS

**Check:**
1. OBS browser source URL matches slot number
2. Green "Connected" status in control panel
3. Image actually changed (not same image)
4. Browser source is visible in OBS

**Try:**
- Refresh browser source
- Toggle source visibility
- Check if other slots update
- Restart OBS

### Database/Storage Issues

#### Upload fails

**Check:**
1. File size under limit (10MB)
2. Disk space available on server
3. Upload directory permissions
4. Network connection stable

#### Images disappear after server restart

**Note:** Images are stored persistently in SQLite database and filesystem. They should not disappear.

**If they do:**
1. Check database file exists
2. Check uploads directory permissions
3. Verify PM2 is saving state
4. Check server logs for errors

### Getting Help

1. **Check browser console** (F12)
2. **Check backend logs** (`pm2 logs`)
3. **Verify connection status** (green dot)
4. **Test with simple image** (small JPG)
5. **Try incognito mode** (rules out extensions)

**Still stuck?**
- Review [API Documentation](docs/API.md)
- Check [Architecture](docs/ARCHITECTURE.md)
- Open GitHub Issue with details

---

## Tips & Best Practices

### Performance

**Image Optimization:**
- Compress images before upload (use TinyPNG)
- Keep files under 2MB for best performance
- Use appropriate dimensions (don't upload 4K for small overlays)
- WebP format offers best compression

**Network:**
- Use wired connection for OBS machine when possible
- Ensure stable internet during live events
- Test connection beforehand
- Have backup images ready

**OBS:**
- Enable "Shutdown source when not visible"
- Use appropriate FPS (30 is fine for images)
- Don't have too many browser sources active
- Close Interact windows when done

### Organization

**Image Library:**
- Use descriptive filenames
- Prefix with category (e.g., `logo-`, `product-`, `slide-`)
- Delete unused images regularly
- Keep library under 100 images for best performance

**Scenes:**
- Name scenes clearly ("Meeting Intro", not "Scene 1")
- Add descriptions for complex scenes
- Update scenes when you change content
- Delete outdated scenes

**Slots:**
- Document which slot is used for what
- Keep slot count manageable (4-6 is plenty)
- Use consistent slot numbers across scenes

### Workflow Efficiency

**Before Events:**
1. Upload all potential images to library
2. Create all scene presets
3. Test each scene in OBS
4. Practice transitions
5. Have backup images ready

**During Events:**
1. Use scene presets primarily
2. Only change individual slots when needed
3. Have iPad easily accessible
4. Monitor connection status
5. Keep backup device ready

**After Events:**
1. Save any new good combinations as scenes
2. Delete temporary images
3. Update scene descriptions with notes
4. Archive images you might reuse

### Security

**Best Practices:**
- Don't upload sensitive information
- Review images before displaying
- Clear slots after events if sensitive
- Keep backup of important images locally
- Monitor who has access to control panel

**Future Features (Phase 2):**
- User authentication
- Password protection
- Access logging
- Image encryption

### iPad Optimization

**Setup:**
- Bookmark control panel URL
- Add to home screen for app-like experience
- Use external keyboard for paste shortcuts
- Enable Do Not Disturb during events

**Usage:**
- Landscape mode for best layout
- Two-finger tap for back navigation
- Swipe up for multitasking
- Use Split View with presentation notes

### Backup Strategy

**Before Important Events:**
1. Export scene configurations (manual notes)
2. Download library images locally
3. Test everything 30 minutes before
4. Have USB drive with images as fallback
5. Know how to manually update OBS sources

**During Events:**
- Keep mobile hotspot ready as backup
- Have duplicate device logged in
- Know locations of all images
- Practice manual OBS operation

---

## Additional Resources

### Documentation
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Architecture](docs/ARCHITECTURE.md)** - Technical details
- **[Contributing](CONTRIBUTING.md)** - How to contribute

### Links
- **Live Site:** https://obs-media-control.piogino.ch
- **GitHub:** https://github.com/piosteiner/obs-remote-media-controller
- **Issues:** https://github.com/piosteiner/obs-remote-media-controller/issues

### Support
- Open GitHub Issue for bugs
- Start Discussion for questions
- Check existing issues first
- Provide details (browser, OS, steps to reproduce)

---

## Changelog

### Version 1.0.0 (October 2025)

**Features:**
- ✅ Remote image control from any device
- ✅ Real-time WebSocket updates
- ✅ Scene preset management
- ✅ Image library with search
- ✅ Multiple input methods (Library, URL, Upload, Paste)
- ✅ Save slots to library
- ✅ Unified scene management on Control page
- ✅ Custom modals and toast notifications
- ✅ iPad-optimized interface
- ✅ Transparent PNG support
- ✅ Auto-reconnection logic

**Deployment:**
- ✅ Frontend on GitHub Pages
- ✅ Backend on Infomaniak VPS
- ✅ Custom domain configured
- ✅ SSL certificates active

---

**Made with ❤️ for the OBS community**

For questions, issues, or contributions, visit our [GitHub repository](https://github.com/piosteiner/obs-remote-media-controller).
