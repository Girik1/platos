const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/cafeterias - Public & employee cafeteria discovery
router.get('/', (req, res) => {
  try {
    const cafeterias = db.prepare(`
      SELECT c.*, o.name as org_name,
        (SELECT COUNT(*) FROM vendors v WHERE v.cafeteria_id = c.id AND v.is_active = 1) as active_counters,
        (SELECT COUNT(*) FROM orders o WHERE o.cafeteria_id = c.id AND o.status IN ('placed', 'accepted', 'preparing')) as current_queue_load
      FROM cafeterias c
      LEFT JOIN organizations o ON c.org_id = o.id
      WHERE c.is_active = 1
      ORDER BY c.name ASC
    `).all();

    res.json({ cafeterias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cafeterias/:id - Single cafeteria with food counters
router.get('/:id', (req, res) => {
  try {
    const cafeteria = db.prepare(`
      SELECT c.*, o.name as org_name
      FROM cafeterias c
      LEFT JOIN organizations o ON c.org_id = o.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!cafeteria) return res.status(404).json({ error: 'Cafeteria not found.' });

    const counters = db.prepare(`
      SELECT v.*,
        (SELECT COUNT(*) FROM menu_items mi WHERE mi.vendor_id = v.id AND mi.is_available = 1) as live_items_count
      FROM vendors v
      WHERE v.cafeteria_id = ? AND v.is_active = 1
    `).all(req.params.id);

    res.json({ cafeteria, counters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cafeterias/:id - Update cafeteria
router.put('/:id', authenticate, authorize('admin', 'org_admin', 'super_admin'), (req, res) => {
  try {
    const { name, location_building, floor, capacity, is_active, opening_time, closing_time } = req.body;
    db.prepare(`
      UPDATE cafeterias
      SET name = COALESCE(?, name),
          location_building = COALESCE(?, location_building),
          floor = COALESCE(?, floor),
          capacity = COALESCE(?, capacity),
          is_active = COALESCE(?, is_active),
          opening_time = COALESCE(?, opening_time),
          closing_time = COALESCE(?, closing_time)
      WHERE id = ?
    `).run(name, location_building, floor, capacity, is_active, opening_time, closing_time, req.params.id);

    const updated = db.prepare('SELECT * FROM cafeterias WHERE id = ?').get(req.params.id);
    res.json({ cafeteria: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
