# Help Page - User Guide & Setup Instructions

## What's New? 📚

Added a comprehensive **Help page** to the website with:
- Complete OBS setup instructions
- How to use each page (Control, Library, Scenes, Display)
- Example workflows
- Troubleshooting guide
- Tips & tricks

## Access the Help Page

### From Navigation
Click the **"Help"** button (🔍 icon) in the header navigation.

### Direct URL
```
https://obs-media-control.piogino.ch/help
```

## What's Included

### 1. OBS Setup Instructions
Step-by-step guide to configure OBS:
- How to create Browser Sources
- Exact URLs to use for each slot
- Width/height settings
- Recommended configurations
- Multiple slot setup

### 2. Control Page Guide
- Three ways to add images (URL, Upload, Paste)
- How to clear slots
- Best practices for live presentations
- iPad/mobile control tips

### 3. Library Page Guide
- Four ways to add images (Add URL, Paste, Upload, Search)
- How to assign images to slots
- Delete images from library
- Pre-meeting preparation workflow

### 4. Scenes Guide
- How to create scene presets
- Loading saved scenes
- Status note (backend integration coming soon)

### 5. Display Page Explanation
- What Display pages are for
- URL format for OBS
- How WebSocket updates work
- Preview in browser

### 6. Example Workflows
- Live Presentation (iPad control)
- Pre-Meeting Prep (Library usage)
- Screenshot Sharing (Paste workflow)
- Multi-Screen Setup (4 slots usage)

### 7. Troubleshooting
Common issues and solutions:
- Images not showing in OBS
- Images not updating
- Paste not working
- URL images not loading
- Direct URL access issues

### 8. Tips & Tricks
- Best practices
- Performance optimization
- Creative use cases
- Keyboard shortcuts (future)

## Features

### Collapsible Sections
Each section can be expanded/collapsed:
- Click section header to expand/collapse
- Only one section expanded at a time (cleaner UI)
- Visual indicators (chevron icons)
- Smooth transitions

### Visual Design
- 📖 Icons for each section
- Color-coded tip boxes:
  - 💡 Blue: Pro Tips
  - ✨ Green: Best Practices
  - ⚠️ Yellow: Warnings/Notes
  - 🎨 Purple/Blue gradient: Creative ideas

### Responsive Layout
- Mobile-friendly
- Readable on iPad
- Desktop optimized
- Scrollable sections

## Section Icons

| Section | Icon | Color |
|---------|------|-------|
| OBS Setup | Settings ⚙️ | Primary Blue |
| Control Page | Smartphone 📱 | Primary Blue |
| Library | Image 🖼️ | Primary Blue |
| Scenes | Layers 📚 | Primary Blue |
| Display | Monitor 🖥️ | Primary Blue |
| Workflows | Book 📖 | Primary Blue |
| Troubleshooting | Settings ⚙️ | Primary Blue |
| Tips & Tricks | Book 📖 | Primary Blue |

## Navigation Integration

### Header Navigation
Added "Help" button to header:
```
[Control] [Scenes] [Library] [Help]
```

### Help Icon
Uses HelpCircle icon (🔍) from lucide-react

### Active State
Help button highlights when on /help page

## Files Changed

1. **`frontend/src/pages/Help.jsx`** (NEW)
   - Complete help page component
   - 8 collapsible sections
   - Rich content with examples
   - Troubleshooting guides

2. **`frontend/src/App.jsx`** (UPDATED)
   - Added Help route: `/help`
   - Imported Help component

3. **`frontend/src/components/common/Header.jsx`** (UPDATED)
   - Added Help to navigation
   - Imported HelpCircle icon
   - Active state handling

## Key Content Highlights

### OBS Browser Source URLs
```
Slot 1: https://obs-media-control.piogino.ch/display?slot=1
Slot 2: https://obs-media-control.piogino.ch/display?slot=2
Slot 3: https://obs-media-control.piogino.ch/display?slot=3
Slot 4: https://obs-media-control.piogino.ch/display?slot=4
```

### Recommended OBS Settings
- Width: 1920 (or custom)
- Height: 1080 (or custom)
- ✓ Shutdown source when not visible
- ✓ Refresh browser when scene becomes active

### Common Workflows

**Live Presentation:**
1. OBS on computer
2. Control page on iPad
3. Present from computer
4. Switch images from iPad
5. Professional!

**Pre-Meeting Prep:**
1. Upload all images to Library
2. During meeting: Click to assign
3. No fumbling with files!

## Benefits

✅ **Self-service help** - Users can learn without asking  
✅ **Complete setup guide** - From zero to working OBS setup  
✅ **Troubleshooting** - Common issues addressed  
✅ **Best practices** - Learn optimal workflows  
✅ **Always accessible** - Help button always visible  
✅ **Searchable** - Can Ctrl+F within page  

## Future Enhancements

Potential additions:
- [ ] Video tutorials
- [ ] Animated GIFs showing workflows
- [ ] FAQ section
- [ ] Quick start guide (condensed version)
- [ ] Keyboard shortcuts reference
- [ ] Community tips section
- [ ] Integration with other streaming tools

## SEO Benefits

The Help page includes:
- Comprehensive text content
- Structured headings (H1-H4)
- Clear navigation
- External links (GitHub)
- Descriptive URLs

## User Experience

### First-Time Users
Clear path from "How do I set this up?" to working system:
1. Click Help in navigation
2. Expand "OBS Setup Instructions"
3. Follow step-by-step guide
4. Start using the tool!

### Experienced Users
Quick reference for:
- Troubleshooting
- Advanced workflows
- Tips & tricks
- Keyboard shortcuts (future)

## Deploy

```bash
cd frontend
npm run deploy
```

The Help page will be available at:
```
https://obs-media-control.piogino.ch/help
```

## Testing Checklist

- [ ] Navigate to /help page
- [ ] Click each section to expand/collapse
- [ ] Verify all content is readable
- [ ] Check on mobile device
- [ ] Test Help button in header
- [ ] Verify active state on /help
- [ ] Test external links (GitHub)
- [ ] Check code examples are formatted
- [ ] Verify tip boxes render correctly
- [ ] Test on iPad

## Content Updates

To update help content:
1. Edit `frontend/src/pages/Help.jsx`
2. Find the appropriate `<Section>` component
3. Update the content inside
4. Deploy

Easy to maintain and expand!

## Summary

Now users have:
- ✅ Complete setup instructions
- ✅ Usage guides for every page
- ✅ Troubleshooting help
- ✅ Example workflows
- ✅ Tips for best results

No more confusion about how to use the tool! 🎉
