// server/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// 1) Load env + connect to Mongo
dotenv.config();
connectDB();

const app = express();

// Render/Proxies: trust proxy so req.ip / rate-limit work correctly
app.set('trust proxy', 1);

// 2) CORS
// Pass one origin or multiple origins as a comma-separated list in CLIENT_ORIGIN
// e.g. CLIENT_ORIGIN="http://localhost:5173,https://your-app.vercel.app,https://nextgencmc.org"
const rawOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const origins = rawOrigin === '*'
  ? true                                  // allow all (not recommended in prod)
  : rawOrigin.split(',').map(s => s.trim());

app.use(
  cors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    credentials: false, // flip to true later if you start sending cookies/auth headers
  })
);

// 3) Quick env sanity check (logs only)
['MONGO_URI', 'ADMIN_KEY'].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or in your hosting platform.`);
  }
});

// 4) Body parser + basic rate limit
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests / min / IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 5) Routes
const messageRoute = require('./routes/messageRoute');
const blogRoute = require('./routes/blogRoute');

app.use('/api/message', messageRoute);
app.use('/api/blog', blogRoute);

// Health check (useful for uptime pings)
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// 6) Root
app.get('/', (_req, res) => {
  res.send('✅ NextGen CMC API is live with MongoDB!');
});

// 7) 404
app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

// 8) Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'internal server error' : err.message,
  });
});

// 9) Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
