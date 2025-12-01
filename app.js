import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Routes
import promotionRoutes from "./routes/promotion.routes.js";
import couponRoutes from "./routes/coupon.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));

// Routes
app.use("/promotions", promotionRoutes);
app.use("/coupons", couponRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Promotion API is running..." });
});
import { genericRateLimiter } from "./middlewares/rateLimit.js";
app.use(genericRateLimiter);

export default app;
