const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: env.isTest ? 10000 : max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
  });

module.exports = {
  apiLimiter: make(15, 600, 'Too many requests. Please slow down and try again shortly.'),
  loginLimiter: make(15, 10, 'Too many sign-in attempts. Please try again in 15 minutes.'),
  applyLimiter: make(60, 8, 'Too many applications from this network. Please try again later.'),
  publicFormLimiter: make(60, 15, 'Too many submissions. Please try again later.'),
};
