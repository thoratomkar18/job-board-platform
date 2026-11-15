const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be set in production.'); })()
  : 'jobconnect_jwt_secret_dypimca_2026_omkar');

/**
 * Protect middleware: Verifies standard Bearer JWT tokens.
 * Strictly verifies signature and expiration.
 * Does NOT trust client-supplied identity or role headers.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Bearer authentication token is required.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Authentication service unavailable.' });
    }
    const user = mongoose.Types.ObjectId.isValid(decoded.id)
      ? await User.findById(decoded.id).select('-password')
      : await User.findOne({ email: decoded.email }).select('-password');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account is unavailable. Please sign in again.' });
    }
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company || '',
      phone: user.phone || '',
      skills: user.skills || [],
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        expired: true,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Authorize middleware: Enforces strict Role-Based Access Control (RBAC).
 * Rejects requests from unauthorized roles with HTTP 403 Forbidden.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user?.role || 'guest'}' does not have permission to access this resource. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, JWT_SECRET };
