// One-off backfill: create thumbnails and record dimensions for uploaded images
// that don't have them yet. Run with the server stopped, since it rewrites
// data/images.json:  node scripts/generate-thumbnails.js
require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const storage = require('../src/services/storage');

const uploadsDir = path.join(__dirname, '../uploads');
const baseUrl = process.env.API_BASE_URL || 'https://api.piogino.ch/obs';
const THUMBNAIL_SIZE = 400;

(async () => {
  let created = 0, skipped = 0, failed = 0;

  await storage.update(storage.imagesFile, [], async (images) => {
    for (const image of images) {
      if (image.type !== 'uploaded' || !image.filename || image.thumbnailFilename) {
        skipped++;
        continue;
      }
      const source = path.join(uploadsDir, image.filename);
      const thumbnailFilename = `thumb_${path.parse(image.filename).name}.webp`;
      try {
        const metadata = await sharp(source).metadata();
        await sharp(source)
          .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75, effort: 4 })
          .toFile(path.join(uploadsDir, thumbnailFilename));
        image.thumbnailFilename = thumbnailFilename;
        image.thumbnailUrl = `${baseUrl}/uploads/${thumbnailFilename}`;
        image.width = image.width || metadata.width;
        image.height = image.height || metadata.height;
        created++;
      } catch (error) {
        console.error(`Failed for ${image.filename}: ${error.message}`);
        failed++;
      }
    }
  });

  const files = await fs.readdir(uploadsDir);
  console.log(`Thumbnails created: ${created}, skipped: ${skipped}, failed: ${failed}, files in uploads: ${files.length}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
