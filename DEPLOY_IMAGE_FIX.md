# Quick Deployment Guide

## Summary
Fixed image upload issue where images returned "Image Not Found" due to relative URLs. Backend now returns full URLs like `https://api.piogino.ch/obs/uploads/image.jpg`.

## Files Changed
1. `backend/src/routes/images.js` - Added PUBLIC_URL support for image URLs
2. `backend/.env.example` - Updated with production values
3. `frontend/src/components/control/SlotControl.jsx` - Improved clipboard paste with fallback

## Deploy Backend (IMPORTANT!)

### Quick Steps:
```bash
# 1. Commit and push your changes
git add .
git commit -m "Fix image upload URLs and improve clipboard paste"
git push origin main

# 2. SSH to your VPS
ssh your-user@83.228.207.199

# 3. Navigate to backend and pull changes
cd /path/to/obs-webplugin/backend
git pull origin main

# 4. Create/update .env file
nano .env
```

Add this line to your .env file:
```
PUBLIC_URL=https://api.piogino.ch/obs
```

Full .env should look like:
```bash
NODE_ENV=production
PORT=3003
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
PUBLIC_URL=https://api.piogino.ch/obs
```

```bash
# 5. Restart backend
pm2 restart obs-backend  # or whatever you named it
pm2 logs obs-backend     # check logs

# 6. Test - upload an image and check the URL in logs
```

## Deploy Frontend (Optional - for improved clipboard)

```bash
cd frontend
npm run deploy
```

## Test

1. Go to https://obs-media-control.piogino.ch
2. Upload or paste an image
3. Image should load immediately ✅
4. Check browser Network tab - image URL should be full URL

## Expected Result

### Image URL in API response:
```json
{
  "url": "https://api.piogino.ch/obs/uploads/abc123def456.jpg"
}
```

NOT:
```json
{
  "url": "/uploads/abc123def456.jpg"  // This won't work!
}
```

## Troubleshooting

If images still don't load:
1. Check PM2 logs: `pm2 logs obs-backend`
2. Verify .env has PUBLIC_URL set
3. Test image URL directly in browser
4. Check Nginx is proxying /obs/uploads/ correctly
