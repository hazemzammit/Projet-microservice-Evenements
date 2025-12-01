// services/coupon.service.js
import Coupon from "../models/coupon.model.js";
import Promotion from "../models/promotion.model.js";
import QRCode from "qrcode";
import { writeLog } from "./log.service.js";
import { chooseBestPromotions } from "./promotion.service.js";
import Loyalty from "../models/loyalty.model.js"; // optionnel: si présent, on peut l'utiliser
import nodemailer from "nodemailer";

/**
 * Helper: send notification email (silent failure if not configured)
 */
async function sendNotificationEmail(to, subject, text) {
  try {
    const host = process.env.SMTP_HOST;
    if (!host) return null; // not configured

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@promotion.local",
      to,
      subject,
      text
    });

    await writeLog("notification", "Email envoyé", { to, subject, info: info.messageId });
    return info;
  } catch (err) {
    // silent log
    await writeLog("notification_error", "Erreur email", { error: err.message });
    return null;
  }
}

/**
 * Create coupon: generates QR code, ensures unique code and valid promotion.
 * Supports sandbox creation via data.sandbox = true (won't persist if sandbox mode).
 */
export const createCouponService = async (data = {}) => {
  const { code, promotion: promotionId, maxUsage = 1, createdBy = null, sandbox = false } = data;

  const promotion = await Promotion.findById(promotionId);
  if (!promotion) throw new Error("Promotion introuvable");

  // uniqueness check
  const exists = await Coupon.findOne({ code });
  if (exists) throw new Error("Code coupon déjà utilisé");

  // create QR data
  const qrCodeDataUrl = await QRCode.toDataURL(code);

  const couponDoc = {
    code,
    promotion: promotion._id,
    maxUsage,
    qrCode: qrCodeDataUrl,
    createdBy
  };

  if (sandbox) {
    // do not persist - return the object as preview (useful for demo mode)
    await writeLog("coupon_sandbox", "Coupon sandbox créé (non persisté)", { code, promotion: promotion._id });
    return { sandbox: true, coupon: couponDoc };
  }

  const coupon = await Coupon.create(couponDoc);

  await writeLog("coupon_create", "Coupon créé", { couponId: coupon._id, promotion: promotion._id, createdBy });

  return coupon;
};

/**
 * Validate coupon: full rule checks (dates, isActive, category, usage, priority/stacking, anti-fraud heuristics).
 * Accepts an options object:
 *   { cartAmount, category, clientIP, userAgent, userId }
 *
 * Returns: { coupon, promo, bestSet }
 */
export const validateCouponService = async (code, options = {}) => {
  const { cartAmount = 0, category = null, clientIP = null, userAgent = null, userId = null } = options;

  const coupon = await Coupon.findOne({ code }).populate("promotion");
  if (!coupon) throw new Error("Coupon introuvable");

  const promo = coupon.promotion;
  if (!promo) throw new Error("Promotion introuvable");

  const now = new Date();
  if (now < promo.startDate) throw new Error("Cette promotion n'a pas encore commencé");
  if (now > promo.endDate) throw new Error("Cette promotion est expirée");
  if (!promo.isActive) throw new Error("Cette promotion est désactivée");

  if (promo.category && category && promo.category !== category) throw new Error("Catégorie non compatible");

  if (coupon.usedCount >= coupon.maxUsage) throw new Error("Coupon épuisé");

  // Anti-fraud heuristics (simple but effective)
  // 1) If same IP used many coupons recently -> flag
  if (clientIP) {
    // store lastUsedIP on coupon; detect quick reuse
    if (coupon.lastUsedIP && coupon.lastUsedIP === clientIP && coupon.usedCount > 0) {
      // suspicious: same IP reusing coupon; log
      await writeLog("fraud", "Réutilisation suspecte du coupon depuis la même IP", { code, ip: clientIP });
      // do not block automatically, but can be escalated
    }
  }

  // 2) Priority / stacking rules: compute best set of promotions for current cart
  try {
    const activePromos = await Promotion.find({ isActive: true });
    const bestSet = chooseBestPromotions(activePromos, cartAmount, category);

    const isInBest = bestSet.find(p => p._id.toString() === promo._id.toString());
    if (!isInBest && !promo.stackable) {
      throw new Error("Il existe une promotion prioritaire non compatible");
    }

    // good - log the validation check
    await writeLog("coupon_validate", "Validation réussie (pré-check)", { code, couponId: coupon._id, userId, clientIP });
    return { coupon, promo, bestSet };
  } catch (err) {
    // bubble up errors from priority engine
    await writeLog("coupon_validate_failed", "Validation échouée", { code, reason: err.message });
    throw err;
  }
};

