const express = require('express');
const { db } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET / - Get user's cart
router.get('/', authenticate, (req, res) => {
  try {
    let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      const result = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(result.lastInsertRowid);
    }

    const items = db.prepare(`
      SELECT ci.*, mi.name, mi.price, mi.image, mi.is_veg, mi.vendor_id,
        v.name as vendor_name
      FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      JOIN vendors v ON mi.vendor_id = v.id
      WHERE ci.cart_id = ?
    `).all(cart.id);

    const getCartItemAddons = db.prepare(`
      SELECT cia.id as cart_item_addon_id, a.id as addon_id, a.name, a.price
      FROM cart_item_addons cia
      JOIN addons a ON cia.addon_id = a.id
      WHERE cia.cart_item_id = ?
    `);

    let total = 0;
    const cartItems = items.map(item => {
      const addons = getCartItemAddons.all(item.id);
      const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
      const itemTotal = (item.price + addonTotal) * item.quantity;
      total += itemTotal;
      return { ...item, addons, item_total: itemTotal };
    });

    res.json({ cart: { id: cart.id, items: cartItems, total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /add - Add item to cart
router.post('/add', authenticate, (req, res) => {
  try {
    const { item_id, quantity, addon_ids, special_instructions } = req.body;
    if (!item_id) return res.status(400).json({ error: 'item_id is required.' });

    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ? AND is_available = 1').get(item_id);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found or unavailable.' });

    let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      const result = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(result.lastInsertRowid);
    }

    // Check if adding items from a different vendor
    const existingItems = db.prepare(`
      SELECT mi.vendor_id FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      WHERE ci.cart_id = ?
    `).all(cart.id);

    if (existingItems.length > 0 && existingItems[0].vendor_id !== menuItem.vendor_id) {
      return res.status(400).json({ error: 'Cannot add items from different vendors. Clear cart first.' });
    }

    const result = db.prepare(
      'INSERT INTO cart_items (cart_id, menu_item_id, quantity, special_instructions) VALUES (?, ?, ?, ?)'
    ).run(cart.id, item_id, quantity || 1, special_instructions || null);

    const cartItemId = result.lastInsertRowid;

    if (addon_ids && Array.isArray(addon_ids)) {
      const insertAddon = db.prepare('INSERT INTO cart_item_addons (cart_item_id, addon_id) VALUES (?, ?)');
      for (const addonId of addon_ids) {
        insertAddon.run(cartItemId, addonId);
      }
    }

    const cartItem = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(cartItemId);
    res.status(201).json({ cartItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /item/:id - Update cart item quantity
router.put('/item/:id', authenticate, (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity is required.' });

    const cartItem = db.prepare(`
      SELECT ci.* FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!cartItem) return res.status(404).json({ error: 'Cart item not found.' });

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
    const updated = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.id);
    res.json({ cartItem: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /item/:id - Remove from cart
router.delete('/item/:id', authenticate, (req, res) => {
  try {
    const cartItem = db.prepare(`
      SELECT ci.* FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!cartItem) return res.status(404).json({ error: 'Cart item not found.' });

    db.prepare('DELETE FROM cart_item_addons WHERE cart_item_id = ?').run(req.params.id);
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /clear - Clear cart
router.delete('/clear', authenticate, (req, res) => {
  try {
    const cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
    if (cart) {
      const cartItems = db.prepare('SELECT id FROM cart_items WHERE cart_id = ?').all(cart.id);
      for (const ci of cartItems) {
        db.prepare('DELETE FROM cart_item_addons WHERE cart_item_id = ?').run(ci.id);
      }
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    }
    res.json({ message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
