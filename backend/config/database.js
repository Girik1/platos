const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = path.resolve(__dirname, '..', process.env.DB_PATH || './platos.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      domain TEXT,
      logo TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      subscription_tier TEXT DEFAULT 'Enterprise' CHECK(subscription_tier IN ('Starter', 'Growth', 'Enterprise', 'Custom')),
      subscription_status TEXT DEFAULT 'active' CHECK(subscription_status IN ('active', 'trial', 'past_due', 'cancelled')),
      monthly_budget REAL DEFAULT 250000,
      commission_rate REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cafeterias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location_building TEXT,
      floor TEXT,
      capacity INTEGER DEFAULT 250,
      is_active INTEGER DEFAULT 1,
      opening_time TEXT DEFAULT '07:30',
      closing_time TEXT DEFAULT '22:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      budget_limit REAL DEFAULT 50000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS users (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cafeteria_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      cuisine_type TEXT,
      rating REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      verification_status TEXT DEFAULT 'verified' CHECK(verification_status IN ('pending', 'verified', 'suspended')),
      fssai_license TEXT DEFAULT '10019043002847',
      opening_time TEXT DEFAULT '08:00',
      closing_time TEXT DEFAULT '22:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cafeteria_id) REFERENCES cafeterias(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image TEXT,
      is_veg INTEGER DEFAULT 1,
      is_vegan INTEGER DEFAULT 0,
      is_gluten_free INTEGER DEFAULT 0,
      calories INTEGER DEFAULT 320,
      allergens TEXT,
      is_available INTEGER DEFAULT 1,
      is_bestseller INTEGER DEFAULT 0,
      prep_time INTEGER DEFAULT 15,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      special_instructions TEXT,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS cart_item_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_item_id INTEGER NOT NULL,
      addon_id INTEGER NOT NULL,
      FOREIGN KEY (cart_item_id) REFERENCES cart_items(id) ON DELETE CASCADE,
      FOREIGN KEY (addon_id) REFERENCES addons(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vendor_id INTEGER NOT NULL,
      cafeteria_id INTEGER,
      org_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'placed' CHECK(status IN ('placed', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled')),
      total_amount REAL NOT NULL,
      subsidy_amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'wallet',
      payment_status TEXT DEFAULT 'paid',
      pickup_otp TEXT,
      qr_code TEXT,
      is_preorder INTEGER DEFAULT 0,
      scheduled_slot TEXT,
      special_instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (cafeteria_id) REFERENCES cafeterias(id),
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      item_price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      addons_json TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vendor_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS subsidies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER,
      company TEXT NOT NULL,
      department_id INTEGER,
      meal_type TEXT NOT NULL,
      amount REAL NOT NULL,
      subsidy_percent REAL DEFAULT 100,
      daily_cap REAL DEFAULT 150,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (org_id) REFERENCES organizations(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      org_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('credit_subsidy', 'credit_self', 'debit_order', 'refund')),
      balance_after REAL NOT NULL,
      description TEXT,
      reference_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS vendor_settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_sales REAL NOT NULL,
      platform_commission REAL NOT NULL,
      net_payout REAL NOT NULL,
      status TEXT DEFAULT 'processed' CHECK(status IN ('pending', 'processed', 'on_hold')),
      payout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      payment_reference TEXT,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      current_stock REAL DEFAULT 50,
      min_threshold REAL DEFAULT 10,
      unit TEXT DEFAULT 'units',
      status TEXT DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'low_stock', 'out_of_stock')),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
  `);

  // Safe migrations for existing SQLite databases
  const safeAlter = (sql) => {
    try {
      db.exec(sql);
    } catch (_) {
      // Column or table already altered
    }
  };

  safeAlter('ALTER TABLE users ADD COLUMN org_id INTEGER');
  safeAlter('ALTER TABLE users ADD COLUMN department_id INTEGER');
  safeAlter('ALTER TABLE users ADD COLUMN employee_id TEXT');
  safeAlter('ALTER TABLE vendors ADD COLUMN cafeteria_id INTEGER');
  safeAlter('ALTER TABLE vendors ADD COLUMN verification_status TEXT DEFAULT "verified"');
  safeAlter('ALTER TABLE vendors ADD COLUMN fssai_license TEXT DEFAULT "10019043002847"');
  safeAlter('ALTER TABLE menu_items ADD COLUMN is_vegan INTEGER DEFAULT 0');
  safeAlter('ALTER TABLE menu_items ADD COLUMN is_gluten_free INTEGER DEFAULT 0');
  safeAlter('ALTER TABLE menu_items ADD COLUMN calories INTEGER DEFAULT 320');
  safeAlter('ALTER TABLE menu_items ADD COLUMN allergens TEXT');
  safeAlter('ALTER TABLE orders ADD COLUMN cafeteria_id INTEGER');
  safeAlter('ALTER TABLE orders ADD COLUMN org_id INTEGER');
  safeAlter('ALTER TABLE orders ADD COLUMN is_preorder INTEGER DEFAULT 0');
  safeAlter('ALTER TABLE orders ADD COLUMN scheduled_slot TEXT');
  safeAlter('ALTER TABLE subsidies ADD COLUMN org_id INTEGER');
  safeAlter('ALTER TABLE subsidies ADD COLUMN department_id INTEGER');
  safeAlter('ALTER TABLE subsidies ADD COLUMN subsidy_percent REAL DEFAULT 100');
  safeAlter('ALTER TABLE subsidies ADD COLUMN daily_cap REAL DEFAULT 150');
}

function isDatabaseEmpty() {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count === 0;
}

module.exports = { db, initializeDatabase, isDatabaseEmpty };
