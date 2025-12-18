import CouponUsage from "../models/couponUsage.model.js";
import Promotion from "../models/promotion.model.js";
import Coupon from "../models/coupon.model.js";

export const getStatsService = async () => {
    const totalUsages = await CouponUsage.countDocuments();
    const totalDiscount = await CouponUsage.aggregate([
        { $group: { _id: null, total: { $sum: "$discountApplied" } } }
    ]);

    const popularPromotions = await CouponUsage.aggregate([
        { $group: { _id: "$promotion", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "promotions", localField: "_id", foreignField: "_id", as: "promotion" } },
        { $unwind: "$promotion" }
    ]);

    const usageRate = await Promotion.aggregate([
        { $project: { usageRate: { $cond: [{ $eq: ["$maxUsesTotal", null] }, null, { $divide: ["$usesCount", "$maxUsesTotal"] } ] } } }
    ]);

    const recentUsages = await CouponUsage.find().sort({ usedAt: -1 }).limit(10).populate("coupon promotion user");

    return {
        totalUsages,
        totalDiscountApplied: totalDiscount[0]?.total || 0,
        popularPromotions,
        averageUsageRate: usageRate.reduce((acc, cur) => acc + (cur.usageRate || 0), 0) / usageRate.length || 0,
        recentUsages
    };
};