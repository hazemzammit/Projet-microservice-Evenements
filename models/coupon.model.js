import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true, uppercase: true, trim: true },
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
    type: { 
        type: String, 
        enum: ["single", "multi", "personal"], 
        default: "multi" 
    },
    maxUsage: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ 
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now }
    }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);