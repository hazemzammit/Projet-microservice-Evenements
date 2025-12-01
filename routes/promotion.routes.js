// routes/promotion.routes.js
import { Router } from "express";
import {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  promotionStats
} from "../controllers/promotion.controller.js";

const router = Router();

router.post("/", createPromotion);
router.get("/", getAllPromotions);
router.get("/stats", promotionStats);
router.get("/:id", getPromotionById);
router.put("/:id", updatePromotion);
router.delete("/:id", deletePromotion);

export default router;
