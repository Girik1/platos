require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, isDatabaseEmpty, db } = require('./config/database');
const { runSeed } = require('./seeds/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins (any port), and no-origin requests (mobile apps, curl, etc.)
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Create uploads directory ──
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Initialize DB & Seed ──
initializeDatabase();
try {
  const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
  if (orgCount === 0) {
    console.log('📦 Seeding Enterprise SaaS models...');
    runSeed(db);
  }
} catch (e) {
  if (isDatabaseEmpty()) {
    console.log('📦 Database is empty. Running seed...');
    runSeed(db);
  }
}

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/cafeterias', require('./routes/cafeterias'));
app.use('/api/kitchen', require('./routes/kitchen'));
app.use('/api/finance', require('./routes/finance'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handling ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`🚀 Platos API server running on http://localhost:${PORT}`);
});
