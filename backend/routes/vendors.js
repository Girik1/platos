const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET / - List all active vendors
router.get('/', (req, res) => {
  try {
    const vendors = db.prepare(`
      SELECT v.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM menu_items WHERE vendor_id = v.id AND is_available = 1) as item_count,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE vendor_id = v.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id) as review_count
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.is_active = 1
    `).all();
    res.json({ vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /my/current - Get vendor profile for logged in vendor
router.get('/my/current', authenticate, (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor profile not found.' });
    res.json({ vendor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - Vendor detail with categories & menu
router.get('/:id', (req, res) => {
  try {
    const vendor = db.prepare(`
      SELECT v.*, u.name as owner_name,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE vendor_id = v.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id) as review_count
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    const categories = db.prepare('SELECT * FROM categories WHERE vendor_id = ? ORDER BY sort_order').all(vendor.id);

    const menuItems = db.prepare(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.vendor_id = ?
      ORDER BY c.sort_order, mi.name
    `).all(vendor.id);

    // Attach addons to each menu item
    const getAddons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?');
    const menuWithAddons = menuItems.map(item => ({
      ...item,
      addons: getAddons.all(item.id)
    }));

    // Group by category
    const menu = categories.map(cat => ({
      ...cat,
      items: menuWithAddons.filter(item => item.category_id === cat.id)
    }));

    // Add uncategorized items
    const uncategorized = menuWithAddons.filter(item => !item.category_id);
    if (uncategorized.length > 0) {
      menu.push({ id: null, name: 'Other', sort_order: 999, items: uncategorized });
    }

    res.json({ vendor, menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - Create vendor (admin only)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { user_id, name, description, logo, cuisine_type, opening_time, closing_time } = req.body;
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name are required.' });
    }

    const result = db.prepare(
      'INSERT INTO vendors (user_id, name, description, logo, cuisine_type, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(user_id, name, description || null, logo || null, cuisine_type || null, opening_time || '08:00', closing_time || '22:00');

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ vendor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - Update vendor (vendor owner only)
router.put('/:id', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }
    if (req.user.role === 'vendor' && vendor.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this vendor.' });
    }

    const { name, description, logo, cuisine_type, is_active, opening_time, closing_time } = req.body;
    db.prepare(`
      UPDATE vendors SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        logo = COALESCE(?, logo),
        cuisine_type = COALESCE(?, cuisine_type),
        is_active = COALESCE(?, is_active),
        opening_time = COALESCE(?, opening_time),
        closing_time = COALESCE(?, closing_time)
      WHERE id = ?
    `).run(name || null, description || null, logo || null, cuisine_type || null,
      is_active !== undefined ? is_active : null, opening_time || null, closing_time || null, req.params.id);

    const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    res.json({ vendor: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
