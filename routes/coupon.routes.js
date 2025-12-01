import express from "express";

import {
  createCoupon,
  autoGenerateCoupon,
  validateCoupon,
  useCoupon,
  getCouponGlobalStats,
  getCouponStatsByPromotion
} from "../controllers/coupon.controller.js";

import antiFraudMiddleware from "../middlewares/antiFraud.js";

const router = express.Router();

// ================================
// Coupons CRUD
// ================================
router.post("/", createCoupon);

// ================================
// Auto-generation
// ================================
router.post("/auto-generate/:promotionId", autoGenerateCoupon);

// ================================
// Validate coupon
// avec anti-fraude (IP blocking)
// ================================
router.post("/validate", antiFraudMiddleware, validateCoupon);

// ================================
// Use coupon
// ================================
router.post("/use", useCoupon);

// ================================
// Stats
// ================================
router.get("/stats/global", getCouponGlobalStats);
router.get("/stats/promotion/:promotionId", getCouponStatsByPromotion);

export default router;
