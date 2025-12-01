import {
  createCouponService,
  autoGenerateCouponService,
  validateCouponService,
  useCouponService,
  couponGlobalStatsService,
  couponStatsByPromotionService
} from "../services/coupon.service.js";

// ================================
// 🟢 CREATE COUPON
// ================================
export const createCoupon = async (req, res) => {
  try {
    const coupon = await createCouponService(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================================
// 🟢 AUTO GENERATE COUPON
// ================================
export const autoGenerateCoupon = async (req, res) => {
  try {
    const coupon = await autoGenerateCouponService(req.params.promotionId);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================================
// 🟢 VALIDATE COUPON
// ================================
export const validateCoupon = async (req, res) => {
  try {
    const clientIP = req.ip;
    const { code, category } = req.body;

    const promo = await validateCouponService(code, category, clientIP);

    res.json({ valid: true, promotion: promo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================================
// 🟢 USE COUPON
// ================================
export const useCoupon = async (req, res) => {
  try {
    const clientIP = req.ip;
    const { code } = req.body;

    const result = await useCouponService(code, clientIP);

    res.json({ message: "Coupon utilisé", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================================
// 🟢 GLOBAL STATS
// ================================
export const getCouponGlobalStats = async (req, res) => {
  try {
    const stats = await couponGlobalStatsService();
    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================================
// 🟢 STATS BY PROMOTION
// ================================
export const getCouponStatsByPromotion = async (req, res) => {
  try {
    const stats = await couponStatsByPromotionService(req.params.promotionId);
    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
