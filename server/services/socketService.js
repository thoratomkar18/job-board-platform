const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be set in production.'); })()
  : 'jobconnect_jwt_secret_dypimca_2026_omkar');

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://thoratomkar18.github.io',
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Token required for socket connection'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    const role = socket.user.role;

    // Join dedicated user room for targeted notifications
    socket.join(`user_${userId}`);
    // Join role room for broadcast updates (e.g. new matching jobs for job_seekers)
    socket.join(`role_${role}`);

    console.log(`🔌 [Socket.IO] User connected: ${socket.user.name} (${userId}) | Role: ${role}`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] User disconnected: ${socket.user.name} (${userId})`);
    });
  });

  return io;
}

/**
 * Get active io instance
 */
function getIO() {
  return io;
}

/**
 * Send real-time event to specific user
 */
function emitToUser(userId, event, data) {
  if (!io) return false;
  const targetRoom = `user_${String(userId)}`;
  io.to(targetRoom).emit(event, data);
  return true;
}

/**
 * Send real-time event to specific role
 */
function emitToRole(role, event, data) {
  if (!io) return false;
  const targetRoom = `role_${String(role)}`;
  io.to(targetRoom).emit(event, data);
  return true;
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole,
};
