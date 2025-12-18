import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema({
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
    orderAmount: { type: Number },
    discountApplied: { type: Number },
    usedAt: { type: Date, default: Date.now }
});

export default mongoose.model("CouponUsage", couponUsageSchema);