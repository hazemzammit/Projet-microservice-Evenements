import Coupon from "../models/coupon.model.js";
import Promotion from "../models/promotion.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import { nanoid } from "nanoid";
import { sendCouponEmail } from "./email.service.js"; // Pour envoi après achat

const generateCode = () => `PROMO-${nanoid(8).toUpperCase()}`;

export const createCouponService = async ({
    promotionId,
    type = "multi",
    maxUsage,
    code,
    expiresAt,
    assignedTo
}) => {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) throw new Error("Promotion introuvable");
    if (!promotion.isActive) throw new Error("Promotion désactivée");

    const finalCode = code || generateCode();

    const existing = await Coupon.findOne({ code: finalCode });
    if (existing) throw new Error("Ce code existe déjà");

    const coupon = new Coupon({
        code: finalCode,
        promotion: promotion._id,
        type,
        maxUsage: type === "single" ? 1 : (maxUsage || 100),
        expiresAt,
        assignedTo: type === "personal" ? assignedTo : undefined
    });

    return await coupon.save();
};

export const validateCouponService = async (code, category, userId = null, cartAmount = 0) => {
    const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(), 
        isActive: true 
    }).populate("promotion");

    if (!coupon) throw new Error("Coupon introuvable ou désactivé");

    const now = new Date();

    if (coupon.expiresAt && now > coupon.expiresAt) {
        throw new Error("Coupon expiré");
    }

    const promo = coupon.promotion;

    if (!promo.isActive) throw new Error("Promotion désactivée");
    if (promo.startDate > now) throw new Error("Promotion pas encore active");
    if (promo.endDate && promo.endDate < now) throw new Error("Promotion expirée");
    if (promo.category !== category) throw new Error("Catégorie non éligible");
    if (cartAmount < promo.minPurchaseAmount) {
        throw new Error(`Montant minimum requis : ${promo.minPurchaseAmount}€`);
    }
    if (promo.maxUsesTotal && promo.usesCount >= promo.maxUsesTotal) {
        throw new Error("Limite globale de la promotion atteinte");
    }

    if (coupon.type === "personal" && coupon.assignedTo.toString() !== userId?.toString()) {
        throw new Error("Ce coupon est personnel et ne vous est pas assigné");
    }

    if (userId) {
        const alreadyUsed = coupon.usedBy.some(u => u.user.toString() === userId.toString());
        if (alreadyUsed && coupon.type !== "multi") {
            throw new Error("Vous avez déjà utilisé ce coupon");
        }
    }

    if (coupon.type === "multi" && coupon.usedCount >= coupon.maxUsage) {
        throw new Error("Coupon épuisé");
    }

    return { valid: true, coupon, promotion: promo };
};

export const useCouponService = async (code, userId = null, cartAmount = 0) => {
    const { coupon, promotion } = await validateCouponService(code, promotion.category, userId, cartAmount);

    let discount = 0;
    if (promotion.discountType === "percentage") {
        discount = cartAmount * (promotion.discountValue / 100);
    } else {
        discount = promotion.discountValue;
    }

    coupon.usedCount += 1;
    if (userId) {
        coupon.usedBy.push({ user: userId });
    }
    promotion.usesCount += 1;

    await coupon.save();
    await promotion.save();

    await CouponUsage.create({
        coupon: coupon._id,
        user: userId,
        promotion: promotion._id,
        orderAmount: cartAmount,
        discountApplied: discount
    });

    return {
        message: "Coupon appliqué !",
        discount,
        finalAmount: cartAmount - discount,
        promotion,
        coupon
    };
};

export const deactivateCouponService = async (code) => {
    const coupon = await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { isActive: false }, { new: true });
    if (!coupon) throw new Error("Coupon introuvable");
    return coupon;
};

// Fonction pour envoi coupon après achat (appelée depuis un endpoint achat simulé)
export const sendCouponAfterPurchase = async (userId, promotionId, cartAmount) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    // Logique métier : si achat > 100€, envoyer un coupon personnel
    if (cartAmount > 100) {
        const coupon = await createCouponService({
            promotionId,
            type: "personal",
            assignedTo: userId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
        });

        await sendCouponEmail(user.email, coupon.code, promotionId);
        return coupon;
    }
    return null;
};