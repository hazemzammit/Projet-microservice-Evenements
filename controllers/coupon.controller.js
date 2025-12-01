// controllers/coupon.controller.js

import {
  createCouponService,
  validateCouponService,
  useCouponService,
  getCouponQRCode,
  couponGlobalStatsService
} from "../services/coupon.service.js";

// ----------------------------------------------
// CREATE COUPON
// ----------------------------------------------
export const createCoupon = async (req, res) => {
  try {
    const coupon = await createCouponService(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ----------------------------------------------
// VALIDATE COUPON (NO USAGE INCREMENT)
// ----------------------------------------------
export const validateCoupon = async (req, res) => {
  try {
    const result = await validateCouponService(req.body.code, {
      cartAmount: req.body.cartAmount,
      category: req.body.category,
      clientIP: req.ip
    });

    res.json({
      valid: true,
      promotion: result.promo,
      bestApplicablePromotions: result.bestSet
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ----------------------------------------------
// USE COUPON (INCREMENT + FRAUD CHECK)
// ----------------------------------------------
export const useCoupon = async (req, res) => {
  try {
    const coupon = await useCouponService(req.body.code, req.ip);

    res.json({
      message: "Coupon utilisé",
      coupon
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ----------------------------------------------
// GET QR CODE FOR COUPON
// ----------------------------------------------
export const couponQRCode = async (req, res) => {
  try {
    const qr = await getCouponQRCode(req.params.id);
    res.json({ qrCode: qr });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// ----------------------------------------------
// GLOBAL STATS (METIER AVANCÉ)
// ----------------------------------------------
export const getCouponStats = async (req, res) => {
  try {
    const stats = await couponGlobalStatsService();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
