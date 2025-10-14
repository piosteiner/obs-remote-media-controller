const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Socket.io setup
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins }
});

// Make io available to routes
app.set('io', io);

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// WebSocket handling
require('./services/websocketService')(io);

// Error handler
app.use(require('./middleware/errorHandler'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});
