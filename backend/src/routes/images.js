const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const dataStorage = require('../services/storage');

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

// Get all images
router.get('/', async (req, res) => {
  const images = await dataStorage.getImages();
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

  // Construct the full URL with the proxy path
  const baseUrl = process.env.API_BASE_URL || 'https://api.piogino.ch/obs';
  
  const imageData = {
    id: Date.now(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `${baseUrl}/uploads/${req.file.filename}`,
    type: 'uploaded',
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date().toISOString()
  };

  await dataStorage.addImage(imageData);

  console.log(`📤 Image uploaded: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  res.status(201).json({
    success: true,
    data: imageData
  });
});

// Add image by URL
router.post('/url', async (req, res) => {
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

  await dataStorage.addImage(imageData);

  console.log(`🔗 Image added from URL: ${url}`);

  res.status(201).json({
    success: true,
    data: imageData
  });
});

// Update image (rename, etc.)
router.put('/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  const { originalName, name } = req.body;

  if (!originalName && !name) {
    return res.status(400).json({
      success: false,
      error: { message: 'originalName or name is required' }
    });
  }

  const updates = {};
  if (originalName) updates.originalName = originalName;
  if (name) updates.originalName = name; // Support both 'name' and 'originalName' fields

  const updatedImage = await dataStorage.updateImage(imageId, updates);

  if (!updatedImage) {
    return res.status(404).json({
      success: false,
      error: { message: 'Image not found' }
    });
  }

  console.log(`✏️  Image renamed: ${updatedImage.originalName} (ID: ${imageId})`);

  res.json({
    success: true,
    data: updatedImage,
    message: 'Image updated successfully'
  });
});

// Delete image
router.delete('/:id', async (req, res) => {
  const imageId = parseInt(req.params.id);
  const images = await dataStorage.getImages();
  const image = images.find(img => img.id === imageId);

  if (!image) {
    return res.status(404).json({
      success: false,
      error: { message: 'Image not found' }
    });
  }

  // Delete file if it's an uploaded image
  if (image.type === 'uploaded' && image.filename) {
    try {
      await fs.unlink(path.join(uploadsDir, image.filename));
      console.log(`🗑️  Image file deleted: ${image.filename}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  await dataStorage.deleteImage(imageId);

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
});

module.exports = router;
