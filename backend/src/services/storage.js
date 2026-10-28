const fs = require('fs').promises;
const path = require('path');

class Storage {
  constructor() {
    // OBS_DATA_DIR: another folder (a test server on a copy); else backend/data
    this.dataDir = process.env.OBS_DATA_DIR || path.join(__dirname, '../../data');
    this.slotsFile = path.join(this.dataDir, 'slots.json');
    this.scenesFile = path.join(this.dataDir, 'scenes.json');
    this.imagesFile = path.join(this.dataDir, 'images.json');

    // Per-file queue so read-modify-write operations never interleave
    this.queues = new Map();

    // Initialize storage
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Initialize files if they don't exist
      await this.ensureFile(this.slotsFile, {});
      await this.ensureFile(this.scenesFile, []);
      await this.ensureFile(this.imagesFile, []);

      console.log('📁 Persistent storage initialized');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  async ensureFile(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch {
      await this.writeJson(filePath, defaultData);
    }
  }

  // A missing file means "empty", but a corrupt one is an error: treating it as
  // empty would let the next write wipe all existing data
  async readJson(filePath, fallback) {
    let data;
    try {
      data = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return fallback;
      throw error;
    }
    return JSON.parse(data);
  }

  // Write to a temp file and rename over the original, so a crash mid-write
  // can never leave a half-written file behind
  async writeJson(filePath, value) {
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(value, null, 2));
    await fs.rename(tmpPath, filePath);
  }

  // Run fn(currentValue) exclusively for this file; fn mutates the value in
  // place and returns the operation's result
  update(filePath, fallback, fn) {
    const previous = this.queues.get(filePath) || Promise.resolve();
    const run = previous.then(async () => {
      const value = await this.readJson(filePath, fallback);
      const result = await fn(value);
      await this.writeJson(filePath, value);
      return result;
    });
    // Keep the queue going even if this operation fails
    this.queues.set(filePath, run.catch(() => {}));
    return run;
  }

  // Slots operations
  getSlots() {
    return this.readJson(this.slotsFile, {});
  }

  setSlots(slots) {
    return this.update(this.slotsFile, {}, (current) => {
      Object.keys(current).forEach(key => delete current[key]);
      Object.assign(current, slots);
    });
  }

  // Change one slot from what it is now: fn(current) → the slot's new value (exclusive, as every write here)
  updateSlot(slotId, fn) {
    return this.update(this.slotsFile, {}, (slots) => {
      slots[slotId] = fn(slots[slotId] || {});
      return slots[slotId];
    });
  }

  setSlot(slotId, data) {
    return this.update(this.slotsFile, {}, (slots) => {
      slots[slotId] = data;
      return { ...slots };
    });
  }

  // Scenes operations
  getScenes() {
    return this.readJson(this.scenesFile, []);
  }

  setScenes(scenes) {
    return this.update(this.scenesFile, [], (current) => {
      current.splice(0, current.length, ...scenes);
    });
  }

  addScene(scene) {
    return this.update(this.scenesFile, [], (scenes) => {
      while (scenes.some(s => s.id === scene.id)) scene.id++;
      scenes.push(scene);
      return scene;
    });
  }

  updateScene(sceneId, updates) {
    return this.update(this.scenesFile, [], (scenes) => {
      const index = scenes.findIndex(s => s.id === sceneId);
      if (index === -1) return null;
      scenes[index] = { ...scenes[index], ...updates };
      return scenes[index];
    });
  }

  deleteScene(sceneId) {
    return this.update(this.scenesFile, [], (scenes) => {
      const index = scenes.findIndex(s => s.id === sceneId);
      if (index === -1) return false;
      scenes.splice(index, 1);
      return true;
    });
  }

  // Images operations
  getImages() {
    return this.readJson(this.imagesFile, []);
  }

  setImages(images) {
    return this.update(this.imagesFile, [], (current) => {
      current.splice(0, current.length, ...images);
    });
  }

  addImage(image) {
    return this.update(this.imagesFile, [], (images) => {
      // IDs are Date.now(); two uploads finishing in the same millisecond must not collide
      while (images.some(img => img.id === image.id)) image.id++;
      images.push(image);
      return image;
    });
  }

  updateImage(imageId, updates) {
    return this.update(this.imagesFile, [], (images) => {
      const index = images.findIndex(img => img.id === imageId);
      if (index === -1) return null;
      images[index] = { ...images[index], ...updates };
      return images[index];
    });
  }

  deleteImage(imageId) {
    return this.update(this.imagesFile, [], (images) => {
      const index = images.findIndex(img => img.id === imageId);
      if (index === -1) return null;
      return images.splice(index, 1)[0];
    });
  }
}

// Singleton instance
const storage = new Storage();

module.exports = storage;
