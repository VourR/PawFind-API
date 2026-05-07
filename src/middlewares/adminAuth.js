const jwt = require("jsonwebtoken");

module.exports = function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const apiKey = req.headers["x-api-key"];
  const configuredApiKey = process.env.ADMIN_API_KEY;
  const jwtSecret = process.env.ADMIN_JWT_SECRET;

  if (authHeader.startsWith("Bearer ")) {
    if (!jwtSecret) {
      return res.status(500).json({
        error: "ADMIN_JWT_SECRET belum dikonfigurasi"
      });
    }

    const token = authHeader.slice(7).trim();

    try {
      const payload = jwt.verify(token, jwtSecret);
      if (payload.role !== "admin") {
        return res.status(403).json({
          error: "Akses ditolak. Role tidak valid"
        });
      }

      req.admin = payload;
      return next();
    } catch (error) {
      return res.status(401).json({
        error: "Token admin tidak valid atau sudah kedaluwarsa"
      });
    }
  }

  if (configuredApiKey && apiKey && apiKey === configuredApiKey) {
    req.admin = { role: "admin", auth_mode: "api_key" };
    return next();
  }

  return res.status(401).json({
    error: "Akses admin membutuhkan Bearer token atau x-api-key yang valid"
  });
};
