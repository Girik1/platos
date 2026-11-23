const express = require('express');
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const orgAdminOnly = authorize('org_admin', 'admin', 'super_admin');

// Helper to determine org_id for current user
function resolveOrgId(req) {
  if (req.user.org_id) return req.user.org_id;
  const firstOrg = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  return firstOrg ? firstOrg.id : 1;
}

// GET /api/organizations/current - Current company profile and budget stats
router.get('/current', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const totalEmployees = db.prepare("SELECT COUNT(*) as count FROM users WHERE org_id = ? AND role = 'customer'").get(orgId).count;
    const totalCafeterias = db.prepare('SELECT COUNT(*) as count FROM cafeterias WHERE org_id = ?').get(orgId).count;
    const totalSpentThisMonth = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE org_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get(orgId).total;

    const subsidySpent = db.prepare(`
      SELECT COALESCE(SUM(subsidy_amount), 0) as total
      FROM orders
      WHERE org_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get(orgId).total;

    res.json({
      organization: org,
      stats: {
        totalEmployees,
        totalCafeterias,
        monthlyBudget: org.monthly_budget,
        totalSpentThisMonth,
        subsidySpent,
        budgetRemaining: Math.max(0, org.monthly_budget - subsidySpent)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/organizations/cafeterias - Cafeteria campuses for this org
router.get('/cafeterias', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const cafeterias = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM vendors v WHERE v.cafeteria_id = c.id) as counter_count
      FROM cafeterias c
      WHERE c.org_id = ?
      ORDER BY c.created_at DESC
    `).all(orgId);
    res.json({ cafeterias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/organizations/cafeterias - Add new cafeteria facility
router.post('/cafeterias', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const { name, code, location_building, floor, capacity, opening_time, closing_time } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Cafeteria name and code are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO cafeterias (org_id, name, code, location_building, floor, capacity, opening_time, closing_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orgId,
      name,
      code.toUpperCase().trim(),
      location_building || 'Main Campus',
      floor || 'Ground Floor',
      Number(capacity) || 200,
      opening_time || '07:30',
      closing_time || '22:00'
    );

    const created = db.prepare('SELECT * FROM cafeterias WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ cafeteria: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/organizations/departments - Department budgets
router.get('/departments', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const departments = db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as member_count
      FROM departments d
      WHERE d.org_id = ?
      ORDER BY d.name ASC
    `).all(orgId);
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/organizations/departments - Create department
router.post('/departments', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const { name, budget_limit } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required.' });

    const stmt = db.prepare('INSERT INTO departments (org_id, name, budget_limit) VALUES (?, ?, ?)');
    const result = stmt.run(orgId, name, Number(budget_limit) || 50000);
    const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ department: dept });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/organizations/subsidies - Corporate meal subsidy rules
router.get('/subsidies', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const subsidies = db.prepare(`
      SELECT s.*, d.name as department_name
      FROM subsidies s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.org_id = ? OR s.org_id IS NULL
    `).all(orgId);
    res.json({ subsidies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/organizations/subsidies - Create or update subsidy policy
router.post('/subsidies', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const org = db.prepare('SELECT name FROM organizations WHERE id = ?').get(orgId);
    const { department_id, meal_type, amount, subsidy_percent, daily_cap } = req.body;

    if (!meal_type || !amount) {
      return res.status(400).json({ error: 'Meal slot and subsidy amount are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO subsidies (org_id, company, department_id, meal_type, amount, subsidy_percent, daily_cap, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      orgId,
      org?.name || 'TechCorp Global',
      department_id || null,
      meal_type.toLowerCase(),
      Number(amount),
      Number(subsidy_percent) || 100,
      Number(daily_cap) || 150
    );

    const sub = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ subsidy: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/organizations/employees - Employee directory with wallet balances
router.get('/employees', authenticate, orgAdminOnly, (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const employees = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.employee_id, u.wallet_balance, u.created_at, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.org_id = ? AND u.role = 'customer'
      ORDER BY u.name ASC
    `).all(orgId);
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/organizations/wallets/topup - Company wallet grants to employee
router.post('/wallets/topup', authenticate, orgAdminOnly, (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    const grantAmount = Number(amount);
    if (!user_id || !grantAmount || grantAmount <= 0) {
      return res.status(400).json({ error: 'Valid employee ID and credit amount are required.' });
    }

    const employee = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!employee) return res.status(404).json({ error: 'Employee not found.' });

    const newBalance = (employee.wallet_balance || 0) + grantAmount;
    db.prepare('UPDATE users SET wallet_balance = ? WHERE id = ?').run(newBalance, user_id);

    // Audit in wallet_transactions
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, org_id, amount, type, balance_after, description, reference_id)
      VALUES (?, ?, ?, 'credit_subsidy', ?, ?, ?)
    `).run(
      user_id,
      employee.org_id || 1,
      grantAmount,
      newBalance,
      description || 'Corporate Meal Allowance Grant',
      `GRANT-${Date.now().toString().slice(-6)}`
    );

    res.json({ success: true, newBalance, employeeId: user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
