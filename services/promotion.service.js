// services/promotion.service.js
import Promotion from "../models/promotion.model.js";
import { writeLog } from "./log.service.js";

// ---------------------------------------------
// 1) GET DATES D’ÉVÉNEMENTS AUTOMATIQUES
// ---------------------------------------------
export function getEventDates(category, year = new Date().getFullYear()) {
  const events = {
    ramadan: {
      start: new Date(`${year}-03-01T00:00:00.000Z`),
      end: new Date(`${year}-03-30T23:59:59.000Z`)
    },
    black_friday: {
      start: new Date(`${year}-11-27T00:00:00.000Z`),
      end: new Date(`${year}-11-30T23:59:59.000Z`)
    },
    cyber_monday: {
      start: new Date(`${year}-12-01T00:00:00.000Z`),
      end: new Date(`${year}-12-02T23:59:59.000Z`)
    },
    end_year: {
      start: new Date(`${year}-12-20T00:00:00.000Z`),
      end: new Date(`${year}-12-31T23:59:59.000Z`)
    },
    back_to_school: {
      start: new Date(`${year}-09-01T00:00:00.000Z`),
      end: new Date(`${year}-09-30T23:59:59.000Z`)
    }
  };
  return events[category] || null;
}

// ---------------------------------------------
// 2) UTILS
// ---------------------------------------------
function now() {
  return new Date();
}

function computeIsActive(startDate, endDate) {
  const n = now();
  return n >= new Date(startDate) && n <= new Date(endDate);
}

// ---------------------------------------------
// 3) CREATE PROMOTION
// ---------------------------------------------
export const createPromotionService = async (data) => {
  let { startDate, endDate, category } = data;

  // Auto dates pour événements
  const eventDates = getEventDates(category);
  if (eventDates && (!startDate || !endDate)) {
    startDate = eventDates.start;
    endDate = eventDates.end;
  }

  if (!startDate || !endDate) {
    throw new Error("startDate et endDate sont obligatoires");
  }

  // Actif ?
  const isActive = computeIsActive(startDate, endDate);

  // Détection de conflits
  const conflicts = await Promotion.find({
    $or: [
      { category: category },
      {
        $and: [
          { startDate: { $lt: new Date(endDate) } },
          { endDate: { $gt: new Date(startDate) } }
        ]
      }
    ]
  });

  if (conflicts.length > 0) {
    await writeLog("promotion_conflict", "Conflits détectés lors de la création", {
      conflicts: conflicts.map(c => c._id)
    });
  }

  const promo = await Promotion.create({
    ...data,
    startDate,
    endDate,
    isActive
  });

  await writeLog("promotion_create", "Promotion créée", { promotionId: promo._id });

  return promo;
};

// ---------------------------------------------
// 4) GET ALL
// ---------------------------------------------
export const getAllPromotionsService = async () => {
  return await Promotion.find().sort({ priority: -1, createdAt: -1 });
};

// ---------------------------------------------
// 5) GET BY ID
// ---------------------------------------------
export const getPromotionByIdService = async (id) => {
  const promo = await Promotion.findById(id);
  if (!promo) throw new Error("Promotion introuvable");
  return promo;
};

// ---------------------------------------------
// 6) UPDATE
// ---------------------------------------------
export const updatePromotionService = async (id, data) => {
  if (data.startDate && data.endDate) {
    data.isActive = computeIsActive(data.startDate, data.endDate);
  }

  const updated = await Promotion.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new Error("Promotion introuvable");

  await writeLog("promotion_update", "Promotion mise à jour", { promotionId: id });

  return updated;
};

// ---------------------------------------------
// 7) DELETE
// ---------------------------------------------
export const deletePromotionService = async (id) => {
  const deleted = await Promotion.findByIdAndDelete(id);
  if (!deleted) throw new Error("Promotion introuvable");

  await writeLog("promotion_delete", "Promotion supprimée", { promotionId: id });

  return true;
};

// ---------------------------------------------
// 8) PRIORITY & STACKING ENGINE
// ---------------------------------------------
export const chooseBestPromotions = (promotions = [], cartAmount = 0, category = null) => {
  let candidates = promotions.filter(p =>
    cartAmount >= (p.minPurchase || 0) &&
    (p.category === "normal" || !p.category || !category || p.category === category || p.category === "all")
  );

  // tri par priorité puis valeur du discount
  candidates.sort((a, b) =>
    (b.priority - a.priority) ||
    (b.discountValue - a.discountValue)
  );

  const selected = [];

  for (const p of candidates) {
    if (selected.length === 0) {
      selected.push(p);
      continue;
    }

    if (p.stackable) {
      selected.push(p);
    } else {
      const anyNonStack = selected.find(s => !s.stackable);
      if (!anyNonStack) selected.push(p);
    }
  }

  return selected;
};

// ---------------------------------------------
// 9) STATS AVANCÉES
// ---------------------------------------------
export const promotionStatsService = async () => {
  const totalPromotions = await Promotion.countDocuments();
  const activePromotions = await Promotion.countDocuments({ isActive: true });

  const byCategory = await Promotion.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgDiscount: { $avg: "$discountValue" }
      }
    }
  ]);

  return {
    totalPromotions,
    activePromotions,
    byCategory
  };
};

// ---------------------------------------------
// 10) SYNC (SCHEDULER)
// ---------------------------------------------
export const syncPromotionStatus = async () => {
  const current = new Date();

  await Promotion.updateMany(
    { startDate: { $lte: current }, endDate: { $gte: current } },
    { $set: { isActive: true } }
  );

  await Promotion.updateMany(
    { $or: [{ startDate: { $gt: current } }, { endDate: { $lt: current } }] },
    { $set: { isActive: false } }
  );

  await writeLog("scheduler", "Mise à jour automatique des statuts promotions", {
    time: current
  });
};
