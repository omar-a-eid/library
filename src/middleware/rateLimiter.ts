import rateLimit from 'express-rate-limit';

export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Too many export requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});


export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Too many checkout requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
