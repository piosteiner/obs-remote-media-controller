const fs = require('fs').promises;
const path = require('path');

class Storage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.slotsFile = path.join(this.dataDir, 'slots.json');
    this.scenesFile = path.join(this.dataDir, 'scenes.json');
    this.imagesFile = path.join(this.dataDir, 'images.json');
    
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
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  // Slots operations
  async getSlots() {
    try {
      const data = await fs.readFile(this.slotsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async setSlots(slots) {
    await fs.writeFile(this.slotsFile, JSON.stringify(slots, null, 2));
  }

  async setSlot(slotId, data) {
    const slots = await this.getSlots();
    slots[slotId] = data;
    await this.setSlots(slots);
    return slots;
  }

  // Scenes operations
  async getScenes() {
    try {
      const data = await fs.readFile(this.scenesFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async setScenes(scenes) {
    await fs.writeFile(this.scenesFile, JSON.stringify(scenes, null, 2));
  }

  async addScene(scene) {
    const scenes = await this.getScenes();
    scenes.push(scene);
    await this.setScenes(scenes);
    return scene;
  }

  async updateScene(sceneId, updates) {
    const scenes = await this.getScenes();
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index === -1) return null;
    
    scenes[index] = { ...scenes[index], ...updates };
    await this.setScenes(scenes);
    return scenes[index];
  }

  async deleteScene(sceneId) {
    const scenes = await this.getScenes();
    const filtered = scenes.filter(s => s.id !== sceneId);
    await this.setScenes(filtered);
    return filtered.length < scenes.length;
  }

  // Images operations
  async getImages() {
    try {
      const data = await fs.readFile(this.imagesFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async setImages(images) {
    await fs.writeFile(this.imagesFile, JSON.stringify(images, null, 2));
  }

  async addImage(image) {
    const images = await this.getImages();
    images.push(image);
    await this.setImages(images);
    return image;
  }

  async updateImage(imageId, updates) {
    const images = await this.getImages();
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1) return null;
    
    images[index] = { ...images[index], ...updates };
    await this.setImages(images);
    return images[index];
  }

  async deleteImage(imageId) {
    const images = await this.getImages();
    const filtered = images.filter(img => img.id !== imageId);
    await this.setImages(filtered);
    return filtered.length < images.length;
  }
}

// Singleton instance
const storage = new Storage();

module.exports = storage;
