import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { genericRateLimiter } from "./middlewares/rateLimit.js";
import promotionRoutes from "./routes/promotion.routes.js";
import couponRoutes from "./routes/coupon.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(genericRateLimiter);

// ROUTES
app.use("/promotions", promotionRoutes);
app.use("/coupons", couponRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.json({ status: "Promotion API running..." });
});

export default app;
