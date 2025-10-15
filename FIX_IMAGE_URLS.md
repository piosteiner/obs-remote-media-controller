# Fix Image Upload URLs

## Problem
Images were uploading successfully but showing "Image Not Found" because the backend was returning relative URLs (`/uploads/image.jpg`) instead of full URLs (`https://api.piogino.ch/obs/uploads/image.jpg`).

## Solution
Updated backend to use `PUBLIC_URL` environment variable to construct full image URLs.

## Deployment Steps

### 1. SSH into your VPS
```bash
ssh your-user@83.228.207.199
```

### 2. Navigate to backend directory
```bash
cd /path/to/obs-webplugin/backend
```

### 3. Create .env file (if it doesn't exist)
```bash
nano .env
```

### 4. Add these environment variables:
```bash
NODE_ENV=production
PORT=3003
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
DATABASE_PATH=./data/obs.db
PUBLIC_URL=https://api.piogino.ch/obs
```

**IMPORTANT:** The `PUBLIC_URL` must include the `/obs` path since your backend runs behind Nginx with path-based routing!

Save and exit (Ctrl+X, then Y, then Enter)

### 5. Pull latest backend changes
```bash
git pull origin main
```

### 6. Restart the backend service
```bash
pm2 restart obs-backend
```

Or if you named it differently:
```bash
pm2 list  # Find the process name
pm2 restart <process-name>
```

### 7. Check logs
```bash
pm2 logs obs-backend
```

You should see the PUBLIC_URL being used when images are uploaded.

### 8. Test
1. Go to https://obs-media-control.piogino.ch
2. Upload or paste an image
3. Check the image URL in browser console
4. It should be: `https://api.piogino.ch/obs/uploads/xxxxx.jpg` ✅

## What Changed

### Before ❌
```javascript
url: '/uploads/image.jpg'  // Relative path - won't work!
```

### After ✅
```javascript
url: 'https://api.piogino.ch/obs/uploads/image.jpg'  // Full URL - works!
```

## Verification

After restarting, upload an image and check the Network tab:
- The upload response should include the full URL
- The image should load immediately in the slot
- No "Image Not Found" errors

## Important Notes

- Make sure the `PUBLIC_URL` environment variable matches your Nginx configuration
- The `/obs` path is critical since your backend is behind a reverse proxy
- The `uploads` directory must be served by Express (already configured in server.js)
- Nginx must proxy `/obs/uploads/*` to the backend

## Nginx Configuration Check

Your Nginx should have:
```nginx
location /obs/ {
    proxy_pass http://localhost:3003/;
    # ... other proxy settings
}
```

This ensures that requests to `https://api.piogino.ch/obs/uploads/image.jpg` are proxied to `http://localhost:3003/uploads/image.jpg` where Express serves the static files.
