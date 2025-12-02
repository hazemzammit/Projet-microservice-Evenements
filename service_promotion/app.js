import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// Routes
import promotionRoutes from "./routes/promotion.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import { genericRateLimiter } from "./middlewares/rateLimit.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));
app.use(genericRateLimiter);

// ============= HEALTH CHECK ROUTE =============
app.get("/health", (req, res) => {
  res.json({
    status: 'healthy',
    service: 'service-promotions',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============= MAIN ROUTES =============
app.get("/", (req, res) => {
  res.json({ 
    message: "Promotion API is running...",
    version: "1.0.0",
    endpoints: {
      promotions: "/promotions",
      coupons: "/coupons",
      health: "/health"
    }
  });
});

app.use("/promotions", promotionRoutes);
app.use("/coupons", couponRoutes);

// ============= ERROR HANDLING =============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

export default app;