import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  type: { type: String, enum: ["coupon_use","coupon_validate","promotion_change","fraud","scheduler","loyalty"], required: true },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Log || mongoose.model("Log", logSchema);
