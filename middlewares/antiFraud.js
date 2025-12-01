// simple in-memory anti-fraud per IP for /validate endpoint
const attempts = {};

export default function antiFraudMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!attempts[ip]) attempts[ip] = { count: 0, last: now };

  // reset if older than 10 minutes
  if (now - attempts[ip].last > 10 * 60 * 1000) attempts[ip].count = 0;

  attempts[ip].count += 1;
  attempts[ip].last = now;

  // allow a reasonable amount (e.g. 10 validations in 10 minutes)
  if (attempts[ip].count > 10) {
    return res.status(429).json({ error: "Trop de tentatives de validation. IP temporairement bloquée." });
  }

  next();
}
