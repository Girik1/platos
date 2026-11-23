const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /vendor/:vendorId - Get menu by vendor (grouped by category)
router.get('/vendor/:vendorId', (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    const categories = db.prepare('SELECT * FROM categories WHERE vendor_id = ? ORDER BY sort_order').all(vendor.id);
    const getItems = db.prepare('SELECT * FROM menu_items WHERE category_id = ? AND vendor_id = ? ORDER BY name');
    const getAddons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?');

    const menu = categories.map(cat => ({
      ...cat,
      items: getItems.all(cat.id, vendor.id).map(item => ({
        ...item,
        addons: getAddons.all(item.id)
      }))
    }));

    res.json({ vendor_id: vendor.id, vendor_name: vendor.name, menu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - Add menu item (vendor only)
router.post('/', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const { vendor_id, category_id, name, description, price, image, is_veg, is_bestseller, prep_time, addons } = req.body;

    // If vendor role, ensure they own this vendor
    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT * FROM vendors WHERE id = ? AND user_id = ?').get(vendor_id, req.user.id);
      if (!vendor) {
        return res.status(403).json({ error: 'Not authorized for this vendor.' });
      }
    }

    const result = db.prepare(
      'INSERT INTO menu_items (vendor_id, category_id, name, description, price, image, is_veg, is_bestseller, prep_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(vendor_id, category_id || null, name, description || null, price, image || null,
      is_veg !== undefined ? is_veg : 1, is_bestseller || 0, prep_time || 15);

    const itemId = result.lastInsertRowid;

    // Add addons if provided
    if (addons && Array.isArray(addons)) {
      const insertAddon = db.prepare('INSERT INTO addons (menu_item_id, name, price) VALUES (?, ?, ?)');
      for (const addon of addons) {
        insertAddon.run(itemId, addon.name, addon.price);
      }
    }

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
    const itemAddons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?').all(itemId);
    res.status(201).json({ item: { ...item, addons: itemAddons } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - Update menu item
router.put('/:id', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT * FROM vendors WHERE id = ? AND user_id = ?').get(item.vendor_id, req.user.id);
      if (!vendor) return res.status(403).json({ error: 'Not authorized.' });
    }

    const { category_id, name, description, price, image, is_veg, is_available, is_bestseller, prep_time } = req.body;
    db.prepare(`
      UPDATE menu_items SET
        category_id = COALESCE(?, category_id),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image = COALESCE(?, image),
        is_veg = COALESCE(?, is_veg),
        is_available = COALESCE(?, is_available),
        is_bestseller = COALESCE(?, is_bestseller),
        prep_time = COALESCE(?, prep_time)
      WHERE id = ?
    `).run(category_id ?? null, name || null, description || null, price ?? null,
      image || null, is_veg ?? null, is_available ?? null, is_bestseller ?? null, prep_time ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    const addons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?').all(req.params.id);
    res.json({ item: { ...updated, addons } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - Delete menu item
router.delete('/:id', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT * FROM vendors WHERE id = ? AND user_id = ?').get(item.vendor_id, req.user.id);
      if (!vendor) return res.status(403).json({ error: 'Not authorized.' });
    }

    db.prepare('DELETE FROM addons WHERE menu_item_id = ?').run(req.params.id);
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Menu item deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/availability - Toggle availability
router.patch('/:id/availability', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });

    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT * FROM vendors WHERE id = ? AND user_id = ?').get(item.vendor_id, req.user.id);
      if (!vendor) return res.status(403).json({ error: 'Not authorized.' });
    }

    const newAvailability = item.is_available ? 0 : 1;
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newAvailability, req.params.id);

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    res.json({ item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /search?q= - Search items across vendors
router.get('/search', (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json({ items: [] });

    const items = db.prepare(`
      SELECT mi.*, v.name as vendor_name, c.name as category_name
      FROM menu_items mi
      JOIN vendors v ON mi.vendor_id = v.id
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = 1 AND v.is_active = 1
        AND (mi.name LIKE ? OR mi.description LIKE ? OR c.name LIKE ?)
      ORDER BY mi.is_bestseller DESC, mi.name
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);

    const getAddons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?');
    const results = items.map(item => ({ ...item, addons: getAddons.all(item.id) }));

    res.json({ items: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /popular - Get bestsellers
router.get('/popular', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT mi.*, v.name as vendor_name, c.name as category_name
      FROM menu_items mi
      JOIN vendors v ON mi.vendor_id = v.id
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = 1 AND v.is_active = 1 AND mi.is_bestseller = 1
      ORDER BY mi.name
    `).all();

    const getAddons = db.prepare('SELECT * FROM addons WHERE menu_item_id = ?');
    const results = items.map(item => ({ ...item, addons: getAddons.all(item.id) }));

    res.json({ items: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
