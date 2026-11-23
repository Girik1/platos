const express = require('express');
const QRCode = require('qrcode');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function generateOrderNumber() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `PLTS-${num}`;
}

function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// POST / - Place order from cart or directly with items
router.post('/', authenticate, async (req, res) => {
  try {
    const { payment_method, special_instructions, items: clientItems } = req.body;

    let orderItemsData = [];
    let vendorId = null;
    let totalAmount = 0;
    let cart = null;

    if (clientItems && Array.isArray(clientItems) && clientItems.length > 0) {
      for (const ci of clientItems) {
        const itemId = ci.id || ci.menu_item_id;
        const mi = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
        if (!mi) continue;
        if (!vendorId) vendorId = mi.vendor_id;

        const addons = ci.addons || [];
        const addonTotal = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        const itemQty = Number(ci.quantity) || 1;
        const itemTotal = (mi.price + addonTotal) * itemQty;
        totalAmount += itemTotal;

        orderItemsData.push({
          menu_item_id: mi.id,
          item_name: mi.name,
          item_price: mi.price,
          quantity: itemQty,
          addons_json: JSON.stringify(addons)
        });
      }
    } else {
      cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
      if (!cart) return res.status(400).json({ error: 'Cart is empty.' });

      const cartItems = db.prepare(`
        SELECT ci.*, mi.price, mi.name as item_name, mi.vendor_id
        FROM cart_items ci
        JOIN menu_items mi ON ci.menu_item_id = mi.id
        WHERE ci.cart_id = ?
      `).all(cart.id);

      if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty.' });

      vendorId = cartItems[0].vendor_id;
      const getCartItemAddons = db.prepare(`
        SELECT a.id, a.name, a.price FROM cart_item_addons cia
        JOIN addons a ON cia.addon_id = a.id
        WHERE cia.cart_item_id = ?
      `);

      orderItemsData = cartItems.map(ci => {
        const addons = getCartItemAddons.all(ci.id);
        const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
        const itemTotal = (ci.price + addonTotal) * ci.quantity;
        totalAmount += itemTotal;
        return {
          menu_item_id: ci.menu_item_id,
          item_name: ci.item_name,
          item_price: ci.price,
          quantity: ci.quantity,
          addons_json: JSON.stringify(addons)
        };
      });
    }

    if (orderItemsData.length === 0) {
      return res.status(400).json({ error: 'No valid items in order.' });
    }

    // Check subsidy
    let subsidyAmount = 0;
    if (req.user.company) {
      const hour = new Date().getHours();
      let mealType = 'snack';
      if (hour >= 7 && hour < 11) mealType = 'breakfast';
      else if (hour >= 11 && hour < 15) mealType = 'lunch';
      else if (hour >= 17 && hour < 21) mealType = 'dinner';

      const subsidy = db.prepare(
        'SELECT * FROM subsidies WHERE company = ? AND meal_type = ? AND is_active = 1'
      ).get(req.user.company, mealType);

      if (subsidy) {
        subsidyAmount = Math.min(subsidy.amount, totalAmount);
      }
    }

    let orderNumber = generateOrderNumber();
    // Ensure unique order number
    while (db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    const otp = generateOTP();
    const qrData = JSON.stringify({ orderNumber, otp });
    const qrCode = await QRCode.toDataURL(qrData);

    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, vendor_id, order_number, total_amount, subsidy_amount, payment_method, pickup_otp, qr_code, special_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, vendorId, orderNumber, totalAmount, subsidyAmount,
      payment_method || 'wallet', otp, qrCode, special_instructions || null);

    const orderId = orderResult.lastInsertRowid;
    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity, addons_json) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const oi of orderItemsData) {
      insertOrderItem.run(orderId, oi.menu_item_id, oi.item_name, oi.item_price, oi.quantity, oi.addons_json);
    }

    // Clear cart if exists
    if (cart) {
      const dbCartItems = db.prepare('SELECT id FROM cart_items WHERE cart_id = ?').all(cart.id);
      for (const ci of dbCartItems) {
        db.prepare('DELETE FROM cart_item_addons WHERE cart_item_id = ?').run(ci.id);
      }
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({ order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / - List user's orders (with pagination)
router.get('/', authenticate, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id).count;
    const orders = db.prepare(`
      SELECT o.*, v.name as vendor_name, v.logo as vendor_logo
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(o => ({ ...o, items: getItems.all(o.id) }));

    res.json({ orders: ordersWithItems, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendor/live - Get vendor's live orders (must be before /:id)
router.get('/vendor/live', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = ? AND o.status IN ('placed', 'accepted', 'preparing', 'ready')
      ORDER BY o.created_at ASC
    `).all(vendor.id);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(o => ({ ...o, items: getItems.all(o.id) }));

    res.json({ orders: ordersWithItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vendor/history - Get vendor's order history
router.get('/vendor/history', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const vendor = db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(req.user.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const total = db.prepare("SELECT COUNT(*) as count FROM orders WHERE vendor_id = ? AND status IN ('picked_up', 'cancelled')").get(vendor.id).count;
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = ? AND o.status IN ('picked_up', 'cancelled')
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(vendor.id, limit, offset);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(o => ({ ...o, items: getItems.all(o.id) }));

    res.json({ orders: ordersWithItems, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /subsidy-quote - Get current meal subsidy quote for user
router.get('/subsidy-quote', authenticate, (req, res) => {
  try {
    if (!req.user.company) {
      return res.json({ eligible: false, amount: 0, mealType: null, company: null });
    }
    const hour = new Date().getHours();
    let mealType = 'snack';
    if (hour >= 7 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 16) mealType = 'lunch';
    else if (hour >= 16 && hour < 19) mealType = 'snack';
    else if (hour >= 19 && hour < 23) mealType = 'dinner';

    let subsidy = db.prepare(
      'SELECT * FROM subsidies WHERE company = ? AND meal_type = ? AND is_active = 1'
    ).get(req.user.company, mealType);

    if (!subsidy) {
      subsidy = db.prepare(
        'SELECT * FROM subsidies WHERE company = ? AND is_active = 1 LIMIT 1'
      ).get(req.user.company);
    }

    if (subsidy) {
      return res.json({
        eligible: true,
        company: req.user.company,
        mealType: subsidy.meal_type,
        amount: Number(subsidy.amount) || 0
      });
    }

    res.json({ eligible: false, amount: 0, mealType, company: req.user.company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - Order detail
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, v.name as vendor_name, v.logo as vendor_logo
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.id = ? AND (o.user_id = ? OR ? IN (SELECT user_id FROM vendors WHERE id = o.vendor_id) OR ? = 'admin')
    `).get(req.params.id, req.user.id, req.user.id, req.user.role);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/status - Update order status (vendor)
router.patch('/:id/status', authenticate, authorize('vendor', 'admin'), (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT * FROM vendors WHERE id = ? AND user_id = ?').get(order.vendor_id, req.user.id);
      if (!vendor) return res.status(403).json({ error: 'Not authorized.' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/verify - Verify pickup OTP
router.post('/:id/verify', authenticate, (req, res) => {
  try {
    const { otp } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.pickup_otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    db.prepare("UPDATE orders SET status = 'picked_up', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ order: updated, message: 'Order verified and picked up!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/reorder - Reorder (add items back to cart)
router.post('/:id/reorder', authenticate, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      const result = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(result.lastInsertRowid);
    }

    // Clear existing cart
    const existingItems = db.prepare('SELECT id FROM cart_items WHERE cart_id = ?').all(cart.id);
    for (const ci of existingItems) {
      db.prepare('DELETE FROM cart_item_addons WHERE cart_item_id = ?').run(ci.id);
    }
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

    // Add order items to cart
    for (const oi of orderItems) {
      if (oi.menu_item_id) {
        const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ? AND is_available = 1').get(oi.menu_item_id);
        if (menuItem) {
          const result = db.prepare('INSERT INTO cart_items (cart_id, menu_item_id, quantity) VALUES (?, ?, ?)').run(cart.id, oi.menu_item_id, oi.quantity);

          // Re-add addons
          if (oi.addons_json) {
            try {
              const addons = JSON.parse(oi.addons_json);
              const insertAddon = db.prepare('INSERT INTO cart_item_addons (cart_item_id, addon_id) VALUES (?, ?)');
              for (const addon of addons) {
                insertAddon.run(result.lastInsertRowid, addon.id);
              }
            } catch (_) {}
          }
        }
      }
    }

    res.json({ message: 'Items added to cart from previous order.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
