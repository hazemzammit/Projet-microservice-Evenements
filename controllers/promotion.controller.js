// controllers/promotion.controller.js → Remplace tout le fichier
import {
  createPromotionService,
  getAllPromotionsService,
  getPromotionByIdService,
  updatePromotionService,
  deletePromotionService,
  searchPromotionsService,
  sendPromotionsByEmailService
} from "../services/promotion.service.js";
import Promotion from "../models/promotion.model.js";

// CREATE
export const createPromotion = async (req, res) => {
  try {
    const promo = await createPromotionService(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ALL
export const getAllPromotions = async (req, res) => {
  try {
    res.json(await getAllPromotionsService());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ID
export const getPromotionById = async (req, res) => {
  try {
    res.json(await getPromotionByIdService(req.params.id));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// UPDATE
export const updatePromotion = async (req, res) => {
  try {
    res.json(await updatePromotionService(req.params.id, req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deletePromotion = async (req, res) => {
  try {
    await deletePromotionService(req.params.id);
    res.json({ message: "Promotion supprimée" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// SEARCH
export const searchPromotions = async (req, res) => {
  try {
    res.json(await searchPromotionsService(req.query));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// STATS (était manquant)
export const promotionStats = async (req, res) => {
  try {
    const total = await Promotion.countDocuments();
    const active = await Promotion.countDocuments({ isActive: true });
    const byCategory = await Promotion.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json({ total, active, inactive: total - active, byCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEND EMAIL
export const sendPromotionEmail = async (req, res) => {
  try {
    const { email, promotionId } = req.body;
    const result = await sendPromotionsByEmailService(email, promotionId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};