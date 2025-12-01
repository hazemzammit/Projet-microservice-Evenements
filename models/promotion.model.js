import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true },

  category: {
    type: String,
    enum: ["ramadan", "black_friday", "cyber_monday", "end_year", "student", "professional", "normal"],
    default: "normal"
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  isActive: { type: Boolean, default: false },

  // Priorité + stacking
  priority: { type: Number, default: 0 }, // higher = applied first
  stackable: { type: Boolean, default: false }, // if true, can be combined with others
  minPurchase: { type: Number, default: 0 },

  // usage tracking
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Promotion || mongoose.model("Promotion", promotionSchema);
