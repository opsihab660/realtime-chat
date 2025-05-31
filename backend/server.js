import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import userRoutes from './routes/users.js';

// Import socket handlers
import { handleSocketConnection, socketAuthMiddleware } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());

// CORS - Must be before rate limiting
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip preflight requests and admin IPs
  skip: (req) => {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') return true;

    // Skip localhost/development IPs and admin IPs
    const adminIPs = ['127.0.0.1', '::1', 'localhost', '103.106.239.112'];
    const clientIP = req.ip || req.socket.remoteAddress;

    if (adminIPs.includes(clientIP)) {
      console.log('🔓 Admin access granted for IP:', clientIP);
      return true;
    }

    return false;
  }
});
app.use(limiter);

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// MongoDB connection
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.error('Please check your MongoDB Atlas connection string in .env file');
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Real-time Chat API is running',
    timestamp: new Date().toISOString()
  });
});

// Admin status check endpoint
app.get('/api/admin/status', (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress;
  const adminIPs = ['127.0.0.1', '::1', 'localhost', '103.106.239.112'];

  const isAdmin = adminIPs.includes(clientIP);

  res.json({
    ip: clientIP,
    isAdmin: isAdmin,
    message: isAdmin ? '👑 Welcome Admin!' : '🚫 Access Denied',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint to reset rate limits (admin IPs only)
app.post('/api/admin/reset-limits', (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress;
  const adminIPs = ['127.0.0.1', '::1', 'localhost', '103.106.239.112'];

  if (!adminIPs.includes(clientIP)) {
    return res.status(403).json({ message: 'Admin access only' });
  }

  // Reset rate limits (this is a simple implementation)
  console.log('🔄 Rate limits reset by admin:', clientIP);
  res.json({
    message: 'Rate limits reset successfully',
    admin: true,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Socket.IO connection handling
io.on('connection', async (socket) => {
  try {
    await handleSocketConnection(socket, io);
  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Socket.IO enabled`);
});

export { io };
