import express from "express";
import { createPromotion, getPromotions, deactivatePromotion, sendPromotion } from "../controllers/promotion.controller.js";

const router = express.Router();

router.post("/", createPromotion);
router.get("/", getPromotions);
router.put("/:id/deactivate", deactivatePromotion);
router.post("/send", sendPromotion); // Envoi email promo

export default router;