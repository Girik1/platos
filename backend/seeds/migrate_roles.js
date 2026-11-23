const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const hash = (pw) => bcrypt.hashSync(pw, 10);

try {
  db.pragma('foreign_keys = OFF');

  // Check if super_admin can be inserted
  let needsMigration = false;
  try {
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('test', 'test_role_check@test.com', 'hash', 'super_admin')").run();
    db.prepare("DELETE FROM users WHERE email = 'test_role_check@test.com'").run();
  } catch (err) {
    needsMigration = true;
  }

  if (needsMigration) {
    console.log('Migrating users table to support all SaaS roles...');
    db.exec('ALTER TABLE users RENAME TO users_old;');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'vendor', 'admin', 'org_admin', 'super_admin', 'kitchen_staff')),
        company TEXT,
        org_id INTEGER,
        department_id INTEGER,
        employee_id TEXT,
        avatar TEXT,
        wallet_balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    db.exec('INSERT INTO users (id, name, email, phone, password_hash, role, company, wallet_balance, created_at) SELECT id, name, email, phone, password_hash, role, company, wallet_balance, created_at FROM users_old;');
    db.exec('DROP TABLE users_old;');
  }

  db.pragma('foreign_keys = ON');

  // Insert Enterprise roles
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, phone, password_hash, role, company, org_id, department_id, employee_id, wallet_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Global Super Admin', 'superadmin@platos.com', '9000000001', hash('admin123'), 'super_admin', 'Platos Platform HQ', null, null, 'HQ-001', 50000);
  insertUser.run('Kavita Nair (Org Admin)', 'orgadmin@platos.com', '9000000002', hash('admin123'), 'org_admin', 'TechCorp Global', 1, 4, 'TC-HR-101', 25000);
  insertUser.run('Chef Suresh (Kitchen KDS)', 'kitchen1@platos.com', '9100000003', hash('vendor123'), 'kitchen_staff', null, 1, null, 'KDS-001', 0);

  // Link existing vendors to cafeteria 1
  db.prepare('UPDATE vendors SET cafeteria_id = 1 WHERE cafeteria_id IS NULL').run();
  db.prepare("UPDATE users SET org_id = 1 WHERE company = 'TechCorp' OR company = 'TechCorp Global'").run();

  console.log('✅ Users & Roles successfully updated:');
  console.log(db.prepare('SELECT id, name, email, role, company FROM users').all());
} catch (err) {
  console.error('Migration error:', err);
}
