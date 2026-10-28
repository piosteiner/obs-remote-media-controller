const express = require('express');
const router = express.Router();
const storage = require('../services/storage');
const { applySlotUpdate, clearSlot } = require('../services/slotState');

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

// Update slot: only what the body names changes — the image ({ imageUrl, imageId }), the quick images
// ({ quick }), the rotation ({ rotation }); see services/slotState.js. Everyone gets the whole slot.
router.put('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  let slot;
  try {
    slot = await storage.updateSlot(slotId, (current) => applySlotUpdate(current, req.body || {}));
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }

  req.app.get('io').emit('slot:updated', { slot: slotId, ...slot, timestamp: slot.updatedAt });
  res.json({ success: true, data: { slot: slotId, ...slot } });
});

// Clear slot: no image, no rotation; the quick images stay
router.delete('/:slotId', async (req, res) => {
  const { slotId } = req.params;
  const slot = await storage.updateSlot(slotId, clearSlot);

  req.app.get('io').emit('slot:updated', { slot: slotId, ...slot, timestamp: new Date().toISOString() });
  res.json({ success: true, message: 'Slot cleared', data: { slot: slotId, ...slot } });
});

module.exports = router;
