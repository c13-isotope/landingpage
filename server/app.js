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

/**
 * 2) CORS
 * CLIENT_ORIGIN supports comma-separated origins, e.g.:
 *   CLIENT_ORIGIN=http://localhost:5173,http://192.168.1.39:5173
 * To allow all (not recommended in prod), set CLIENT_ORIGIN=*
 */
const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowAll = raw.trim() === "*";
const allowList = allowAll
  ? []
  : raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

console.log(
  "CORS allowed origins:",
  allowAll ? "*" : allowList.join(", ") || "(none)"
);

// dynamic origin checker so multiple origins are accepted
const corsOrigin = (origin, cb) => {
  // allow requests with no Origin (curl, same-host, server-to-server)
  if (!origin) return cb(null, true);
  if (allowAll || allowList.includes(origin)) return cb(null, true);
  return cb(new Error(`CORS blocked for origin: ${origin}`));
};

const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  credentials: false,               // set true only if you start using cookies/auth
  optionsSuccessStatus: 204,
};

// Apply CORS to all requests
app.use(cors(corsOptions));

// Express v5: don’t use app.options('*', ...). Instead, end any preflight after CORS headers are set.
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// 3) Env sanity (logs only)
["MONGO_URI", "ADMIN_KEY"].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or hosting config.`);
  }
});

// 4) JSON + basic rate limit
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,             // 60 req/min/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// 5) Routes
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
