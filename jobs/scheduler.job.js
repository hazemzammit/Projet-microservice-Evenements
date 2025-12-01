// jobs/scheduler.job.js
import cron from "node-cron";
import Promotion from "../models/promotion.model.js";
import { writeLog } from "../services/log.service.js";

export const startScheduler = () => {
  console.log("Scheduler démarré (cron)");

  // Toutes les nuits à 2h du matin
  cron.schedule("0 2 * * *", async () => {
    console.log("Mise à jour automatique du statut des promotions...");
    const now = new Date();

    try {
      const result = await Promotion.updateMany(
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { isActive: true }
      );
      await Promotion.updateMany(
        { $or: [{ endDate: { $lt: now } }, { startDate: { $gt: now } }] },
        { isActive: false }
      );

      await writeLog("cron_promotion_status", "Statut promotions mis à jour", {
        activated: result.modifiedCount
      });
    } catch (err) {
      await writeLog("cron_error", "Erreur mise à jour statut", { error: err.message });
    }
  }, {
    timezone: process.env.CRON_TIMEZONE || "Africa/Tunis"
  });
};