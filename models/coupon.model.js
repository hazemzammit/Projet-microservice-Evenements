import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
  maxUsage: { type: Number, required: true },
  usedCount: { type: Number, default: 0 },
  qrCode: { type: String },
  createdBy: { type: String }, // optional user id/email
  lastUsedIP: { type: String }
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
