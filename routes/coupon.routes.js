import express from "express";
import { createCoupon, validateCoupon, useCoupon, deactivateCoupon, applyDiscount } from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/", createCoupon);
router.post("/validate", validateCoupon);
router.post("/use", useCoupon);
router.put("/deactivate", deactivateCoupon);
router.post("/apply", applyDiscount); // Endpoint puissant pour apply + envoi post-achat

export default router;