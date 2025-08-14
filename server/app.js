// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// 1) Load env then connect DB
dotenv.config();
connectDB();

const app = express();

// If behind a proxy (Render/Vercel/etc.)
app.set("trust proxy", 1);

/* -------------------------------------------------------------------------- */
/*  2) CORS (robust allow-list)                                               */
/*      - CLIENT_ORIGIN is a comma-separated list of allowed origins          */
/*        e.g. "http://localhost:5173,http://192.168.1.38:5173,https://mysite"
/*      - Set CLIENT_ORIGIN="*" to allow all (NOT recommended for production) */
/* -------------------------------------------------------------------------- */

const rawOriginEnv = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowAll = rawOriginEnv.trim() === "*";

// normalize origins for reliable matching
const normalizeOrigin = (o) =>
  (o || "").toLowerCase().trim().replace(/\/$/, "");

// build normalized allow-set
const allowSet = allowAll
  ? new Set()
  : new Set(
      rawOriginEnv
        .split(",")
        .map((s) => normalizeOrigin(s))
        .filter(Boolean)
    );

console.log(
  "CORS allowlist:",
  allowAll ? "*" : Array.from(allowSet).join(", ") || "(none)"
);

// origin checker used by cors()
const corsOptions = {
  origin(origin, callback) {
    // Same-origin requests or server-to-server calls sometimes have no Origin
    if (!origin) return callback(null, true);

    const norm = normalizeOrigin(origin);
    if (allowAll || allowSet.has(norm)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  credentials: false, // set to true only if you start using cookies/auth headers
  optionsSuccessStatus: 204,
};

// Apply CORS to all requests
app.use(cors(corsOptions));

// Gracefully end preflight requests after CORS headers were added
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* -------------------------------------------------------------------------- */
/*  3) Env sanity (logs only)                                                 */
/* -------------------------------------------------------------------------- */
["MONGO_URI", "ADMIN_KEY"].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or hosting config.`);
  }
});

/* -------------------------------------------------------------------------- */
/*  4) JSON + basic rate limit                                                */
/* -------------------------------------------------------------------------- */
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,             // 60 req/min/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

/* -------------------------------------------------------------------------- */
/*  5) Routes                                                                 */
/* -------------------------------------------------------------------------- */
const messageRoute = require("./routes/messageRoute");
const blogRoute = require("./routes/blogRoute");

app.use("/api/message", messageRoute);
app.use("/api/blog", blogRoute);

// Health check
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// Root
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

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
