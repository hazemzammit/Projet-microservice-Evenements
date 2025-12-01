import Loyalty from "../models/loyalty.model.js";
import { writeLog } from "./log.service.js";

export const addPurchaseForUser = async (userId, amount = 0) => {
  let record = await Loyalty.findOne({ userId });
  if (!record) record = await Loyalty.create({ userId, purchases: 0, points: 0 });
  record.purchases += 1;
  record.points += Math.floor(amount / 10); // 1 point per 10 currency
  // update tier
  if (record.points >= 100) record.tier = "gold";
  else if (record.points >= 50) record.tier = "silver";
  else record.tier = "bronze";
  await record.save();
  await writeLog("loyalty", "Purchase added", { userId, purchases: record.purchases, points: record.points });
  // optionally generate loyalty promo when reach thresholds
  if (record.purchases === 5) {
    await writeLog("loyalty", "User reached 5 purchases - consider issuing loyalty coupon", { userId });
  }
  return record;
};

export const getLoyaltyForUser = async (userId) => {
  return await Loyalty.findOne({ userId });
};
