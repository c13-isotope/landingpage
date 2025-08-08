// server/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// 1) Load env and connect DB
dotenv.config();
connectDB();

// 2) Create app
const app = express();

// 3) CORS (supports one or multiple origins via comma-separated env)
const rawOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const origins = rawOrigin === '*'
  ? true
  : rawOrigin.split(',').map(s => s.trim());

app.use(cors({
  origin: origins, // e.g. "http://localhost:5173,https://your-frontend.vercel.app"
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-admin-key'],
}));

// Quick env sanity check (optional)
['MONGO_URI','ADMIN_KEY'].forEach((k) => {
  if (!process.env[k]) {
    console.warn(`⚠️  Missing ${k} in environment. Set it in .env or platform vars.`);
  }
});

// 4) Parsers & basic rate limit
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 5) Routes
const messageRoute = require('./routes/messageRoute');
const blogRoute = require('./routes/blogRoute');

app.use('/api/message', messageRoute);
app.use('/api/blog', blogRoute);

// 6) Root
app.get('/', (req, res) => {
  res.send('✅ NextGen CMC API is live with MongoDB!');
});

// 7) 404
app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

// 8) Error handler
app.use((err, req, res, next) => {
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
