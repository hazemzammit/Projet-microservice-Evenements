// service_reservation/middleware/auth.js
module.exports = (req, res, next) => {
  // Middleware basique - utilise les headers ou des valeurs par défaut
  req.user = {
    id: req.headers['x-user-id'] || req.headers.userid || "666666666666666666666666",
    role: req.headers['x-user-role'] || req.headers.userrole || "user"
  };
  next();
};