import express from "express";
import {
  createCoupon,
  validateCoupon,
  useCoupon,
  getCouponStats
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/", createCoupon);
router.post("/validate", validateCoupon);
router.post("/use", useCoupon);
router.get("/stats", getCouponStats);

export default router;
