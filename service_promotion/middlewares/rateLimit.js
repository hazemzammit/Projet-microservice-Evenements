// middlewares/rateLimit.js
import rateLimit from "express-rate-limit";

export const genericRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requêtes / minute
    message: {
        error: "Trop de requêtes, veuillez réessayer plus tard."
    }
});
