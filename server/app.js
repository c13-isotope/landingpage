// server/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// 1) Load env first, then connect DB
dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

/* ---------------------------- CORS setup ----------------------------- */
/**
 * Normalize an origin string:
 * - remove zero-width characters
 * - trim, lowercase
 * - coerce to protocol//host (no trailing slash)
 */
function normalizeOrigin(s) {
  if (!s) return "";
  const cleaned = s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

  try {
    const u = new URL(cleaned);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    // Not a full URL? Try to coerce (e.g. "localhost:5173")
    const t = cleaned.replace(/\/+$/, "");
    if (t.startsWith("http://") || t.startsWith("https://")) {
      try {
        const u2 = new URL(t);
        return `${u2.protocol}//${u2.host}`.toLowerCase();
      } catch {
        return t.toLowerCase();
      }
    }
    // assume http
    return `http://${t}`.toLowerCase();
  }
}

// Read and normalize allow-list from env
const rawEnv = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowAll = rawEnv.trim() === "*";

const allowListRaw = allowAll
  ? []
  : rawEnv
      .split(",")
      .map(s => s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim())
      .filter(Boolean);

const allowList = allowListRaw.map(normalizeOrigin);

// Helpful diagnostics at boot
console.log("CORS allowListRaw       =", JSON.stringify(allowListRaw));
console.log("CORS allowListNormalized =", JSON.stringify(allowList));

const corsOrigin = (origin, cb) => {
  // Allow server-to-server / curl / same-host (no Origin header)
  if (!origin) return cb(null, true);

  const incoming = normalizeOrigin(origin);

  // TEMP safety: explicitly allow localhost:5173 if present in env list
  const explicitLocalhostAllowed = allowList.includes("http://localhost:5173");

  if (allowAll || allowList.includes(incoming) || (explicitLocalhostAllowed && incoming === "http://localhost:5173")) {
    return cb(null, true);
  }

  console.warn(
    `CORS BLOCKED → incoming="${origin}" normalized="${incoming}" not in ${JSON.stringify(
      allowList
    )}`
  );
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

// End preflight requests after CORS headers are set
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
/* -------------------------------------------------------------------- */

// 2) Sanity logs for env
["MONGO_URI", "ADMIN_KEY"].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or hosting config.`);
  }
});

// 3) Body parser + basic rate limit
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests / min / IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// 4) Routes
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

// 5) Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
