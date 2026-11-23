const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /dashboard - Stats
router.get('/dashboard', authenticate, authorize('admin'), (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = ?').get('paid').total;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalVendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
    const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')").get().count;
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE DATE(created_at) = DATE('now') AND payment_status = 'paid'").get().total;

    res.json({
      stats: { totalOrders, totalRevenue, totalUsers, totalVendors, todayOrders, todayRevenue }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users - List all users
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, phone, role, company, wallet_balance, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /orders - All orders with filters
router.get('/orders', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status, vendor_id, date_from, date_to } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params = [];

    if (status) { where += ' AND o.status = ?'; params.push(status); }
    if (vendor_id) { where += ' AND o.vendor_id = ?'; params.push(vendor_id); }
    if (date_from) { where += ' AND DATE(o.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(o.created_at) <= ?'; params.push(date_to); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE ${where}`).get(...params).count;
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, v.name as vendor_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      WHERE ${where}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics - Revenue charts data
router.get('/analytics', authenticate, authorize('admin'), (req, res) => {
  try {
    const period = req.query.period || 'daily';

    let groupBy, dateFormat;
    if (period === 'weekly') {
      groupBy = "strftime('%Y-%W', created_at)";
      dateFormat = 'week';
    } else if (period === 'monthly') {
      groupBy = "strftime('%Y-%m', created_at)";
      dateFormat = 'month';
    } else {
      groupBy = "DATE(created_at)";
      dateFormat = 'day';
    }

    const revenue = db.prepare(`
      SELECT ${groupBy} as period, SUM(total_amount) as revenue, COUNT(*) as order_count
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 30
    `).all();

    const topItems = db.prepare(`
      SELECT item_name, SUM(quantity) as total_qty, SUM(item_price * quantity) as total_revenue
      FROM order_items
      GROUP BY item_name
      ORDER BY total_qty DESC
      LIMIT 10
    `).all();

    const vendorRevenue = db.prepare(`
      SELECT v.name, SUM(o.total_amount) as revenue, COUNT(o.id) as order_count
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.payment_status = 'paid'
      GROUP BY o.vendor_id
      ORDER BY revenue DESC
    `).all();

    res.json({ revenue: revenue.reverse(), topItems, vendorRevenue, period: dateFormat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /subsidy - Create/update subsidy rules
router.post('/subsidy', authenticate, authorize('admin'), (req, res) => {
  try {
    const { id, company, meal_type, amount, is_active } = req.body;
    if (!company || !meal_type || amount === undefined) {
      return res.status(400).json({ error: 'company, meal_type, and amount are required.' });
    }

    if (id) {
      db.prepare('UPDATE subsidies SET company = ?, meal_type = ?, amount = ?, is_active = ? WHERE id = ?')
        .run(company, meal_type, amount, is_active !== undefined ? is_active : 1, id);
      const subsidy = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(id);
      return res.json({ subsidy });
    }

    const result = db.prepare('INSERT INTO subsidies (company, meal_type, amount, is_active) VALUES (?, ?, ?, ?)')
      .run(company, meal_type, amount, is_active !== undefined ? is_active : 1);
    const subsidy = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ subsidy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /subsidies - List subsidies
router.get('/subsidies', authenticate, authorize('admin'), (req, res) => {
  try {
    const subsidies = db.prepare('SELECT * FROM subsidies ORDER BY company, meal_type').all();
    res.json({ subsidies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
