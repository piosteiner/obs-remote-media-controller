const storage = require('./storage');

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
      
      try {
        // Load scene from persistent storage
        const scenes = await storage.getScenes();
        const scene = scenes.find(s => s.id === parseInt(sceneId));
        
        if (!scene) {
          socket.emit('error', {
            message: 'Scene not found',
            sceneId
          });
          console.error(`❌ Scene ${sceneId} not found`);
          return;
        }

        // Update global slots (merge with existing)
        global.slots = global.slots || {};
        Object.entries(scene.slots).forEach(([slotId, slotData]) => {
          if (slotData && (slotData.imageId || slotData.imageUrl)) {
            global.slots[slotId] = slotData;
          }
        });

        // Broadcast to all clients
        io.emit('scene:loaded', {
          sceneId: scene.id,
          sceneName: scene.name,
          slots: scene.slots,
          allSlots: global.slots
        });

        console.log(`🎬 Scene ${sceneId} loaded: ${scene.name}`);
      } catch (error) {
        console.error('Error loading scene:', error);
        socket.emit('error', {
          message: 'Failed to load scene',
          error: error.message
        });
      }
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
