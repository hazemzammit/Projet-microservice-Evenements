// services/log.service.js
import fs from "fs";
import path from "path";

// Définir dossier logs
const LOG_DIR = path.resolve("logs");

// Si le dossier n'existe pas → le créer
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

/**
 * Écrit un log dans un fichier journalier
 * @param {String} type - "coupon_validate", "coupon_use", "fraud", "scheduler", etc.
 * @param {String} message - texte descriptif
 * @param {Object} data - données additionnelles (optionnel)
 */
export async function writeLog(type, message, data = {}) {
  const logLine = JSON.stringify({
    timestamp: new Date().toISOString(),
    type,
    message,
    data
  }) + "\n";

  const filename = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);

  try {
    await fs.promises.appendFile(filename, logLine);
  } catch (err) {
    console.error("Erreur lors de l'écriture du log:", err.message);
  }
}
