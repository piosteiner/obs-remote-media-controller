# Add Image by URL to Library

## What's New? 🎉

Added **"Add URL"** button to Image Library page so you can add images directly from URLs!

## How to Use

1. Go to **Library** page
2. Click the gray **"Add URL"** button
3. Paste or type image URL (e.g., `https://example.com/image.jpg`)
4. Click **"Add"**
5. Image is added to your library! ✨

## Features

### Four Ways to Add Images to Library

| Method | Button Color | Use When |
|--------|-------------|----------|
| **Add URL** | ⚫ Gray | You have an image URL |
| **Paste** | 🟢 Green | Image copied to clipboard |
| **Upload** | 🔵 Blue | Files on your computer |
| **Search** | 🔍 Search bar | Finding existing images |

### Button Layout

```
┌─────────────────────────────────────────────────────────┐
│ [🔍 Search...]  [🔗 Add URL] [📋 Paste] [📤 Upload]    │
└─────────────────────────────────────────────────────────┘
```

## Example Workflow

### Scenario: Add D&D Beyond Avatar to Library

```
1. Right-click avatar on dndbeyond.com
2. Click "Copy image address"
3. Go to Library page
4. Click "Add URL" button
5. Paste URL: https://www.dndbeyond.com/avatars/...
6. Click "Add"
7. Image appears in library!
8. Click image to assign to slot
```

### Scenario: Multiple Sources

```
Morning prep:
1. Add 5 URLs from website
2. Upload 3 local files
3. Paste 2 screenshots

During meeting:
4. Click images to switch slots
5. Professional transitions!
```

## Benefits

✅ **No downloading** - Add images directly from web  
✅ **Fast workflow** - Copy URL → Paste → Add  
✅ **Any source** - Works with any public image URL  
✅ **Build library** - Collect images before meetings  
✅ **Remote resources** - Use CDN/cloud-hosted images  

## Technical Details

### API Call
```javascript
await imagesAPI.addUrl(url, 'Image from URL')
```

### Backend
The backend already supports this! It stores URL-based images differently from uploaded files:
- **Uploaded images**: Stored on server, full URL with PUBLIC_URL
- **URL images**: External URL, stored as reference

### Toast Notifications
- ✅ Success: "Image added from URL"
- ❌ Error: "Failed to add image from URL. Please check the URL."

## UI Components Added

1. **"Add URL" Button** (Gray)
   - Icon: Link (🔗)
   - Opens URL input form below

2. **URL Input Form**
   - Large text input for URL
   - "Add" button (submits)
   - "Cancel" button (closes form)
   - Auto-focus on input
   - Validation (must be valid URL)

3. **Responsive Design**
   - Mobile: Buttons stack vertically
   - Desktop: Buttons in row
   - URL form: Full width below buttons

## Supported URL Formats

Works with any public image URL:
- ✅ `https://example.com/image.jpg`
- ✅ `https://example.com/image.png`
- ✅ `https://cdn.example.com/images/photo.webp`
- ✅ `https://i.imgur.com/abc123.jpg`
- ✅ `https://www.dndbeyond.com/avatars/...`
- ❌ `file:///C:/Users/...` (local files - use Upload instead)
- ❌ Requires authentication (must be public URL)

## Error Handling

### Invalid URL
```
User: Enters "not a url"
System: Browser validates, prevents submit ❌
```

### URL doesn't exist (404)
```
User: Enters https://example.com/missing.jpg
System: "Failed to add image from URL" toast ❌
```

### CORS Issues
Some websites block hotlinking. If image doesn't load:
- Download image first
- Upload via "Upload Images" button instead

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click "Add URL" | Opens form |
| Auto-focus | Cursor in URL field |
| **Enter** | Submits URL |
| **Escape** | Cancel (via Cancel button) |

## Files Changed

- ✅ `frontend/src/pages/Library.jsx`
  - Added: `urlInput`, `showUrlInput` state
  - Added: `handleUrlSubmit()` function
  - Added: LinkIcon import
  - Added: "Add URL" button
  - Added: URL input form UI

## Deploy

```bash
cd frontend
npm run deploy
```

## Before vs After

### Before ❌
```
Library could add images via:
- Upload (file picker)
- Paste (clipboard)
```

### After ✅
```
Library can add images via:
- 🆕 URL (direct from web)
- Upload (file picker)
- Paste (clipboard)
```

## Testing Checklist

- [ ] Click "Add URL" button
- [ ] Form appears with input field
- [ ] Paste a valid image URL
- [ ] Click "Add"
- [ ] Success toast appears
- [ ] Image shows in library grid
- [ ] Click image to assign to slot
- [ ] Image loads in slot correctly
- [ ] Click "Cancel" closes form
- [ ] Try invalid URL (gets validation)
- [ ] Try 404 URL (gets error toast)

## Common Use Cases

### 1. Social Media Profile Pictures
```
Copy image URL from Twitter/LinkedIn
→ Add URL to library
→ Use in OBS presentations
```

### 2. Product Images
```
Copy product images from website
→ Add to library
→ Show during product demo
```

### 3. Reference Images
```
Find reference images on web
→ Add URLs to library
→ Quick reference during stream
```

### 4. Team Photos
```
Copy profile pics from company site
→ Build team member library
→ Show during introductions
```

## Next Steps

Your Library now has 4 input methods! 🎉

Deploy and test:
```bash
cd frontend
npm run deploy
```

Then try adding an image by URL to see it in action!
