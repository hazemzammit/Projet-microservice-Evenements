import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },

    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true
    },

    maxUsage: { type: Number, default: 10 },
    usedCount: { type: Number, default: 0 },

    qrCode: { type: String }, // data:image/png;base64,…

    lastUsedIP: { type: String }, // anti-fraude
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", CouponSchema);
