// services/log.service.js
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

export const writeLog = async (type, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    message,
    ...data
  };

  const logFile = path.join(LOG_DIR, `${new Date().toISOString().split("T")[0]}.log`);
  const logLine = JSON.stringify(logEntry) + "\n";

  try {
    fs.appendFileSync(logFile, logLine);
  } catch (err) {
    console.error("Erreur écriture log:", err);
  }
};