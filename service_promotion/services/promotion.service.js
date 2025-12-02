import Promotion from "../models/promotion.model.js";

// ========================
//  CREATE PROMOTION
// ========================
export const createPromotionService = async (data) => {
  const promo = await Promotion.create(data);
  return promo;
};

// ========================
//  GET ALL
// ========================
export const getAllPromotionsService = async () => {
  return Promotion.find();
};

// ========================
//  GET BY ID
// ========================
export const getPromotionByIdService = async (id) => {
  return Promotion.findById(id);
};

// ========================
//  DELETE PROMOTION
// ========================
export const deletePromotionService = async (id) => {
  return Promotion.findByIdAndDelete(id);
};

// ========================
//   VALIDATION TEMPS RÉEL
// ========================
export const validatePromotionByDate = (promotion) => {
  const now = new Date();

  if (now < promotion.startDate) {
    throw new Error("Cette promotion n’a pas encore commencé.");
  }

  if (now > promotion.endDate) {
    throw new Error("Cette promotion est expirée.");
  }

  if (!promotion.isActive) {
    throw new Error("Cette promotion est inactive.");
  }

  return true;
};

// ========================
// 🌙 EVENTS SPÉCIAUX (Ramadan, BF…)
// ========================
export const createEventPromotionService = async (eventName) => {
  const events = {
    ramadan: {
      name: "Promo Ramadan",
      description: "Offre spéciale Ramadan",
      discountType: "percentage",
      discountValue: 20,
      category: "ramadan",
      startDate: new Date("2025-02-28"),
      endDate: new Date("2025-04-05")
    },

    blackfriday: {
      name: "Black Friday",
      description: "Super réductions Black Friday",
      discountType: "percentage",
      discountValue: 40,
      category: "blackfriday",
      startDate: new Date("2025-11-28"),
      endDate: new Date("2025-11-30")
    },

    findeannee: {
      name: "Fin d'année",
      description: "Offre spéciale de fin d'année",
      discountType: "percentage",
      discountValue: 30,
      category: "findannee",
      startDate: new Date("2025-12-15"),
      endDate: new Date("2026-01-02")
    },

    cybermonday: {
      name: "Cyber Monday",
      description: "Promotions Cyber Monday",
      discountType: "percentage",
      discountValue: 35,
      category: "cybermonday",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-01")
    }
  };

  if (!events[eventName]) {
    throw new Error("Événement inconnu");
  }

  return await Promotion.create(events[eventName]);
};

// ========================
// 📊 STATS : GLOBALS
// ========================
export const promotionStatsService = async () => {
  const stats = await Promotion.aggregate([
    {
      $group: {
        _id: "$category",
        totalPromotions: { $sum: 1 },
        avgDiscount: { $avg: "$discountValue" },
        activePromotions: {
          $sum: { $cond: ["$isActive", 1, 0] }
        }
      }
    }
  ]);

  return stats;
};

// ========================
// 📊 STATS D’UNE PROMOTION
// ========================
export const promotionDetailStatsService = async (id) => {
  const promo = await Promotion.findById(id);

  if (!promo) throw new Error("Promotion introuvable");

  return {
    name: promo.name,
    active: promo.isActive,
    startDate: promo.startDate,
    endDate: promo.endDate,
    discount: promo.discountValue,
    type: promo.discountType,
    category: promo.category
  };
};
