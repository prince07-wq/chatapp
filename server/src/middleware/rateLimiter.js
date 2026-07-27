const rateLimit = require("express-rate-limit");

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function rateLimitHandler(message) {
  return (req, res) => {
    res.status(429).json({ error: message });
  };
}

// Stricter limit for auth endpoints — protects login/register/refresh/logout
// from brute-force and credential-stuffing attempts.
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    "Too many authentication requests. Please try again later."
  ),
});

// General limit applied to all other API routes.
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests. Please try again later."),
});

module.exports = { authLimiter, generalLimiter };