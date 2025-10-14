// In-memory slot state (or load from database)
const slots = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Send current slot states on connect
    socket.emit('connection:status', {
      status: 'connected',
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Send current slots state
    socket.emit('slots:state', {
      slots: slots,
      timestamp: new Date().toISOString(),
    });

    // Handle slot update
    socket.on('slot:update', (data) => {
      const { slot, imageUrl, imageId } = data;
      
      // Update state
      slots[slot] = {
        imageId: imageId || null,
        imageUrl: imageUrl || null,
        updatedAt: new Date().toISOString(),
      };

      // Broadcast to all clients
      io.emit('slot:updated', {
        slot,
        imageId: imageId || null,
        imageUrl: imageUrl || null,
        timestamp: new Date().toISOString(),
      });

      console.log(`📺 Slot ${slot} updated:`, imageUrl);
    });

    // Handle scene load
    socket.on('scene:load', async (data) => {
      const { sceneId } = data;
      
      // Load scene from database
      // const scene = await Scene.findById(sceneId)
      
      // Mock scene data for now
      const scene = {
        id: sceneId,
        name: 'Test Scene',
        slots: {
          '1': { imageUrl: 'https://via.placeholder.com/1920x1080', imageId: 1 },
          '2': { imageUrl: null, imageId: null },
        }
      };

      // Update slots
      Object.entries(scene.slots).forEach(([slotId, slotData]) => {
        slots[slotId] = slotData;
      });

      // Broadcast to all clients
      io.emit('scene:loaded', {
        sceneId: scene.id,
        sceneName: scene.name,
        slots: scene.slots,
      });

      console.log(`🎬 Scene ${sceneId} loaded`);
    });

    // Handle slot clear
    socket.on('slot:clear', (data) => {
      const { slot } = data;
      
      slots[slot] = {
        imageId: null,
        imageUrl: null,
        updatedAt: null,
      };

      io.emit('slot:updated', {
        slot,
        imageId: null,
        imageUrl: null,
        timestamp: new Date().toISOString(),
      });

      console.log(`🗑️  Slot ${slot} cleared`);
    });

    // Keep-alive
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // Export slots state for API routes
  global.slots = slots;
};
