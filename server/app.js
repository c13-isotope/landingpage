// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

/** ---------------- CORS setup ---------------- **/

// Normalize an origin string -> protocol + host (no trailing slash, lowercased)
function normalizeOrigin(s) {
  if (!s) return "";
  try {
    const u = new URL(s.trim());
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    // not a full URL? try to coerce (e.g. "localhost:5173")
    const t = s.trim().replace(/\/+$/, "");
    if (t.startsWith("http://") || t.startsWith("https://")) return t.toLowerCase();
    return `http://${t}`.toLowerCase();
  }
}

// Build allow list from env
const raw = (process.env.CLIENT_ORIGIN || "http://localhost:5173").trim();
const allowAll = raw === "*";
const allowList = allowAll
  ? []
  : raw
      .split(",")
      .map((s) => normalizeOrigin(s))
      .filter(Boolean);

// Helpful log
console.log(
  "CORS allowed origins:",
  allowAll ? "*" : allowList.join(", ") || "(none)"
);

const corsOrigin = (origin, cb) => {
  // Allow no-origin requests (curl, same-host, server-to-server)
  if (!origin) return cb(null, true);

  const normalized = normalizeOrigin(origin);
  const allowed =
    allowAll ||
    allowList.includes(normalized) ||
    // accept explicit localhost devs commonly used
    allowList.includes("http://localhost:5173") && normalized === "http://localhost:5173";

  if (allowed) return cb(null, true);

  console.error(`CORS BLOCKED → incoming="${origin}" normalized="${normalized}"`);
  return cb(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);

// End preflights after CORS headers set
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/** -------------- Sanity logs / middlewares -------------- **/
["MONGO_URI", "ADMIN_KEY"].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or hosting config.`);
  }
});

app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

/** ---------------- Routes ---------------- **/
const messageRoute = require("./routes/messageRoute");
const blogRoute = require("./routes/blogRoute");
app.use("/api/message", messageRoute);
app.use("/api/blog", blogRoute);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

app.get("/", (_req, res) => {
  res.send("✅ NextGen CMC API is live with MongoDB!");
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "route not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
