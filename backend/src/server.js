const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
// Increase payload size limit for image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/auth/fayda', require('./routes/fayda.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/auctions', require('./routes/auction.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.use('/api/escrow', require('./routes/escrow.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/buyer', require('./routes/buyer.routes'));
app.use('/api/activity', require('./routes/activity.routes'));
app.use('/api/fraud', require('./routes/fraud.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/disputes', require('./routes/dispute.routes'));
app.use('/api/assistant', require('./routes/assistant.routes'));
app.use('/api/blockchain', require('./routes/blockchain.routes'));
app.use('/api/fraud', require('./routes/fraud.routes'));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Join auction room
  socket.on('auction:watch', (auctionId) => {
    socket.join(`auction:${auctionId}`);
    console.log(`User ${socket.id} watching auction ${auctionId}`);
  });

  // Leave auction room
  socket.on('auction:unwatch', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
    console.log(`User ${socket.id} stopped watching auction ${auctionId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Auction Platform Backend Server                 ║
║                                                       ║
║   📡 Server running on port ${PORT}                     ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   🔗 API: http://localhost:${PORT}/api                  ║
║   ❤️  Health: http://localhost:${PORT}/health            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
