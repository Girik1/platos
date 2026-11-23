const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const kitchenAccess = authorize('kitchen_staff', 'vendor', 'admin', 'super_admin');

// GET /api/kitchen/orders/live - High-speed real-time KDS queue
router.get('/orders/live', authenticate, kitchenAccess, (req, res) => {
  try {
    // If user is vendor, filter by vendor_id; otherwise show live kitchen orders
    let vendorId = null;
    if (req.user.role === 'vendor' || req.user.role === 'kitchen_staff') {
      const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ? OR id = 1 LIMIT 1').get(req.user.id);
      vendorId = vendor ? vendor.id : 1;
    }

    const where = vendorId
      ? "o.status IN ('placed', 'accepted', 'preparing', 'ready') AND o.vendor_id = ?"
      : "o.status IN ('placed', 'accepted', 'preparing', 'ready')";

    const params = vendorId ? [vendorId] : [];

    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.company, v.name as vendor_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      WHERE ${where}
      ORDER BY
        CASE o.status
          WHEN 'placed' THEN 1
          WHEN 'accepted' THEN 2
          WHEN 'preparing' THEN 3
          WHEN 'ready' THEN 4
          ELSE 5
        END,
        o.created_at ASC
    `).all(...params);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id).map(item => ({
        ...item,
        addons: item.addons_json ? JSON.parse(item.addons_json) : []
      }))
    }));

    // Summary counts for top bar badges
    const counts = {
      placed: orders.filter(o => o.status === 'placed').length,
      preparing: orders.filter(o => o.status === 'accepted' || o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      totalLive: orders.length
    };

    res.json({ orders: enrichedOrders, counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kitchen/orders/:id/bump - 1-click status bump
router.post('/orders/:id/bump', authenticate, kitchenAccess, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    let nextStatus = 'accepted';
    if (order.status === 'placed') nextStatus = 'accepted';
    else if (order.status === 'accepted') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') nextStatus = 'picked_up';

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextStatus, req.params.id);

    res.json({ success: true, orderId: order.id, previousStatus: order.status, currentStatus: nextStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kitchen/verify-pickup - Handover OTP / QR code verification
router.post('/verify-pickup', authenticate, kitchenAccess, (req, res) => {
  try {
    const { otp, order_number } = req.body;
    if (!otp && !order_number) {
      return res.status(400).json({ error: 'Pickup OTP or Order Number is required.' });
    }

    let order = null;
    if (otp) {
      order = db.prepare("SELECT * FROM orders WHERE pickup_otp = ? AND status IN ('ready', 'preparing', 'accepted', 'placed')").get(String(otp).trim());
    } else if (order_number) {
      order = db.prepare("SELECT * FROM orders WHERE order_number = ? AND status IN ('ready', 'preparing', 'accepted', 'placed')").get(String(order_number).trim());
    }

    if (!order) {
      return res.status(404).json({ error: 'Invalid OTP or Order already collected / cancelled.' });
    }

    // Mark as picked up
    db.prepare("UPDATE orders SET status = 'picked_up', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: 'picked_up',
        total_amount: order.total_amount
      },
      message: `Order #${order.order_number} successfully verified and handed over!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kitchen/inventory - Inventory stock alert list
router.get('/inventory', authenticate, kitchenAccess, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM inventory_items ORDER BY status DESC, item_name ASC').all();
    res.json({ inventory: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kitchen/inventory/:id - Update stock
router.patch('/inventory/:id', authenticate, kitchenAccess, (req, res) => {
  try {
    const { status, current_stock } = req.body;
    db.prepare(`
      UPDATE inventory_items
      SET status = COALESCE(?, status),
          current_stock = COALESCE(?, current_stock),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, current_stock, req.params.id);

    const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
    res.json({ item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
