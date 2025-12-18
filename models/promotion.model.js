import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    category: { type: String, required: true },
    minPurchaseAmount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    maxUsesTotal: { type: Number },
    usesCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Promotion", promotionSchema);