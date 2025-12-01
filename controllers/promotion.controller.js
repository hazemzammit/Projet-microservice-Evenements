// controllers/promotion.controller.js
import {
  createPromotionService,
  getAllPromotionsService,
  getPromotionByIdService,
  updatePromotionService,
  deletePromotionService,
  promotionStatsService,
  syncPromotionStatus
} from "../services/promotion.service.js";
import { writeLog } from "../services/log.service.js";

// Create
export const createPromotion = async (req, res) => {
  try {
    const promo = await createPromotionService(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all
export const getAllPromotions = async (req, res) => {
  try {
    const promos = await getAllPromotionsService();
    res.json(promos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get by id
export const getPromotionById = async (req, res) => {
  try {
    const promo = await getPromotionByIdService(req.params.id);
    res.json(promo);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// Update
export const updatePromotion = async (req, res) => {
  try {
    const updated = await updatePromotionService(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
export const deletePromotion = async (req, res) => {
  try {
    await deletePromotionService(req.params.id);
    res.json({ message: "Promotion supprimée" });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// Stats
export const promotionStats = async (req, res) => {
  try {
    const stats = await promotionStatsService();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manual sync endpoint (useful for debugging / demo)
export const syncPromotionsNow = async (req, res) => {
  try {
    await syncPromotionStatus();
    res.json({ message: "Sync exécutée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Optional: quick endpoint to get active promotions only
export const getActivePromotions = async (req, res) => {
  try {
    const all = await getAllPromotionsService();
    const active = all.filter(p => p.isActive);
    res.json(active);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
