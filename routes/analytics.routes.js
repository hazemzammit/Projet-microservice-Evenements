import express from "express";
import { bestPromotionService, mostUsedCouponService, dailyUsageReport } from "../services/analytics.service.js";

const router = express.Router();

router.get("/best-promotion", async (req,res)=>{
  try { res.json(await bestPromotionService()); } catch(err){ res.status(500).json({error: err.message}); }
});
router.get("/most-used-coupon", async (req,res)=>{
  try { res.json(await mostUsedCouponService()); } catch(err){ res.status(500).json({error: err.message}); }
});
router.get("/daily", async (req,res)=>{
  try { res.json(await dailyUsageReport(7)); } catch(err){ res.status(500).json({error: err.message}); }
});

export default router;
