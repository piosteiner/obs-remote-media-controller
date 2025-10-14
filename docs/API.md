# API Reference

## Base URL

**Development:** `http://localhost:3000/api`  
**Production:** `https://obs-media-control.piogino.ch/api`

---

## Authentication

🔒 **Phase 2 Feature** - Currently all endpoints are public

Future authentication will use JWT tokens:
```
Authorization: Bearer <token>
```

---

## REST API Endpoints

### Images

#### List All Images
```http
GET /api/images
```

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50)
- `search` (string, optional) - Search by filename

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": 1,
        "filename": "logo.png",
        "originalName": "company-logo.png",
        "url": "/uploads/abc123-logo.png",
        "type": "uploaded",
        "mimeType": "image/png",
        "size": 150000,
        "width": 1920,
        "height": 1080,
        "createdAt": "2024-10-14T12:00:00Z",
        "updatedAt": "2024-10-14T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

---

#### Get Single Image
```http
GET /api/images/:id
```

**Parameters:**
- `id` (number) - Image ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "logo.png",
    "url": "/uploads/abc123-logo.png",
    "mimeType": "image/png",
    "size": 150000,
    "width": 1920,
    "height": 1080
  }
}
```

---

#### Upload Image
```http
POST /api/images/upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@/path/to/image.png"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "filename": "abc123-image.png",
    "originalName": "image.png",
    "url": "/uploads/abc123-image.png",
    "mimeType": "image/png",
    "size": 250000,
    "width": 1920,
    "height": 1080
  }
}
```

**Validation:**
- Max file size: 10MB
- Allowed types: image/png, image/jpeg, image/gif, image/webp
- Filename sanitization applied

**Errors:**
- 400: Invalid file type
- 413: File too large
- 500: Upload failed

---

#### Add Image by URL
```http
POST /api/images/url
```

**Request:**
```json
{
  "url": "https://example.com/image.png",
  "name": "External Image" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 124,
    "url": "https://example.com/image.png",
    "type": "url",
    "originalName": "External Image"
  }
}
```

**Validation:**
- URL must be valid HTTP/HTTPS
- URL must return image content-type
- URL must be accessible

---

#### Delete Image
```http
DELETE /api/images/:id
```

**Parameters:**
- `id` (number) - Image ID

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Note:** Deletes file from disk if uploaded image

---

### Scenes

#### List All Scenes
```http
GET /api/scenes
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenes": [
      {
        "id": 1,
        "name": "Intro",
        "description": "Opening scene with logo",
        "slots": {
          "1": 5,  // Image ID
          "2": null,
          "3": null
        },
        "createdAt": "2024-10-14T12:00:00Z",
        "updatedAt": "2024-10-14T12:00:00Z"
      }
    ]
  }
}
```

---

#### Get Single Scene
```http
GET /api/scenes/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Intro",
    "description": "Opening scene",
    "slots": {
      "1": 5,
      "2": null,
      "3": null
    },
    "images": {
      "1": {
        "id": 5,
        "filename": "logo.png",
        "url": "/uploads/abc123-logo.png"
      }
    }
  }
}
```

---

#### Create Scene
```http
POST /api/scenes
```

**Request:**
```json
{
  "name": "Product Demo",
  "description": "3 product images",
  "slots": {
    "1": 10,  // Image ID
    "2": 11,
    "3": 12
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Product Demo",
    "description": "3 product images",
    "slots": {
      "1": 10,
      "2": 11,
      "3": 12
    }
  }
}
```

**Validation:**
- `name` required (max 255 chars)
- `slots` must be valid JSON object
- Image IDs must exist

---

#### Update Scene
```http
PUT /api/scenes/:id
```

**Request:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "slots": {
    "1": 15,
    "2": 16,
    "3": null
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Updated Name",
    "slots": { ... }
  }
}
```

---

#### Delete Scene
```http
DELETE /api/scenes/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Scene deleted successfully"
}
```

---

#### Load Scene (Apply to Slots)
```http
POST /api/scenes/:id/load
```

**Description:** Applies scene configuration to current slots

**Response:**
```json
{
  "success": true,
  "message": "Scene loaded",
  "data": {
    "sceneId": 5,
    "sceneName": "Product Demo",
    "slotsUpdated": 3
  }
}
```

**Side Effects:**
- Updates all slot states
- Broadcasts `scene:loaded` WebSocket event
- All OBS displays update

---

### Slots

#### Get All Slot States
```http
GET /api/slots
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slots": {
      "1": {
        "imageId": 5,
        "imageUrl": "/uploads/abc123-logo.png",
        "updatedAt": "2024-10-14T12:00:00Z"
      },
      "2": {
        "imageId": null,
        "imageUrl": null,
        "updatedAt": null
      },
      "3": {
        "imageId": 10,
        "imageUrl": "https://example.com/image.png",
        "updatedAt": "2024-10-14T11:00:00Z"
      }
    }
  }
}
```

---

#### Get Single Slot State
```http
GET /api/slots/:slotId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slot": 1,
    "imageId": 5,
    "imageUrl": "/uploads/abc123-logo.png",
    "updatedAt": "2024-10-14T12:00:00Z"
  }
}
```

---

#### Update Slot
```http
PUT /api/slots/:slotId
```

**Request Option 1 - Image ID:**
```json
{
  "imageId": 5
}
```

**Request Option 2 - Direct URL:**
```json
{
  "imageUrl": "https://example.com/image.png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slot": 1,
    "imageId": 5,
    "imageUrl": "/uploads/abc123-logo.png",
    "updatedAt": "2024-10-14T12:30:00Z"
  }
}
```

