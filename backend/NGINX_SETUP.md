# Nginx Configuration for OBS Remote Media Backend

## Current Setup

- **Domain**: `api.piogino.ch` (shared with GIF converter)
- **Backend Port**: `3003`
- **Path**: `/obs/` (path-based routing)
- **Full API URL**: `https://api.piogino.ch/obs/`

## Nginx Configuration

Edit the existing Nginx config at `/etc/nginx/sites-available/gif-converter`:

```bash
sudo nano /etc/nginx/sites-available/gif-converter
```

Add the following location block **AFTER** the existing location block for the GIF converter:

```nginx
    # OBS Remote Media Controller Backend
    location /obs/ {
        # Proxy to Node.js backend on port 3003
        proxy_pass http://127.0.0.1:3003/;  # Note the trailing slash!
        proxy_http_version 1.1;
        
        # WebSocket support for real-time updates
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (allow obs-media-control.piogino.ch)
        add_header Access-Control-Allow-Origin "https://obs-media-control.piogino.ch" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, Accept, Origin, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Vary Origin always;
        
        # Handle CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://obs-media-control.piogino.ch";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, Accept, Origin, X-Requested-With";
            add_header Access-Control-Max-Age 3600;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Timeouts for long-running operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # File upload size (10MB)
        client_max_body_size 10M;
    }
```

## Apply Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Restart Backend with PM2

```bash
cd /var/www/obs-remote-media-backend
pm2 restart obs-remote-backend
pm2 save
```

## Test the Setup

```bash
# Test health endpoint
curl https://api.piogino.ch/obs/api/health

# Expected response:
# {"status":"healthy","uptime":...,"timestamp":"..."}
```

## Frontend Configuration

Update your frontend `.env.production` to use:

```env
VITE_API_BASE_URL=https://api.piogino.ch/obs
VITE_WS_URL=wss://api.piogino.ch/obs
```

## Port Summary

- **Port 3000**: calorie-tracker-api
- **Port 3001**: adenai-cms
- **Port 3002**: quiz-backend
- **Port 3003**: obs-remote-backend ← **This project**
- **Port 5000**: gif-converter (Python/Flask)

## Troubleshooting

### Check if backend is running
```bash
curl http://localhost:3003/api/health
```

### Check PM2 logs
```bash
pm2 logs obs-remote-backend --lines 50
```

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart everything
```bash
pm2 restart obs-remote-backend
sudo systemctl reload nginx
```
