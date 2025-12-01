import mongoose from "mongoose";

const loyaltySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  points: { type: Number, default: 0 },
  level: { type: String, default: "bronze" }
}, { timestamps: true });

export default mongoose.models.Loyalty || mongoose.model("Loyalty", loyaltySchema);