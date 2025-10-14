# Nginx Configuration for Shared Domain

Since you're already using `api.piogino.ch` for another project, here are your options:

---

## Option 1: Path-Based Routing (Recommended)

**URL**: `https://api.piogino.ch/obs/...`

### Nginx Configuration

Edit your existing Nginx config for `api.piogino.ch`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.piogino.ch;

    # Existing SSL configuration
    ssl_certificate /etc/letsencrypt/live/api.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.piogino.ch/privkey.pem;

    # Your existing project (keep as is)
    location / {
        proxy_pass http://localhost:3000;
        # ... your existing config
    }

    # NEW: OBS Media Controller
    location /obs/ {
        proxy_pass http://localhost:3001/;  # Note the trailing slash!
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size
    client_max_body_size 10M;
}
```

### Backend Configuration

Edit backend `.env`:
```env
PORT=3001  # Different port from your existing project
ALLOWED_ORIGINS=https://obs-media-control.piogino.ch
```

### Test

```bash
# Start on port 3001
PORT=3001 npm start

# Or with PM2
pm2 start ecosystem.config.js

# Test
curl https://api.piogino.ch/obs/api/health
```

---

## Option 2: Different Port

**URL**: `https://api.piogino.ch:3001/...`

### Nginx Configuration

Add new server block to your Nginx config:

```nginx
# Existing config on port 443 stays the same

# NEW: Port 3001 for OBS
server {
    listen 3001 ssl http2;
    server_name api.piogino.ch;

    # Reuse same SSL certificate
    ssl_certificate /etc/letsencrypt/live/api.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.piogino.ch/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

### Firewall

```bash
sudo ufw allow 3001/tcp
```

### Frontend .env.production

```env
VITE_API_BASE_URL=https://api.piogino.ch:3001
VITE_WS_URL=https://api.piogino.ch:3001
```

---

## Option 3: New Subdomain (Cleanest)

**URL**: `https://obs.piogino.ch/...`

### DNS Configuration

Add A record:
```
Type: A
Name: obs
Value: 83.228.207.199
TTL: 3600
```

### SSL Certificate

```bash
sudo certbot --nginx -d obs.piogino.ch
```

### Nginx Configuration

Create `/etc/nginx/sites-available/obs-api`:

```nginx
server {
    listen 80;
    server_name obs.piogino.ch;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name obs.piogino.ch;

    ssl_certificate /etc/letsencrypt/live/obs.piogino.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/obs.piogino.ch/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/obs-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Frontend .env.production

```env
VITE_API_BASE_URL=https://obs.piogino.ch
VITE_WS_URL=https://obs.piogino.ch
```

---

## Comparison

| Option | URL | Pros | Cons |
|--------|-----|------|------|
| **Path** | `api.piogino.ch/obs` | ✅ No DNS changes<br>✅ Uses existing SSL<br>✅ Single domain | ⚠️ Slightly complex routing |
| **Port** | `api.piogino.ch:3001` | ✅ Easy setup<br>✅ Uses existing SSL | ⚠️ Non-standard port<br>⚠️ Firewall rule needed |
| **Subdomain** | `obs.piogino.ch` | ✅ Clean separation<br>✅ Most professional | ⏳ DNS propagation wait<br>⏳ New SSL cert needed |

---

## Recommended: Option 1 (Path-Based)

I've already updated your `.env` files to use:
```
https://api.piogino.ch/obs
```

### Quick Setup:

1. **Update Nginx config** (add location block for `/obs/`)
2. **Backend .env**: `PORT=3001`
3. **Reload Nginx**: `sudo systemctl reload nginx`
4. **Start backend**: `pm2 start ecosystem.config.js`
5. **Test**: `curl https://api.piogino.ch/obs/api/health`

---

## Need Different Option?

Just let me know which option you prefer, and I'll update all the config files accordingly!

Current setup: **Path-based** (`/obs` path) ✅
