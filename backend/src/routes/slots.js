const express = require('express');
const router = express.Router();

// Get all slots
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      slots: global.slots || {}
    }
  });
});

// Get single slot
router.get('/:slotId', (req, res) => {
  const { slotId } = req.params;
  const slotData = global.slots?.[slotId] || {
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
router.put('/:slotId', (req, res) => {
  const { slotId } = req.params;
  const { imageId, imageUrl } = req.body;

  const slotData = {
    imageId: imageId || null,
    imageUrl: imageUrl || null,
    updatedAt: new Date().toISOString()
  };

  global.slots = global.slots || {};
  global.slots[slotId] = slotData;

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
router.delete('/:slotId', (req, res) => {
  const { slotId } = req.params;

  global.slots = global.slots || {};
  global.slots[slotId] = {
    imageId: null,
    imageUrl: null,
    updatedAt: null
  };

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
