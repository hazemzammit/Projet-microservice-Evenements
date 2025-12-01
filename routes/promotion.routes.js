// routes/promotion.routes.js
import { Router } from "express";
import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  promotionStats,
  searchPromotions,
  sendPromotionEmail
} from "../controllers/promotion.controller.js";

const router = Router();

// ORDRE CRITIQUE : LES ROUTES SPÉCIFIQUES DOIVENT ÊTRE AVANT LES PARAMÈTRES

router.post("/", createPromotion);
router.get("/", getAllPromotions);
router.get("/stats", promotionStats);
router.get("/search", searchPromotions);     // ← AVANT la route :id !
router.post("/send-email", sendPromotionEmail);

// Routes avec paramètres (doivent être en dernier)
router.get("/:id", getPromotionById);
router.put("/:id", updatePromotion);
router.delete("/:id", deletePromotion);

export default router;