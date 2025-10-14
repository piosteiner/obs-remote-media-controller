const express = require('express');
const router = express.Router();

// In-memory scene storage (replace with database in production)
const scenes = [];

// Get all scenes
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { scenes }
  });
});

// Get single scene
router.get('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id);
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
router.post('/', (req, res) => {
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

  scenes.push(scene);

  console.log(`🎬 Scene created: ${name}`);

  res.status(201).json({
    success: true,
    data: scene
  });
});

// Update scene
router.put('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id);
  const sceneIndex = scenes.findIndex(s => s.id === sceneId);

  if (sceneIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  const { name, description, slots } = req.body;

  scenes[sceneIndex] = {
    ...scenes[sceneIndex],
    name: name || scenes[sceneIndex].name,
    description: description !== undefined ? description : scenes[sceneIndex].description,
    slots: slots !== undefined ? slots : scenes[sceneIndex].slots,
    updatedAt: new Date().toISOString()
  };

  console.log(`✏️  Scene updated: ${scenes[sceneIndex].name}`);

  res.json({
    success: true,
    data: scenes[sceneIndex]
  });
});

// Delete scene
router.delete('/:id', (req, res) => {
  const sceneId = parseInt(req.params.id);
  const sceneIndex = scenes.findIndex(s => s.id === sceneId);

  if (sceneIndex === -1) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  const deletedScene = scenes[sceneIndex];
  scenes.splice(sceneIndex, 1);

  console.log(`🗑️  Scene deleted: ${deletedScene.name}`);

  res.json({
    success: true,
    message: 'Scene deleted successfully'
  });
});

// Load scene (apply to slots)
router.post('/:id/load', (req, res) => {
  const sceneId = parseInt(req.params.id);
  const scene = scenes.find(s => s.id === sceneId);

  if (!scene) {
    return res.status(404).json({
      success: false,
      error: { message: 'Scene not found' }
    });
  }

  // Update global slots
  global.slots = global.slots || {};
  Object.entries(scene.slots).forEach(([slotId, slotData]) => {
    global.slots[slotId] = slotData;
  });

  // Broadcast via WebSocket
  const io = req.app.get('io');
  io.emit('scene:loaded', {
    sceneId: scene.id,
    sceneName: scene.name,
    slots: scene.slots
  });

  console.log(`▶️  Scene loaded: ${scene.name} (${Object.keys(scene.slots).length} slots)`);

  res.json({
    success: true,
    message: 'Scene loaded',
    data: {
      sceneId: scene.id,
      sceneName: scene.name,
      slotsUpdated: Object.keys(scene.slots).length
    }
  });
});

module.exports = router;
