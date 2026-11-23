const express = require('express');
const { db } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST / - Submit review
router.post('/', authenticate, (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    if (!order_id || !rating) {
      return res.status(400).json({ error: 'order_id and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const existing = db.prepare('SELECT * FROM reviews WHERE order_id = ? AND user_id = ?').get(order_id, req.user.id);
    if (existing) return res.status(409).json({ error: 'Review already submitted for this order.' });

    const result = db.prepare(
      'INSERT INTO reviews (user_id, vendor_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, order.vendor_id, order_id, rating, comment || null);

    // Update vendor average rating
    const avgRating = db.prepare('SELECT ROUND(AVG(rating), 1) as avg FROM reviews WHERE vendor_id = ?').get(order.vendor_id).avg;
    db.prepare('UPDATE vendors SET rating = ? WHERE id = ?').run(avgRating, order.vendor_id);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendor/:vendorId - Get vendor reviews
router.get('/vendor/:vendorId', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE vendor_id = ?').get(req.params.vendorId).count;
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.vendor_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.vendorId, limit, offset);

    const avgRating = db.prepare('SELECT ROUND(AVG(rating), 1) as avg FROM reviews WHERE vendor_id = ?').get(req.params.vendorId).avg;

    res.json({ reviews, avgRating, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
