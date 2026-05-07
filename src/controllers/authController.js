const jwt = require("jsonwebtoken");

module.exports = {
  async loginAdmin(req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: "username dan password wajib diisi"
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.ADMIN_JWT_SECRET;
    const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || "8h";
    const missingEnv = [];

    if (!adminUsername) missingEnv.push("ADMIN_USERNAME");
    if (!adminPassword) missingEnv.push("ADMIN_PASSWORD");
    if (!jwtSecret) missingEnv.push("ADMIN_JWT_SECRET");

    if (missingEnv.length > 0) {
      return res.status(500).json({
        error: "Konfigurasi auth admin belum lengkap di environment",
        missing_env: missingEnv,
        hint: "Tambahkan variabel yang hilang ke file .env backend PawFind-API, lalu restart server"
      });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({
        error: "Username atau password admin tidak valid"
      });
    }

    const token = jwt.sign(
      {
        role: "admin",
        username: adminUsername
      },
      jwtSecret,
      { expiresIn }
    );

    return res.status(200).json({
      message: "Login admin berhasil",
      data: {
        token,
        token_type: "Bearer",
        expires_in: expiresIn,
        api_key: process.env.ADMIN_API_KEY || null
      }
    });
  }
};
