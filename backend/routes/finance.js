const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/finance/wallet/transactions - Employee wallet ledger
router.get('/wallet/transactions', authenticate, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM wallet_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id);

    const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(req.user.id);

    res.json({
      balance: user?.wallet_balance || 0,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/wallet/topup - Self topup with UPI / Gateway integration
router.post('/wallet/topup', authenticate, (req, res) => {
  try {
    const { amount, payment_method } = req.body;
    const topupAmount = Number(amount);
    if (!topupAmount || topupAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid top-up amount.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const newBalance = (user.wallet_balance || 0) + topupAmount;

    db.prepare('UPDATE users SET wallet_balance = ? WHERE id = ?').run(newBalance, req.user.id);

    // Record transaction
    const ref = `UPI-PAY-${Date.now().toString().slice(-8)}`;
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, org_id, amount, type, balance_after, description, reference_id)
      VALUES (?, ?, ?, 'credit_self', ?, ?, ?)
    `).run(
      req.user.id,
      user.org_id || 1,
      topupAmount,
      newBalance,
      `Wallet Auto-Reload via ${payment_method || 'UPI (Google Pay / PhonePe)'}`,
      ref
    );

    res.json({
      success: true,
      newBalance,
      transaction: {
        amount: topupAmount,
        reference_id: ref,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/settlements - Vendor payouts & commission settlements
router.get('/settlements', authenticate, (req, res) => {
  try {
    let where = '1=1';
    const params = [];

    // If vendor, filter to own settlements
    if (req.user.role === 'vendor') {
      const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ?').get(req.user.id);
      if (vendor) {
        where += ' AND vs.vendor_id = ?';
        params.push(vendor.id);
      }
    }

    const settlements = db.prepare(`
      SELECT vs.*, v.name as vendor_name, v.fssai_license
      FROM vendor_settlements vs
      JOIN vendors v ON vs.vendor_id = v.id
      WHERE ${where}
      ORDER BY vs.period_end DESC
    `).all(...params);

    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(total_sales), 0) as grossSales,
        COALESCE(SUM(platform_commission), 0) as totalCommission,
        COALESCE(SUM(net_payout), 0) as totalPayout
      FROM vendor_settlements vs
      WHERE ${where}
    `).get(...params);

    res.json({ settlements, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/settlements/generate - Generate weekly settlement batch
router.post('/settlements/generate', authenticate, authorize('admin', 'super_admin'), (req, res) => {
  try {
    const { vendor_id, period_start, period_end } = req.body;
    if (!vendor_id || !period_start || !period_end) {
      return res.status(400).json({ error: 'Vendor ID and settlement period are required.' });
    }

    const sales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE vendor_id = ? AND payment_status = 'paid'
        AND DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)
    `).get(vendor_id, period_start, period_end).total;

    const commission = sales * 0.05;
    const netPayout = Math.max(0, sales - commission);
    const ref = `SETTLE-${Date.now().toString().slice(-6)}`;

    const result = db.prepare(`
      INSERT INTO vendor_settlements (vendor_id, period_start, period_end, total_sales, platform_commission, net_payout, status, payment_reference)
      VALUES (?, ?, ?, ?, ?, ?, 'processed', ?)
    `).run(vendor_id, period_start, period_end, sales, commission, netPayout, ref);

    const created = db.prepare('SELECT * FROM vendor_settlements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ settlement: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/reports/export - Exportable CSV data for corporate audit
router.get('/reports/export', authenticate, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.order_number, u.name as employee_name, u.employee_id, u.company,
             v.name as vendor_name, o.total_amount, o.subsidy_amount,
             (o.total_amount - o.subsidy_amount) as net_employee_paid,
             o.payment_method, o.status, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();

    res.json({ exportData: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
