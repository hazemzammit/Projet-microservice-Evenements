// jobs/scheduler.job.js
import { syncPromotionStatus } from "../services/promotion.service.js";
import Promotion from "../models/promotion.model.js";
import { writeLog } from "../services/log.service.js";

export const startScheduler = () => {
  console.log("⏳ Scheduler started…");

  const run = async () => {
    try {
      await syncPromotionStatus();

      // détecter chevauchements dans les 3 prochains jours
      const now = new Date();
      const future = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const overlapping = await Promotion.aggregate([
        { $match: { startDate: { $lte: future }, endDate: { $gte: now } } },
        { $group: { _id: "$category", count: { $sum: 1 }, promos: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      if (overlapping.length) {
        if (typeof writeLog === "function") {
          await writeLog("scheduler", "Conflicts detected for upcoming promotions", { overlapping });
        } else {
          console.warn("Scheduler conflicts:", overlapping);
        }
      }

      if (typeof writeLog === "function") await writeLog("scheduler", "Scheduler run completed", { time: new Date() });
    } catch (err) {
      console.error("Scheduler error:", err.message);
      if (typeof writeLog === "function") await writeLog("scheduler", "Scheduler error", { error: err.message });
    }
  };

  run();
  setInterval(run, 60 * 1000); // every minute
};
