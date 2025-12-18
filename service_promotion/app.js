import express from "express";
import cors from "cors";
import promotionRoutes from "./routes/promotion.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true }));

// ============= HEALTH CHECK ROUTE =============
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: 'healthy',
    service: 'service-promotions',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============= BASE ROUTE =============
app.get("/", (req, res) => {
  res.json({ 
    message: "Service Promotions API",
    version: "1.0.0",
    service: "service-promotions",
    endpoints: {
      promotions: "/api/promotions",
      coupons: "/api/coupons",
      stats: "/api/stats",
      health: "/health"
    },
    timestamp: new Date().toISOString()
  });
});

// ============= API ROUTES =============
app.use("/api/promotions", promotionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/stats", statsRoutes);

// ============= 404 HANDLER =============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// ============= ERROR HANDLING MIDDLEWARE =============
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;