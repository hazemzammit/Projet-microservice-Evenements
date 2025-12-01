import {
  createCouponService,
  validateCouponService,
  useCouponService,
  getCouponQRCode,
  couponGlobalStatsService,
  simulateCouponImpact
} from "../services/coupon.service.js";

export const createCoupon = async (req, res) => {
  try {
    const c = await createCouponService(req.body);
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const r = await validateCouponService(req.body.code, {
      cartAmount: req.body.cartAmount,
      category: req.body.category,
      clientIP: req.ip,
      sandbox: req.body.sandbox || false
    });
    res.json({
      valid: true,
      promotion: r.promo,
      bestApplicablePromotions: r.bestSet || r.allApplicable
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const useCoupon = async (req, res) => {
  try {
    const c = await useCouponService(req.body.code, req.ip);
    res.json({ success: true, message: "Coupon utilisé", coupon: c });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

export const couponQRCode = async (req, res) => {
  try {
    const qr = await getCouponQRCode(req.params.id);
    res.json({ success: true, qrCode: qr });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

export const getCouponStats = async (req, res) => {
  try {
    res.json(await couponGlobalStatsService());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const simulateCouponImpactController = async (req, res) => {
  try {
    const { code, expectedUses = 100, avgOrderValue = 200 } = req.body;
    if (!code) return res.status(400).json({ error: "Code requis" });

    const r = await simulateCouponImpact(code, { expectedUses, avgOrderValue });

    res.json({
      success: true,
      message: "Simulation OK",
      simulation: r
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
