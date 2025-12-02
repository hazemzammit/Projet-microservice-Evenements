import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true
    },

    discountValue: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      default: "general"
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    isActive: { type: Boolean, default: true },

    minPurchase: { type: Number, default: 0 },
    stackable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Promotion", PromotionSchema);
