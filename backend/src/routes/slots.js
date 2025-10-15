const express = require('express');
const router = express.Router();
const storage = require('../services/storage');

// Get all slots
router.get('/', async (req, res) => {
  const slots = await storage.getSlots();
  res.json({
    success: true,
    data: { slots }
  });
});

// Get single slot
router.get('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  const slots = await storage.getSlots();
  const slotData = slots[slotId] || {
    imageId: null,
    imageUrl: null,
    updatedAt: null
  };

  res.json({
    success: true,
    data: {
      slot: slotId,
      ...slotData
    }
  });
});

// Update slot
router.put('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  const { imageId, imageUrl } = req.body;

  const slotData = {
    imageId: imageId || null,
    imageUrl: imageUrl || null,
    updatedAt: new Date().toISOString()
  };

  await storage.setSlot(slotId, slotData);

  // Broadcast via WebSocket
  const io = req.app.get('io');
  io.emit('slot:updated', {
    slot: slotId,
    ...slotData,
    timestamp: slotData.updatedAt
  });

  res.json({
    success: true,
    data: {
      slot: slotId,
      ...slotData
    }
  });
});

// Clear slot
router.delete('/:slotId', async (req, res) => {
  const { slotId } = req.params;

  const clearedData = {
    imageId: null,
    imageUrl: null,
    updatedAt: null
  };

  await storage.setSlot(slotId, clearedData);

  // Broadcast via WebSocket
  const io = req.app.get('io');
  io.emit('slot:updated', {
    slot: slotId,
    imageId: null,
    imageUrl: null,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Slot cleared',
    data: {
      slot: slotId,
      imageId: null,
      imageUrl: null
    }
  });
});

module.exports = router;
