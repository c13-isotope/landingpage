// server/middleware/isAdminKey.js
module.exports = function isAdminKey(req, res, next) {
    const key = req.header("x-admin-key");
    if (!process.env.ADMIN_KEY) {
      return res.status(500).json({ error: "ADMIN_KEY not set on server" });
    }
    if (!key || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: "unauthorized (admin key missing/invalid)" });
    }
    next();
  };
  