**Side Effects:**
- Broadcasts `slot:updated` WebSocket event
- OBS displays update automatically

---

#### Clear Slot
```http
DELETE /api/slots/:slotId
```

**Response:**
```json
{
  "success": true,
  "message": "Slot cleared",
  "data": {
    "slot": 1,
    "imageId": null,
    "imageUrl": null
  }
}
```

---

### System

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2024-10-14T12:00:00Z",
  "version": "1.0.0",
  "connections": {
    "websocket": 5,
    "database": "connected"
  }
}
```

---

#### System Status
```http
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalImages": 50,
    "totalScenes": 10,
    "activeSlots": 3,
    "connectedClients": 5,
    "storageUsed": "500MB",
    "uptime": 3600
  }
}
```

---

## WebSocket API

### Connection

**URL:** `wss://obs-media-control.piogino.ch/socket.io`

**Client Libraries:**
- JavaScript: `socket.io-client`
- Python: `python-socketio`
- Other languages: See Socket.io docs

**Connection Example (JavaScript):**
```javascript
import { io } from 'socket.io-client';

const socket = io('https://obs-media-control.piogino.ch', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

### Events (Client → Server)

#### Update Slot
```javascript
socket.emit('slot:update', {
  slot: 1,
  imageId: 5,
  imageUrl: '/uploads/abc123-logo.png'
});
```

#### Load Scene
```javascript
socket.emit('scene:load', {
  sceneId: 3
});
```

#### Clear Slot
```javascript
socket.emit('slot:clear', {
  slot: 2
});
```

#### Ping (Keep-Alive)
```javascript
socket.emit('ping');
// Expects 'pong' response
```

---

### Events (Server → Client)

#### Slot Updated
```javascript
socket.on('slot:updated', (data) => {
  // data = {
  //   slot: 1,
  //   imageId: 5,
  //   imageUrl: '/uploads/abc123-logo.png',
  //   timestamp: '2024-10-14T12:00:00Z'
  // }
  console.log(`Slot ${data.slot} updated`);
});
```

#### Scene Loaded
```javascript
socket.on('scene:loaded', (data) => {
  // data = {
  //   sceneId: 3,
  //   sceneName: 'Product Demo',
  //   slots: {
  //     '1': { imageId: 10, imageUrl: '...' },
  //     '2': { imageId: 11, imageUrl: '...' }
  //   }
  // }
  console.log(`Scene loaded: ${data.sceneName}`);
});
```

#### Connection Status
```javascript
socket.on('connection:status', (data) => {
  // data = {
  //   status: 'connected',
  //   clientId: 'abc123',
  //   timestamp: '2024-10-14T12:00:00Z'
  // }
});
```

#### Error
```javascript
socket.on('error', (data) => {
  // data = {
  //   code: 'INVALID_IMAGE',
  //   message: 'Image not found',
  //   slot: 1
  // }
  console.error('Error:', data.message);
});
```

#### Pong (Keep-Alive Response)
```javascript
socket.on('pong', () => {
  console.log('Connection alive');
});
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional info
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (Phase 2)
- `403` - Forbidden (Phase 2)
- `404` - Not Found
- `413` - Payload Too Large
- `422` - Unprocessable Entity
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `IMAGE_NOT_FOUND` - Image ID doesn't exist
- `SCENE_NOT_FOUND` - Scene ID doesn't exist
- `SLOT_NOT_FOUND` - Slot ID doesn't exist
- `UPLOAD_FAILED` - File upload error
- `INVALID_FILE_TYPE` - Unsupported file format
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_URL` - URL validation failed
- `URL_NOT_ACCESSIBLE` - External URL can't be reached
- `DATABASE_ERROR` - Database operation failed
- `WEBSOCKET_ERROR` - WebSocket connection issue

---

## Rate Limiting

**Current:** 100 requests per minute per IP

**Response when rate limit exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1697280000
```

---

## Pagination

For paginated endpoints (e.g., `GET /api/images`):

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response Format:**
```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## CORS

**Allowed Origins (Development):**
- `http://localhost:5173`
- `http://localhost:3000`

**Allowed Origins (Production):**
- `https://obs-media-control.piogino.ch`

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization

---

## Example Usage

### Complete Flow: Upload and Display Image

```javascript
// 1. Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:3000/api/images/upload', {
  method: 'POST',
  body: formData
});

const { data: image } = await uploadResponse.json();
// image.id = 123

// 2. Update slot with uploaded image
await fetch('http://localhost:3000/api/slots/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageId: image.id })
});

// 3. Image now appears in OBS (via WebSocket)
```

---

### Complete Flow: Create and Load Scene

```javascript
// 1. Create scene
const scene = await fetch('http://localhost:3000/api/scenes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Product Demo',
    slots: {
      '1': 10,  // Existing image IDs
      '2': 11,
      '3': 12
    }
  })
});

const { data: newScene } = await scene.json();

// 2. Load scene (updates all slots)
await fetch(`http://localhost:3000/api/scenes/${newScene.id}/load`, {
  method: 'POST'
});

// 3. All slots update in OBS simultaneously
```

---

## Testing the API

### Using cURL

**Upload Image:**
```bash
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@./logo.png"
```

**Update Slot:**
```bash
curl -X PUT http://localhost:3000/api/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"imageId": 5}'
```

**Get Slots:**
```bash
curl http://localhost:3000/api/slots
```

### Using Postman

Import the Postman collection (future):
```
docs/postman/OBS-Remote-Media-Controller.postman_collection.json
```

---

**Last Updated:** October 14, 2025  
**API Version:** 1.0.0
