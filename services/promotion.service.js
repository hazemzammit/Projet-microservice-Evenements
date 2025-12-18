import Promotion from "../models/promotion.model.js";

export const createPromotionService = async (data) => {
    return await Promotion.create(data);
};

export const getPromotionsService = async () => {
    return await Promotion.find().sort({ createdAt: -1 });
};

export const getPromotionByIdService = async (id) => {
    const promo = await Promotion.findById(id);
    if (!promo) throw new Error("Promotion introuvable");
    return promo;
};

export const deactivatePromotionService = async (id) => {
    const promo = await Promotion.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!promo) throw new Error("Promotion introuvable");
    return promo;
};