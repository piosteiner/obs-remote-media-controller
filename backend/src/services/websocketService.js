const storage = require('./storage');
const { applySlotUpdate, clearSlot } = require('./slotState');

// The socket: live updates to every page (displays and controllers). The slots' state is the saved one
// (services/storage.js) — changes come through the routes (routes/slots.js, routes/scenes.js), which tell
// everyone with 'slot:updated' / 'scene:loaded'. The two slot commands here are kept for pages from before
// (they sent every change over the socket as well); they change the saved slot as the route does.
module.exports = (io) => {
  io.on('connection', async (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.emit('connection:status', {
      status: 'connected',
      clientId: socket.id,
      timestamp: new Date().toISOString(),
    });

    const denyUnlessWriter = () => {
      if (socket.data.canWrite) return false;
      socket.emit('error', { message: 'Unauthorized: admin key required' });
      return true;
    };
    const broadcast = (slot, data) => io.emit('slot:updated', { slot: String(slot), ...data, timestamp: data.updatedAt || new Date().toISOString() });

    socket.on('slot:update', async ({ slot, imageUrl, imageId } = {}) => {
      if (denyUnlessWriter()) return;
      const data = await storage.updateSlot(String(slot), (current) => applySlotUpdate(current, { imageUrl, imageId }));
      broadcast(slot, data);
    });

    socket.on('slot:clear', async ({ slot } = {}) => {
      if (denyUnlessWriter()) return;
      broadcast(slot, await storage.updateSlot(String(slot), clearSlot));
    });

    // Keep-alive
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });

    // the slots as saved — after the handlers above are there (awaiting first would lose a command sent at once)
    socket.emit('slots:state', {
      slots: await storage.getSlots(),
      timestamp: new Date().toISOString(),
    });
  });
};
