// Simple in-memory sliding-window rate limiter for Express
// Prevents brute-force authentication and API abuse without requiring external Redis

const requestStore = new Map();

/**
 * Creates a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (e.g. 60000 for 1 minute)
 * @param {number} options.max - Max allowed requests per window per IP
 * @param {string} options.message - Error message returned on 429
 */
const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  // Periodic cleanup of stale IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of requestStore.entries()) {
      if (now - entry.startTime > windowMs * 2) {
        requestStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let entry = requestStore.get(ip);
    if (!entry || now - entry.startTime > windowMs) {
      entry = { startTime: now, count: 1 };
      requestStore.set(ip, entry);
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((windowMs - (now - entry.startTime)) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

module.exports = { rateLimit };
