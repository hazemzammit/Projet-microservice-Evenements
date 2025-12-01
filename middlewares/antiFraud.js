const fraudAttempts = {}; 
// structure : { "IP_ADDRESS": { attempts: x, lastAttempt: date } }

export default function antiFraudMiddleware(req, res, next) {
  const ip = req.ip;

  const now = Date.now();

  if (!fraudAttempts[ip]) {
    fraudAttempts[ip] = { attempts: 0, lastAttempt: now };
  }

  const timeSinceLast = now - fraudAttempts[ip].lastAttempt;

  // reset après 10 min
  if (timeSinceLast > 10 * 60 * 1000) {
    fraudAttempts[ip].attempts = 0;
  }

  fraudAttempts[ip].attempts++;
  fraudAttempts[ip].lastAttempt = now;

  if (fraudAttempts[ip].attempts > 10) {
    return res.status(429).json({
      error: "Suspicious activity detected. IP temporarily blocked."
    });
  }

  next();
}
