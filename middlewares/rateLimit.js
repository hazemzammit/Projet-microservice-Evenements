// middlewares/rateLimit.js
import rateLimit from "express-rate-limit";

export const genericRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limite chaque IP à 200 requêtes par fenêtre
  message: {
    error: "Trop de requêtes depuis cette IP, réessayez dans 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});