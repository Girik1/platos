const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /register
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, role, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, phone, password_hash, role, company) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, phone || null, password_hash, role || 'customer', company || null);

    const user = db.prepare('SELECT id, name, email, phone, role, company, avatar, wallet_balance, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /me
router.put('/me', authenticate, (req, res) => {
  try {
    const { name, phone, company, avatar } = req.body;
    db.prepare(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), company = COALESCE(?, company), avatar = COALESCE(?, avatar) WHERE id = ?'
    ).run(name || null, phone || null, company || null, avatar || null, req.user.id);

    const user = db.prepare('SELECT id, name, email, phone, role, company, avatar, wallet_balance, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
