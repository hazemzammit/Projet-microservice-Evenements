// seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Promotion from "./models/promotion.model.js";
import Coupon from "./models/coupon.model.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URL);
console.log("MongoDB connecté");

await Promotion.deleteMany({});
await Coupon.deleteMany({});
console.log("Base nettoyée");

const promos = await Promotion.insertMany([
  {
    name: "RAMADAN 40%",
    discountType: "percentage",
    discountValue: 40,
    category: "ramadan",
    startDate: "2025-03-01",
    endDate: "2025-04-10",
    priority: 100,
    stackable: false,
    minPurchase: 100,
  },
  {
    name: "BLACK FRIDAY -70 DT",
    discountType: "fixed",
    discountValue: 70,
    category: "black_friday",
    startDate: "2025-11-20",
    endDate: "2025-11-30",
    priority: 99,
    stackable: false,
    minPurchase: 250,
  },
  {
    name: "NOËL 30%",
    discountType: "percentage",
    discountValue: 30,
    category: "noel",
    startDate: "2025-12-01",
    endDate: "2025-12-31",
    priority: 95,
    stackable: false,
    minPurchase: 150,
  },
  {
    name: "Fidélité 15%",
    discountType: "percentage",
    discountValue: 15,
    category: "normal",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    priority: 60,
    stackable: true,
    minPurchase: 0,
  },
  {
    name: "Bienvenue 20%",
    discountType: "percentage",
    discountValue: 20,
    category: "normal",
    startDate: "2025-01-01",
    endDate: "2026-12-31",
    priority: 70,
    stackable: true,
    minPurchase: 0,
  },
  {
    name: "Flash Décembre -50 DT",
    discountType: "fixed",
    discountValue: 50,
    category: "flash",
    startDate: "2025-12-01",
    endDate: "2025-12-10",
    priority: 90,
    stackable: false,
    minPurchase: 200,
  }
]);

await Coupon.insertMany([
  { code: "RAMADAN40", promotion: promos[0]._id, maxUsage: 9999 },
  { code: "BLACK70", promotion: promos[1]._id, maxUsage: 9999 },
  { code: "NOEL30", promotion: promos[2]._id, maxUsage: 9999 },
  { code: "STACK15", promotion: promos[3]._id, maxUsage: 9999 },
  { code: "BIENVENUE20", promotion: promos[4]._id, maxUsage: 9999 },
  { code: "FLASH50", promotion: promos[5]._id, maxUsage: 9999 },
]);

console.log("Seed terminé !");
process.exit();
