import {
  createPromotionService,
  getAllPromotionsService,
  getPromotionByIdService,
  deletePromotionService,
  validatePromotionByDate,
  createEventPromotionService,
  promotionStatsService,
  promotionDetailStatsService
} from "../services/promotion.service.js";

// =====================================
// 🟢 CREATE PROMOTION
// =====================================
export const createPromotion = async (req, res) => {
  try {
    const promotion = await createPromotionService(req.body);
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 GET ALL PROMOTIONS
// =====================================
export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await getAllPromotionsService();
    res.json(promotions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 GET ONE PROMOTION
// =====================================
export const getPromotionById = async (req, res) => {
  try {
    const promo = await getPromotionByIdService(req.params.id);
    if (!promo) return res.status(404).json({ error: "Promotion introuvable" });
    res.json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 DELETE PROMOTION
// =====================================
export const deletePromotion = async (req, res) => {
  try {
    const deleted = await deletePromotionService(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Promotion introuvable" });
    res.json({ message: "Promotion supprimée", deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 VALIDATE PROMOTION DATE
// =====================================
export const validatePromotionDate = async (req, res) => {
  try {
    const promo = await getPromotionByIdService(req.params.id);
    if (!promo) return res.status(404).json({ error: "Promotion introuvable" });

    validatePromotionByDate(promo);

    res.json({ valid: true, promotion: promo });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 CREATE EVENT PROMOTION (Ramadan, BF…)
// =====================================
export const createEventPromotion = async (req, res) => {
  try {
    const eventName = req.params.event;
    const promo = await createEventPromotionService(eventName);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 GLOBAL STATS
// =====================================
export const getPromotionStats = async (req, res) => {
  try {
    const stats = await promotionStatsService();
    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================================
// 🟢 DETAILS STATS
// =====================================
export const getPromotionDetailStats = async (req, res) => {
  try {
    const stats = await promotionDetailStatsService(req.params.id);
    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