/**
 * Use coupon (consume one usage).
 * Optionally pass clientIP and user info for fraud detection and logs.
 */
export const useCouponService = async (code, clientIP = null, { userId = null, userAgent = null } = {}) => {
  const coupon = await Coupon.findOne({ code }).populate("promotion");
  if (!coupon) throw new Error("Coupon introuvable");

  // run validation first (will throw if invalid)
  await validateCouponService(code, { clientIP, category: coupon.promotion?.category || null });

  // increment usage atomically
  coupon.usedCount = (coupon.usedCount || 0) + 1;
  coupon.lastUsedIP = clientIP || coupon.lastUsedIP;
  await coupon.save();

  // increment promotion usage counter
  await Promotion.findByIdAndUpdate(coupon.promotion._id, { $inc: { usageCount: 1 } });

  // Loyalty integration: if present, add simple points for user
  try {
    if (userId && typeof Loyalty !== "undefined") {
      let rec = await Loyalty.findOne({ userId });
      if (!rec) rec = await Loyalty.create({ userId, purchases: 0, points: 0 });
      rec.purchases += 1;
      rec.points += Math.floor((coupon.promotion.discountValue || 0) / 10);
      await rec.save();
      await writeLog("loyalty", "Points ajoutés", { userId, points: rec.points });
    }
  } catch (e) {
    await writeLog("loyalty_error", "Erreur loyalty", { error: e.message });
  }

  // Notification: if coupon near exhaustion (>=80%), notify admin
  try {
    const used = coupon.usedCount;
    const max = coupon.maxUsage;
    if (max > 0 && used / max >= 0.8) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendNotificationEmail(adminEmail, `Coupon ${coupon.code} presque épuisé`, `Le coupon ${coupon.code} a été utilisé ${used}/${max} fois.`);
      }
      await writeLog("coupon_threshold", "Coupon proche épuisement", { code: coupon.code, used, max });
    }
  } catch (e) {
    await writeLog("notification_error", "Erreur notification", { error: e.message });
  }

  await writeLog("coupon_use", "Coupon consommé", { code: coupon.code, couponId: coupon._id, userId, clientIP });

  return coupon;
};

/**
 * Return coupon QR code (data URL). If missing, generate and persist.
 */
export const getCouponQRCode = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new Error("Coupon introuvable");
  if (!coupon.qrCode) {
    coupon.qrCode = await QRCode.toDataURL(coupon.code);
    await coupon.save();
  }
  return coupon.qrCode;
};

/**
 * Global coupon stats with more analytics (bonus)
 */
export const couponGlobalStatsService = async () => {
  const totalCoupons = await Coupon.countDocuments();
  const usedCoupons = await Coupon.countDocuments({ usedCount: { $gt: 0 } });
  const unusedCoupons = totalCoupons - usedCoupons;

  // top used coupons
  const topUsed = await Coupon.find().sort({ usedCount: -1 }).limit(5).select("code usedCount promotion");

  // distribution by promotion
  const byPromotion = await Coupon.aggregate([
    { $group: { _id: "$promotion", total: { $sum: 1 }, used: { $sum: "$usedCount" } } },
    { $sort: { used: -1 } }
  ]);

  return { totalCoupons, usedCoupons, unusedCoupons, topUsed, byPromotion };
};

/**
 * BONUS: simulate impact of a coupon set on expected revenue reduction
 * Simple projection: apply discountValue on an estimated number of uses (avg)
 */
export const simulateCouponImpact = async (couponCode, { expectedUses = 10, avgOrderValue = 100 } = {}) => {
  const coupon = await Coupon.findOne({ code: couponCode }).populate("promotion");
  if (!coupon) throw new Error("Coupon introuvable");
  const promo = coupon.promotion;
  if (!promo) throw new Error("Promotion introuvable");

  let perUseSaving = 0;
  if (promo.discountType === "percentage") {
    perUseSaving = (avgOrderValue * (promo.discountValue / 100));
  } else {
    perUseSaving = promo.discountValue;
  }

  const totalSaving = perUseSaving * expectedUses;

  await writeLog("simulation", "Simulation effectuée", { couponCode, expectedUses, avgOrderValue, totalSaving });

  return { couponCode, expectedUses, avgOrderValue, perUseSaving, totalSaving };
};

/**
 * BONUS: sandbox validate (doesn't consume)
 */
export const sandboxValidate = async (code, options = {}) => {
  // same as validateCouponService but mark sandbox true in logs
  const res = await validateCouponService(code, options);
  await writeLog("coupon_sandbox_validate", "Sandbox validation", { code });
  return { sandbox: true, ...res };
};
