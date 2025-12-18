import {
    createCouponService,
    validateCouponService,
    useCouponService,
    deactivateCouponService,
    sendCouponAfterPurchase
} from "../services/coupon.service.js";
import Promotion from "../models/promotion.model.js";

export const createCoupon = async (req, res) => {
    try {
        const coupon = await createCouponService(req.body);
        res.status(201).json(coupon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { code, category, userId, cartAmount } = req.body;
        const result = await validateCouponService(code, category, userId, cartAmount);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const useCoupon = async (req, res) => {
    try {
        const { code, userId, cartAmount } = req.body;
        const result = await useCouponService(code, userId, cartAmount);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deactivateCoupon = async (req, res) => {
    try {
        const coupon = await deactivateCouponService(req.body.code);
        res.json(coupon);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const applyDiscount = async (req, res) => {
    try {
        const { code, category, cartAmount = 0, userId } = req.body;

        let result = {
            originalAmount: cartAmount,
            discountApplied: 0,
            finalAmount: cartAmount,
            appliedPromotion: null,
            appliedCoupon: null
        };

        if (code) {
            const useResult = await useCouponService(code, userId, cartAmount);
            result.discountApplied = useResult.discount;
            result.finalAmount = useResult.finalAmount;
            result.appliedPromotion = useResult.promotion;
            result.appliedCoupon = useResult.coupon;
        } else {
            const now = new Date();
            const bestPromo = await Promotion.findOne({
                category,
                isActive: true,
                startDate: { $lte: now },
                $or: [{ endDate: { $gte: now } }, { endDate: null }],
                minPurchaseAmount: { $lte: cartAmount },
                $or: [{ maxUsesTotal: { $gt: "$usesCount" } }, { maxUsesTotal: null }]
            }).sort({ discountValue: -1 });

            if (bestPromo) {
                let discount = bestPromo.discountType === "percentage"
                    ? cartAmount * (bestPromo.discountValue / 100)
                    : bestPromo.discountValue;

                bestPromo.usesCount += 1;
                await bestPromo.save();

                result.discountApplied = discount;
                result.finalAmount = cartAmount - discount;
                result.appliedPromotion = bestPromo;
            }
        }

        // Simuler un achat et envoyer coupon si applicable
        if (result.finalAmount > 0 && userId && result.appliedPromotion) { // Suppose un achat réussi
            await sendCouponAfterPurchase(userId, result.appliedPromotion._id, cartAmount);
        }

        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};