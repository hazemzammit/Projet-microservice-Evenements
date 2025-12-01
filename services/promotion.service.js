// services/promotion.service.js
import Promotion from "../models/promotion.model.js";
import { writeLog } from "./log.service.js";
import { sendEmail } from "./mail.service.js";

// ------------- UTILITAIRES -------------
export function getEventDates(category, year = new Date().getFullYear()) {
  const events = {
    ramadan: { start: new Date(`${year}-03-10`), end: new Date(`${year}-04-09`) },
    black_friday: { start: new Date(`${year}-11-27`), end: new Date(`${year}-11-30`) },
    cyber_monday: { start: new Date(`${year}-12-01`), end: new Date(`${year}-12-02`) },
    end_year: { start: new Date(`${year}-12-20`), end: new Date(`${year}-12-31`) },
    back_to_school: { start: new Date(`${year}-09-01`), end: new Date(`${year}-09-30`) }
  };
  return events[category] || null;
}

const now = () => new Date();
function computeIsActive(startDate, endDate) {
  const n = now();
  return n >= new Date(startDate) && n <= new Date(endDate);
}

// ---------------- FONCTION MANQUANTE (CRITIQUE) ----------------
export const chooseBestPromotions = async (cartAmount = 0, category = null) => {
  const promotions = await Promotion.find({ isActive: true }).sort({ priority: -1 });

  const applicable = [];
  const stackable = [];

  for (const promo of promotions) {
    if (cartAmount < promo.minPurchase) continue;
    if (category && promo.category !== "normal" && promo.category !== category) continue;

    if (promo.stackable) {
      stackable.push(promo);
    } else {
      applicable.push(promo);
    }
  }

  // On prend les non-stackables d'abord (priorité haute), puis on ajoute les stackables
  const bestSet = [...applicable.slice(0, 1), ...stackable];

  await writeLog("promotion_selection", "Meilleures promotions sélectionnées", {
    cartAmount,
    category,
    count: bestSet.length,
    promoIds: bestSet.map(p => p._id)
  });

  return { bestSet, allApplicable: [...applicable, ...stackable] };
};

// ---------------- CRUD ----------------
export const createPromotionService = async (data) => {
  let { startDate, endDate, category } = data;

  const eventDates = getEventDates(category);
  if (eventDates && (!startDate || !endDate)) {
    startDate = eventDates.start;
    endDate = eventDates.end;
  }

  if (!startDate || !endDate) throw new Error("startDate et endDate obligatoires");

  const isActive = computeIsActive(startDate, endDate);

  const promo = await Promotion.create({ ...data, startDate, endDate, isActive });
  return promo;
};

export const getAllPromotionsService = async () => {
  return await Promotion.find().sort({ priority: -1, createdAt: -1 });
};

export const getPromotionByIdService = async (id) => {
  const p = await Promotion.findById(id);
  if (!p) throw new Error("Promotion introuvable");
  return p;
};

export const updatePromotionService = async (id, data) => {
  if (data.startDate && data.endDate) {
    data.isActive = computeIsActive(data.startDate, data.endDate);
  }
  return await Promotion.findByIdAndUpdate(id, data, { new: true });
};

export const deletePromotionService = async (id) => {
  const res = await Promotion.findByIdAndDelete(id);
  if (!res) throw new Error("Promotion introuvable");
  return true;
};

// ---------------- SEARCH ----------------
export const searchPromotionsService = async (filters) => {
  const {
    name, category, isActive, minDiscount, maxDiscount, minPurchase,
    sortBy = "createdAt", order = "desc", page = 1, limit = 10
  } = filters;

  const query = {};

  if (name) query.name = { $regex: name, $options: "i" };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (minDiscount || maxDiscount) {
    query.discountValue = {};
    if (minDiscount) query.discountValue.$gte = Number(minDiscount);
    if (maxDiscount) query.discountValue.$lte = Number(maxDiscount);
  }

  if (minPurchase) query.minPurchase = { $lte: Number(minPurchase) };

  const skip = (page - 1) * limit;

  const promotions = await Promotion.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Promotion.countDocuments(query);
  return { total, page, limit, results: promotions };
};

// ----------- EMAIL PROMOTION -----------
export const sendPromotionsByEmailService = async (email, promotionId = null) => {
  let promotions;

  if (promotionId) {
    promotions = await Promotion.find({ _id: promotionId, isActive: true });
  } else {
    promotions = await Promotion.find({ isActive: true });
  }

  if (promotions.length === 0) {
    throw new Error("Aucune promotion active trouvée.");
  }

  let html = `<h2>Nos Promotions Actuelles</h2><ul>`;

  promotions.forEach(p => {
    const start = new Date(p.startDate).toLocaleDateString('fr-FR');
    const end = new Date(p.endDate).toLocaleDateString('fr-FR');
    const type = p.discountType === "percentage" ? "%" : "DT";

    html += `<li>
      <strong>${p.name}</strong> → ${p.discountValue}${type} de réduction<br>
      Du ${start} au ${end} • Min: ${p.minPurchase} DT
    </li><br>`;
  });
  html += `</ul><p>À très vite !</p>`;

  const result = await sendEmail(email, "Vos promotions exclusives", html);

  if (result.error) throw new Error("Échec envoi email");

  return { sent: true, count: promotions.length };
};