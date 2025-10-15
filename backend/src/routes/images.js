const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Multer configuration
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.'));
    }
  }
});

// In-memory image storage (replace with database in production)
const images = [];

// Get all images
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { images }
  });
});

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded' }
    });
  }

  // Build full URL for the uploaded image
  // Use PUBLIC_URL from environment for production (includes /obs path)
  // Fall back to building URL from request for development
  let imageUrl;
  if (process.env.PUBLIC_URL) {
    imageUrl = `${process.env.PUBLIC_URL}/uploads/${req.file.filename}`;
  } else {
    const protocol = req.protocol;
    const host = req.get('host');
    imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  }

  const imageData = {
    id: Date.now(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: imageUrl,
    type: 'uploaded',
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date().toISOString()
  };

  images.push(imageData);

  console.log(`📤 Image uploaded: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);
  console.log(`🔗 Image URL: ${imageUrl}`);

  res.status(201).json({
    success: true,
    data: imageData
  });
});

// Add image by URL
router.post('/url', (req, res) => {
  const { url, name } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: { message: 'URL is required' }
    });
  }

  const imageData = {
    id: Date.now(),
    url,
    originalName: name || 'External Image',
    type: 'url',
    createdAt: new Date().toISOString()
  };

  images.push(imageData);

  console.log(`🔗 Image added from URL: ${url}`);

  res.status(201).json({
    success: true,
    data: imageData
  });
});

// Delete image
router.delete('/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  const imageIndex = images.findIndex(img => img.id === imageId);

  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Image not found' }
    });
  }

  const image = images[imageIndex];

  // Delete file if it's an uploaded image
  if (image.type === 'uploaded' && image.filename) {
    try {
      await fs.unlink(path.join(uploadsDir, image.filename));
      console.log(`🗑️  Image file deleted: ${image.filename}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  images.splice(imageIndex, 1);

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
});

module.exports = router;
