const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const sharp = require('sharp');
const dataStorage = require('../services/storage');

// Ensure uploads directory exists
// OBS_UPLOADS_DIR: another folder (a test server); else backend/uploads
const uploadsDir = process.env.OBS_UPLOADS_DIR || path.join(__dirname, '../../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Multer configuration for temporary storage
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    // Temporary filename for processing
    const uniqueName = crypto.randomBytes(16).toString('hex') + '_temp' + path.extname(file.originalname);
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

const THUMBNAIL_SIZE = 400;

// Small preview for library grids; the full image is only loaded when shown
async function createThumbnail(sourcePath, filename) {
  const thumbnailFilename = `thumb_${path.parse(filename).name}.webp`;
  await sharp(sourcePath)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75, effort: 4 })
    .toFile(path.join(uploadsDir, thumbnailFilename));
  return thumbnailFilename;
}

const EXTENSIONS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Store the uploaded file as-is (all accepted types display in browsers)
async function keepOriginal(inputPath, mimeType) {
  const filename = crypto.randomBytes(16).toString('hex') + (EXTENSIONS[mimeType] || '');
  const filePath = path.join(uploadsDir, filename);
  await fs.rename(inputPath, filePath);

  const stats = await fs.stat(filePath);
  const metadata = await sharp(filePath).metadata().catch(() => ({}));
  return {
    filename,
    path: filePath,
    size: stats.size,
    width: metadata.width,
    height: metadata.height,
    mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType
  };
}

// Convert image to WebP, unless that would make it bigger
async function convertToWebP(inputPath, originalName, mimeType) {
  const webpFilename = crypto.randomBytes(16).toString('hex') + '.webp';
  const webpPath = path.join(uploadsDir, webpFilename);
  
  try {
    // Convert to WebP with optimized settings
    const info = await sharp(inputPath)
      .webp({ 
        quality: 85,     // High quality
        effort: 4,       // Near-max compression at a fraction of effort 6's CPU time
        lossless: false  // Use lossy compression for smaller files
      })
      .toFile(webpPath);

    // Re-encoding an already well-compressed image can make it larger;
    // in that case keep the original file instead
    const originalSize = (await fs.stat(inputPath)).size;
    if (info.size >= originalSize) {
      await fs.unlink(webpPath);
      console.log(`↩️  Kept original ${originalName}: WebP would be ${(info.size / 1024).toFixed(2)} KB vs ${(originalSize / 1024).toFixed(2)} KB`);
      return keepOriginal(inputPath, mimeType);
    }
    
    // Delete the temporary original file
    await fs.unlink(inputPath);
    
    console.log(`🔄 Converted ${originalName} to WebP: ${(info.size / 1024).toFixed(2)} KB`);
    
    return {
      filename: webpFilename,
      path: webpPath,
      size: info.size,
      width: info.width,
      height: info.height,
      mimeType: 'image/webp'
    };
  } catch (error) {
    // If conversion fails, keep the original file
    console.error('WebP conversion failed, keeping original:', error);
    await fs.unlink(webpPath).catch(() => {});
    return keepOriginal(inputPath, mimeType);
  }
}

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

  try {
    // Convert image to WebP
    const tempPath = path.join(uploadsDir, req.file.filename);
    const convertedImage = await convertToWebP(tempPath, req.file.originalname, req.file.mimetype);
    
    const thumbnailFilename = await createThumbnail(convertedImage.path, convertedImage.filename)
      .catch((error) => {
        console.error('Thumbnail generation failed:', error);
        return null;
      });

    // Construct the full URL with the proxy path
    const baseUrl = process.env.API_BASE_URL || 'https://api.piogino.ch/obs';
    
    const imageData = {
      id: Date.now(),
      filename: convertedImage.filename,
      originalName: req.file.originalname,
      url: `${baseUrl}/uploads/${convertedImage.filename}`,
      ...(thumbnailFilename && {
        thumbnailFilename,
        thumbnailUrl: `${baseUrl}/uploads/${thumbnailFilename}`
      }),
      width: convertedImage.width,
      height: convertedImage.height,
      type: 'uploaded',
      mimeType: convertedImage.mimeType,
      size: convertedImage.size,
      originalSize: req.file.size,
      createdAt: new Date().toISOString(),
      format: convertedImage.mimeType.split('/')[1]
    };

    await dataStorage.addImage(imageData);

    console.log(`📤 Image uploaded and converted: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB → ${(convertedImage.size / 1024).toFixed(2)} KB)`);

    res.status(201).json({
      success: true,
      data: imageData
    });
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    
    // Clean up any temporary files
    try {
      const tempPath = path.join(uploadsDir, req.file.filename);
      await fs.unlink(tempPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process uploaded image' }
    });
  }
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
  const image = await dataStorage.deleteImage(imageId);

  if (!image) {
    return res.status(404).json({
      success: false,
      error: { message: 'Image not found' }
    });
  }

  // Remove files only once the library no longer references them
  for (const filename of [image.type === 'uploaded' && image.filename, image.thumbnailFilename]) {
    if (!filename) continue;
    try {
      await fs.unlink(path.join(uploadsDir, filename));
      console.log(`🗑️  Image file deleted: ${filename}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  res.json({
    success: true,
    message: 'Image deleted successfully'
  });
});

module.exports = router;
