import rateLimit from 'express-rate-limit';

// General API rate limiter - 1000 requests per 15 minutes (generous for development)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for testing)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Store in memory (for single server) - upgrade to Redis for multiple servers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    });
  },
});

// Strict rate limiter for auth endpoints - 20 requests per 15 minutes (more lenient)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window (increased for testing)
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    console.warn(`[RateLimit] Auth attempts exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the maximum number of login attempts. Please try again in 15 minutes.',
    });
  },
});

// Admin endpoints rate limiter - 30 requests per 15 minutes
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many admin requests, please try again later.',
  handler: (req, res) => {
    console.warn(`[RateLimit] Admin attempts exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many admin requests',
      message: 'You have exceeded the rate limit for admin operations.',
    });
  },
});

// File upload rate limiter - 10 requests per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Upload limit exceeded',
      message: 'You have exceeded the maximum number of uploads per hour.',
    });
  },
});

// Create task/note rate limiter - 200 per 15 minutes (generous for active users)
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 creations per window (increased for testing)
  message: 'You are creating content too quickly. Please slow down.',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Creation rate limit exceeded',
      message: 'You are creating content too quickly. Please try again in a few minutes.',
    });
  },
});
