import { createPromotionService, getPromotionsService, deactivatePromotionService } from "../services/promotion.service.js";
import { sendPromotionEmail } from "../services/email.service.js";

export const createPromotion = async (req, res) => {
    try {
        const promotion = await createPromotionService(req.body);
        res.status(201).json(promotion);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getPromotions = async (req, res) => {
    try {
        const promotions = await getPromotionsService();
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deactivatePromotion = async (req, res) => {
    try {
        const promotion = await deactivatePromotionService(req.params.id);
        res.json(promotion);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const sendPromotion = async (req, res) => {
    try {
        const { emails, promotionId } = req.body;
        const result = await sendPromotionEmail(emails, promotionId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};