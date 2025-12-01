// routes/coupon.routes.js
import express from "express";
import {
  createCoupon,
  validateCoupon,
  useCoupon,
  getCouponStats,
  couponQRCode,                    // ← AJOUTÉ ICI
  simulateCouponImpactController   // ← AJOUTÉ ICI
} from "../controllers/coupon.controller.js";

const router = express.Router();

// Routes classiques
router.post("/", createCoupon);
router.post("/validate", validateCoupon);
router.post("/use", useCoupon);
router.get("/stats", getCouponStats);

// MÉTIERS AVANCÉS (les deux lignes magiques)
router.get("/qrcode/:id", couponQRCode);                    // ← QR CODE
router.post("/simulate", simulateCouponImpactController);   // ← Simulation impact

export default router;