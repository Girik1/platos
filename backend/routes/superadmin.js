const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Middleware: allow 'super_admin' and 'admin'
const superAdminOnly = authorize('super_admin', 'admin');

// GET /api/superadmin/dashboard - Enterprise metrics
router.get('/dashboard', authenticate, superAdminOnly, (req, res) => {
  try {
    const totalOrgs = db.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
    const activeOrgs = db.prepare("SELECT COUNT(*) as count FROM organizations WHERE subscription_status = 'active'").get().count;
    const totalCafeterias = db.prepare('SELECT COUNT(*) as count FROM cafeterias').get().count;
    const totalVendors = db.prepare('SELECT COUNT(*) as count FROM vendors').get().count;
    const verifiedVendors = db.prepare("SELECT COUNT(*) as count FROM vendors WHERE verification_status = 'verified'").get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const grossVolume = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'").get().total;
    const totalCommission = grossVolume * 0.05; // 5% average platform commission

    const recentOrgs = db.prepare('SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5').all();
    const pendingVendors = db.prepare("SELECT v.*, u.email as owner_email FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.verification_status = 'pending'").all();
    const recentActivity = db.prepare(`
      SELECT o.order_number, o.total_amount, o.status, o.created_at, u.name as customer_name, v.name as vendor_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      ORDER BY o.created_at DESC LIMIT 8
    `).all();

    res.json({
      metrics: {
        totalOrgs,
        activeOrgs,
        totalCafeterias,
        totalVendors,
        verifiedVendors,
        totalUsers,
        totalOrders,
        grossVolume,
        totalCommission,
        activeSubscriptions: activeOrgs,
        platformUptime: '99.98%'
      },
      recentOrgs,
      pendingVendors,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/organizations - All corporate tenants
router.get('/organizations', authenticate, superAdminOnly, (req, res) => {
  try {
    const orgs = db.prepare(`
      SELECT o.*,
        (SELECT COUNT(*) FROM cafeterias c WHERE c.org_id = o.id) as cafeteria_count,
        (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id AND u.role = 'customer') as employee_count,
        (SELECT COALESCE(SUM(ord.total_amount), 0) FROM orders ord WHERE ord.org_id = o.id) as total_spent
      FROM organizations o
      ORDER BY o.created_at DESC
    `).all();
    res.json({ organizations: orgs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/superadmin/organizations - Create new tenant
router.post('/organizations', authenticate, superAdminOnly, (req, res) => {
  try {
    const { name, code, domain, contact_email, contact_phone, address, subscription_tier, monthly_budget, commission_rate } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Organization name and unique client code are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO organizations (name, code, domain, contact_email, contact_phone, address, subscription_tier, monthly_budget, commission_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      code.toUpperCase().trim(),
      domain || null,
      contact_email || null,
      contact_phone || null,
      address || null,
      subscription_tier || 'Enterprise',
      Number(monthly_budget) || 250000,
      Number(commission_rate) || 5.0
    );

    const newOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ organization: newOrg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/superadmin/organizations/:id - Update tenant
router.put('/organizations/:id', authenticate, superAdminOnly, (req, res) => {
  try {
    const { name, domain, contact_email, subscription_tier, subscription_status, monthly_budget, commission_rate } = req.body;
    db.prepare(`
      UPDATE organizations
      SET name = COALESCE(?, name),
          domain = COALESCE(?, domain),
          contact_email = COALESCE(?, contact_email),
          subscription_tier = COALESCE(?, subscription_tier),
          subscription_status = COALESCE(?, subscription_status),
          monthly_budget = COALESCE(?, monthly_budget),
          commission_rate = COALESCE(?, commission_rate)
      WHERE id = ?
    `).run(name, domain, contact_email, subscription_tier, subscription_status, monthly_budget, commission_rate, req.params.id);

    const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    res.json({ organization: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/superadmin/vendors - All partner vendors with compliance
router.get('/vendors', authenticate, superAdminOnly, (req, res) => {
  try {
    const vendors = db.prepare(`
      SELECT v.*, u.name as owner_name, u.email as owner_email, c.name as cafeteria_name, o.name as org_name,
        (SELECT COUNT(*) FROM menu_items mi WHERE mi.vendor_id = v.id) as menu_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders ord WHERE ord.vendor_id = v.id) as total_sales
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN cafeterias c ON v.cafeteria_id = c.id
      LEFT JOIN organizations o ON c.org_id = o.id
      ORDER BY v.created_at DESC
    `).all();
    res.json({ vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/superadmin/vendors/:id/verify - 1-click verification
router.patch('/vendors/:id/verify', authenticate, superAdminOnly, (req, res) => {
  try {
    const { status, fssai_license } = req.body;
    db.prepare(`
      UPDATE vendors
      SET verification_status = COALESCE(?, verification_status),
          fssai_license = COALESCE(?, fssai_license)
      WHERE id = ?
    `).run(status || 'verified', fssai_license || null, req.params.id);

    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    res.json({ vendor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
