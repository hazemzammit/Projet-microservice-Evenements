import express from "express";
import promotionRoutes from "./routes/promotion.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const app = express();

app.use(express.json());

app.use("/api/promotions", promotionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/stats", statsRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
});

export default app;