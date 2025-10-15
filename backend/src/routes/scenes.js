const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

// Get all scenes
router.get('/', async (req, res) => {
  const scenes = await storage.getScenes();
  res.json({
    success: true,
    data: { scenes }
  });
});

// Get single scene
router.get('/:id', async (req, res) => {
  const sceneId = parseInt(req.params.id);
  const scenes = await storage.getScenes();
  const scene = scenes.find(s => s.id === sceneId);

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  res.json({
    success: true,
    data: scene
  });
});

// Create scene
router.post('/', async (req, res) => {
  const { name, description, slots } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Scene name is required' }
    });
  }

  const scene = {
    id: Date.now(),
    name,
    description: description || '',
    slots: slots || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await storage.addScene(scene);

  console.log(`🎬 Scene created: ${name}`);

  res.status(201).json({
    success: true,
    data: scene
  });
});

// Update scene
router.put('/:id', async (req, res) => {
  const sceneId = parseInt(req.params.id);
  const { name, description, slots } = req.body;

  const updates = {
    name,
    description,
    slots,
    updatedAt: new Date().toISOString()
  };

  // Remove undefined values
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

  const updated = await storage.updateScene(sceneId, updates);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  console.log(`✏️  Scene updated: ${updated.name}`);

  res.json({
    success: true,
    data: updated
  });
});

// Delete scene
router.delete('/:id', async (req, res) => {
  const sceneId = parseInt(req.params.id);
  const deleted = await storage.deleteScene(sceneId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  console.log(`🗑️  Scene deleted: ID ${sceneId}`);

  res.json({
    success: true,
    message: 'Scene deleted successfully'
  });
});

// Load scene (apply to slots)
router.post('/:id/load', async (req, res) => {
  const sceneId = parseInt(req.params.id);
  const scenes = await storage.getScenes();
  const scene = scenes.find(s => s.id === sceneId);

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // REPLACE all slots with scene slots (each scene is independent)
  // This ensures scenes don't interfere with each other
  const newSlots = { ...scene.slots };

  // Save the new slot configuration
  await storage.setSlots(newSlots);

  // Broadcast via WebSocket - send complete slot state
  const io = req.app.get('io');
  io.emit('scene:loaded', {
    sceneId: scene.id,
    sceneName: scene.name,
    slots: newSlots // Send the scene's slots
  });

  console.log(`▶️  Scene loaded: ${scene.name} (${Object.keys(scene.slots).length} slots defined)`);

  res.json({
    success: true,
    message: 'Scene loaded',
    data: {
      sceneId: scene.id,
      sceneName: scene.name,
      slotsUpdated: Object.keys(scene.slots).length,
      allSlots: newSlots
    }
  });
});

// Capture current slots to scene (update scene with current slot configuration)
router.post('/:id/capture', async (req, res) => {
  const sceneId = parseInt(req.params.id);
  
  // Get current slots
  const currentSlots = await storage.getSlots();
  
  // Update the scene with current slots
  const updates = {
    slots: currentSlots,
    updatedAt: new Date().toISOString()
  };
  
  const updated = await storage.updateScene(sceneId, updates);
  
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }
  
  console.log(`📸 Scene captured: ${updated.name} (${Object.keys(currentSlots).length} slots saved)`);
  
  res.json({
    success: true,
    message: 'Scene updated with current slots',
    data: {
      sceneId: updated.id,
      sceneName: updated.name,
      slotsCaptured: Object.keys(currentSlots).length,
      slots: currentSlots
    }
  });
});

module.exports = router;
