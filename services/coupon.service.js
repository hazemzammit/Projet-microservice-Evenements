import Coupon from "../models/coupon.model.js";
import Promotion from "../models/promotion.model.js";
import QRCode from "qrcode";

// ========================
//  CREATE COUPON
// ========================
export const createCouponService = async (data) => {
  const promotion = await Promotion.findById(data.promotion);
  if (!promotion) throw new Error("Promotion introuvable");

  const qrCodeImage = await QRCode.toDataURL(data.code);

  return Coupon.create({
    code: data.code,
    promotion: promotion._id,
    maxUsage: data.maxUsage,
    qrCode: qrCodeImage
  });
};

// ========================
//  AUTO-GENERATED COUPON
// ========================
export const autoGenerateCouponService = async (promotionId) => {
  const promo = await Promotion.findById(promotionId);
  if (!promo) throw new Error("Promotion introuvable");

  const randomCode = "AUTO-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const qrCodeImage = await QRCode.toDataURL(randomCode);

  return Coupon.create({
    code: randomCode,
    promotion: promo._id,
    maxUsage: 5,
    qrCode: qrCodeImage
  });
};

// ========================
// VALIDATE COUPON
// ========================
export const validateCouponService = async (code, category, clientIP) => {
  const coupon = await Coupon.findOne({ code }).populate("promotion");
  if (!coupon) throw new Error("Coupon introuvable");

  const promo = coupon.promotion;

  // 1. Vérifier les dates
  const now = new Date();
  if (now < promo.startDate || now > promo.endDate) {
    throw new Error("Cette promotion n'est pas valide aujourd’hui.");
  }

  // 2. Vérifier la catégorie
  if (promo.category !== category) {
    throw new Error("Cette promotion n’est pas autorisée pour cette catégorie.");
  }

  // 3. Anti-fraude IP
  if (coupon.lastUsedIP && coupon.lastUsedIP === clientIP) {
    throw new Error("Suspicious activity: same IP repeatedly.");
  }

  return promo;
};

// ========================
//  USE COUPON
// ========================
export const useCouponService = async (code, clientIP) => {
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw new Error("Coupon introuvable");

  if (coupon.usedCount >= coupon.maxUsage) {
    throw new Error("Coupon déjà utilisé au maximum");
  }

  // anti-fraude
  coupon.lastUsedIP = clientIP;

  coupon.usedCount++;
  await coupon.save();

  return coupon;
};

// ========================
// 📊 GLOBAL COUPON STATS
// ========================
export const couponGlobalStatsService = async () => {
  return await Coupon.aggregate([
    {
      $group: {
        _id: null,
        totalCoupons: { $sum: 1 },
        totalUsed: { $sum: "$usedCount" },
        totalRemaining: {
          $sum: { $subtract: ["$maxUsage", "$usedCount"] }
        }
      }
    }
  ]);
};

// ========================
// 📊 COUPON BY PROMOTION
// ========================
export const couponStatsByPromotionService = async (promotionId) => {
  return Coupon.aggregate([
    { $match: { promotion: new mongoose.Types.ObjectId(promotionId) } },
    {
      $group: {
        _id: "$promotion",
        total: { $sum: 1 },
        totalUsed: { $sum: "$usedCount" }
      }
    }
  ]);
};
