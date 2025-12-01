import Promotion from "../models/promotion.model.js";
import Coupon from "../models/coupon.model.js";
import Log from "../models/log.model.js";
import mongoose from "mongoose";

export const bestPromotionService = async () => {
  const res = await Promotion.aggregate([
    { $project: { name: 1, usageCount: 1, discountValue: 1 } },
    { $sort: { usageCount: -1, discountValue: -1 } },
    { $limit: 5 }
  ]);
  return res;
};

export const mostUsedCouponService = async () => {
  return await Coupon.find().sort({ usedCount: -1 }).limit(5);
};

export const dailyUsageReport = async (days = 7) => {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const res = await Log.aggregate([
    { $match: { createdAt: { $gte: from }, type: { $in: ["coupon_use","coupon_validate"] } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  return res;
};
