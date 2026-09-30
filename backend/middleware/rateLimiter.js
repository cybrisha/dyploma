import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoints
 * Prevents brute-force attacks
 */
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_WINDOW_MS || 600000), // 10 minutes
  limit: parseInt(process.env.LOGIN_ATTEMPT_LIMIT || 5), // 5 attempts
  message: {
    error: 'Too many login attempts',
    message: 'Please try again later'
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please slow down'
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

