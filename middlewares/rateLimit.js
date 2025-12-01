// middlewares/rateLimit.js
import rateLimit from "express-rate-limit";

/**
 * Rate limiter global pour éviter :
 * - spam API
 * - attaques DDOS simples
 * - abus lors de l'utilisation de coupons
 */

export const genericRateLimiter = rateLimit({
  windowMs: 60 * 1000,           // fenêtre de 1 minute
  max: 100,                      // 100 requêtes max / minute
  standardHeaders: true,         // ajoute headers "RateLimit-*"
  legacyHeaders: false,

  message: {
    error: "Trop de requêtes, réessayez dans une minute."
  }
});
