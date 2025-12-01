import express from "express";

import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  deletePromotion,
  validatePromotionDate,
  createEventPromotion,
  getPromotionStats,
  getPromotionDetailStats
} from "../controllers/promotion.controller.js";

const router = express.Router();

// ================================
// CRUD Promotions
// ================================
router.post("/", createPromotion);
router.get("/", getAllPromotions);
router.get("/:id", getPromotionById);
router.delete("/:id", deletePromotion);

// ================================
// Validation date d’une promotion
// ================================
router.get("/validate/:id", validatePromotionDate);

// ================================
// Events spéciaux
// Ex: /promotions/create-event/ramadan
// ================================
router.post("/create-event/:event", createEventPromotion);

// ================================
// Statistiques
// ================================
router.get("/stats/global", getPromotionStats);
router.get("/stats/:id", getPromotionDetailStats);

export default router;
