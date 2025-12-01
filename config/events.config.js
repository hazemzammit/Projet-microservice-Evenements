export const EVENTS_CONFIG = {
  ramadan: {
    name: "Promo Ramadan",
    description: "Offre spéciale Ramadan",
    discountType: "percentage",
    discountValue: 20,
    category: "ramadan",
    startDate: new Date("2025-02-28"),
    endDate: new Date("2025-04-05"),
  },

  blackfriday: {
    name: "Black Friday",
    description: "Offre exceptionnelle Black Friday",
    discountType: "percentage",
    discountValue: 40,
    category: "blackfriday",
    startDate: new Date("2025-11-28"),
    endDate: new Date("2025-11-30"),
  },

  cybermonday: {
    name: "Cyber Monday",
    description: "Promotion Cyber Monday",
    discountType: "percentage",
    discountValue: 35,
    category: "cybermonday",
    startDate: new Date("2025-12-01"),
    endDate: new Date("2025-12-01"),
  },

  findeannee: {
    name: "Fin d'année",
    description: "Offre de fin d'année",
    discountType: "percentage",
    discountValue: 30,
    category: "findannee",
    startDate: new Date("2025-12-15"),
    endDate: new Date("2026-01-02"),
  }
};
