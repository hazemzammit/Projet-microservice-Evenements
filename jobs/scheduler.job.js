import Promotion from "../models/promotion.model.js";

export const startScheduler = () => {
  console.log("⏳ Scheduler started…");

  // 👉 Vérification toutes les 1 minute
  setInterval(async () => {
    const now = new Date();

    try {
      // 🔴 Désactiver promotions expirées
      await Promotion.updateMany(
        { endDate: { $lt: now }, isActive: true },
        { $set: { isActive: false } }
      );

      // 🟢 Activer promotions dont la période commence
      await Promotion.updateMany(
        { startDate: { $lte: now }, endDate: { $gt: now }, isActive: false },
        { $set: { isActive: true } }
      );

      console.log("🔄 Scheduler : mises à jour effectuées");

    } catch (err) {
      console.error("Scheduler error:", err.message);
    }

  }, 60 * 1000); // 1 minute
};
