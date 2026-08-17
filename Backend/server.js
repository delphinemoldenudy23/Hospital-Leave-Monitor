require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { checkUpcomingHolidays } = require('./controllers/holidayController');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves');
const departmentRoutes = require('./routes/departments');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const helpRoutes = require('./routes/help');
const systemSettingsRoutes = require('./routes/systemSettings');
const holidayRoutes = require('./routes/holidays');

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'];

// In production, allow all origins to support any Vercel deployment
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = isProduction ? '*' : allowedOrigins;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log('Admin joined room:', socket.id);
  });

  // Employee joins their personal room for real-time updates
  socket.on('join-employee-room', (employeeId) => {
    if (employeeId) {
      socket.join(`employee-${employeeId}`);
      console.log(`Employee ${employeeId} joined room:`, socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
const corsOptions = {
  origin: corsOrigin,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-leave-system')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/holidays', holidayRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready`);

  // Check for upcoming holidays every 24 hours (at midnight)
  const checkHolidays = async () => {
    console.log('Checking for upcoming holidays...');
    await checkUpcomingHolidays(io);
  };

  // Run immediately on server start
  checkHolidays();

  // Schedule to run every 24 hours
  setInterval(checkHolidays, 24 * 60 * 60 * 1000);
});