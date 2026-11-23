const bcrypt = require('bcryptjs');

function runSeed(db) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // ── Users ──
  const insertUser = db.prepare('INSERT INTO users (name, email, phone, password_hash, role, company, wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?)');

  insertUser.run('Admin', 'admin@platos.com', '9000000000', hash('admin123'), 'admin', 'Platos Corp', 10000);
  insertUser.run('Annapurna Kitchen', 'vendor1@platos.com', '9100000001', hash('vendor123'), 'vendor', null, 0);
  insertUser.run('Spice Route Café', 'vendor2@platos.com', '9100000002', hash('vendor123'), 'vendor', null, 0);
  insertUser.run('Rahul Sharma', 'user1@platos.com', '9200000001', hash('user123'), 'customer', 'TechCorp', 500);
  insertUser.run('Priya Patel', 'user2@platos.com', '9200000002', hash('user123'), 'customer', 'TechCorp', 750);
  insertUser.run('Amit Kumar', 'user3@platos.com', '9200000003', hash('user123'), 'customer', 'DesignHub', 300);

  // ── Vendors ──
  const insertVendor = db.prepare('INSERT INTO vendors (user_id, name, description, logo, cuisine_type, rating, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertVendor.run(2, 'Annapurna Kitchen', 'Authentic South & North Indian home-style meals prepared fresh daily', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80', 'Indian', 4.5, '07:30', '21:30');
  insertVendor.run(3, 'Spice Route Café', 'Quick bites, beverages, and fusion snacks for the modern palate', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80', 'Multi-Cuisine', 4.2, '08:00', '22:00');

  // ── Categories ──
  const insertCat = db.prepare('INSERT INTO categories (vendor_id, name, sort_order) VALUES (?, ?, ?)');
  // Vendor 1
  insertCat.run(1, 'Breakfast', 1);
  insertCat.run(1, 'Lunch', 2);
  insertCat.run(1, 'Snacks', 3);
  insertCat.run(1, 'Beverages', 4);
  insertCat.run(1, 'Desserts', 5);
  // Vendor 2
  insertCat.run(2, 'Breakfast', 1);
  insertCat.run(2, 'Lunch', 2);
  insertCat.run(2, 'Snacks', 3);
  insertCat.run(2, 'Beverages', 4);
  insertCat.run(2, 'Desserts', 5);

  // ── Menu Items ──
  const insertItem = db.prepare('INSERT INTO menu_items (vendor_id, category_id, name, description, price, image, is_veg, is_bestseller, prep_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // Vendor 1 – Breakfast (cat 1)
  insertItem.run(1, 1, 'Masala Dosa', 'Crispy rice crepe with spiced potato filling, served with sambar and chutney', 80, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80', 1, 1, 15);
  insertItem.run(1, 1, 'Idli Sambar', 'Steamed rice cakes (4 pcs) with sambar and coconut chutney', 60, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 1, 0, 10);
  insertItem.run(1, 1, 'Poha', 'Flattened rice tempered with mustard seeds, peanuts, and curry leaves', 50, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80', 1, 0, 10);
  insertItem.run(1, 1, 'Aloo Paratha', 'Stuffed whole wheat flatbread with spiced potato, served with curd and pickle', 70, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80', 1, 1, 15);

  // Vendor 1 – Lunch (cat 2)
  insertItem.run(1, 2, 'Paneer Butter Masala', 'Rich and creamy tomato-based curry with soft paneer cubes', 180, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80', 1, 1, 20);
  insertItem.run(1, 2, 'Chicken Biryani', 'Fragrant basmati rice layered with tender chicken and aromatic spices', 220, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 0, 1, 25);
  insertItem.run(1, 2, 'Dal Tadka', 'Yellow lentils tempered with cumin, garlic, and ghee', 120, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80', 1, 0, 15);
  insertItem.run(1, 2, 'Rajma Chawal', 'Kidney bean curry served with steamed basmati rice', 130, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80', 1, 0, 15);
  insertItem.run(1, 2, 'Butter Naan', 'Soft leavened bread brushed with butter, baked in tandoor', 40, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 1, 0, 10);
  insertItem.run(1, 2, 'Jeera Rice', 'Fragrant basmati rice tempered with cumin seeds', 80, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80', 1, 0, 12);

  // Vendor 1 – Snacks (cat 3)
  insertItem.run(1, 3, 'Samosa', 'Crispy deep-fried pastry stuffed with spiced potatoes and peas (2 pcs)', 40, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 1, 1, 8);
  insertItem.run(1, 3, 'Vada Pav', 'Spicy potato fritter in a pav bun with chutneys – Mumbai\'s iconic street food', 35, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80', 1, 0, 8);
  insertItem.run(1, 3, 'Pav Bhaji', 'Spiced mashed vegetables served with buttered pav bread', 90, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80', 1, 0, 15);

  // Vendor 1 – Beverages (cat 4)
  insertItem.run(1, 4, 'Filter Coffee', 'Traditional South Indian decoction coffee served in a steel tumbler', 40, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 1, 1, 5);
  insertItem.run(1, 4, 'Masala Chai', 'Spiced Indian tea with ginger and cardamom', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 1, 0, 5);
  insertItem.run(1, 4, 'Buttermilk', 'Refreshing spiced yogurt drink with curry leaves and cumin', 30, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80', 1, 0, 5);

  // Vendor 1 – Desserts (cat 5)
  insertItem.run(1, 5, 'Gulab Jamun', 'Deep-fried milk dumplings soaked in rose-cardamom sugar syrup (2 pcs)', 60, 'https://images.unsplash.com/photo-1589119908995-c6837fa14d48?w=600&auto=format&fit=crop&q=80', 1, 1, 5);
  insertItem.run(1, 5, 'Rasmalai', 'Soft paneer discs in sweetened, cardamom-flavoured milk (2 pcs)', 70, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80', 1, 0, 5);

  // Vendor 2 – Breakfast (cat 6)
  insertItem.run(2, 6, 'Egg Bhurji Pav', 'Spiced scrambled eggs served with buttered pav bread', 75, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80', 0, 1, 10);
  insertItem.run(2, 6, 'Rava Upma', 'Semolina cooked with vegetables, mustard seeds and cashews', 55, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 1, 0, 10);
  insertItem.run(2, 6, 'Cheese Omelette', 'Fluffy three-egg omelette loaded with cheese and herbs', 85, 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&auto=format&fit=crop&q=80', 0, 0, 10);

  // Vendor 2 – Lunch (cat 7)
  insertItem.run(2, 7, 'Mutton Rogan Josh', 'Slow-cooked mutton in a rich Kashmiri-style gravy', 280, 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80', 0, 1, 30);
  insertItem.run(2, 7, 'Chole Bhature', 'Spiced chickpea curry with deep-fried puffed bread', 140, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80', 1, 1, 20);
  insertItem.run(2, 7, 'Veg Thali', 'Complete meal with roti, rice, dal, sabzi, raita, papad, and sweet', 160, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80', 1, 0, 20);
  insertItem.run(2, 7, 'Fish Curry Rice', 'Tangy Goan-style fish curry with steamed rice', 200, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', 0, 0, 20);
  insertItem.run(2, 7, 'Mushroom Biryani', 'Aromatic basmati rice cooked with mushrooms and spices', 170, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 1, 0, 25);

  // Vendor 2 – Snacks (cat 8)
  insertItem.run(2, 8, 'Paneer Tikka', 'Marinated paneer cubes grilled in tandoor with bell peppers and onions', 150, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80', 1, 1, 15);
  insertItem.run(2, 8, 'Chicken Momos', 'Steamed dumplings with spiced chicken filling, served with spicy chutney (6 pcs)', 120, 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80', 0, 0, 15);
  insertItem.run(2, 8, 'Spring Roll', 'Crispy rolls stuffed with mixed vegetables (4 pcs)', 90, 'https://images.unsplash.com/photo-1548869206-93b036288d7e?w=600&auto=format&fit=crop&q=80', 1, 0, 10);

  // Vendor 2 – Beverages (cat 9)
  insertItem.run(2, 9, 'Cold Coffee', 'Chilled blended coffee with milk and ice cream', 80, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80', 1, 1, 5);
  insertItem.run(2, 9, 'Fresh Lime Soda', 'Refreshing lime soda – sweet or salted', 45, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', 1, 0, 5);
  insertItem.run(2, 9, 'Mango Lassi', 'Thick creamy yogurt shake with Alphonso mango pulp', 70, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80', 1, 0, 5);

  // Vendor 2 – Desserts (cat 10)
  insertItem.run(2, 10, 'Brownie with Ice Cream', 'Warm chocolate brownie topped with vanilla ice cream', 120, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80', 1, 0, 8);
  insertItem.run(2, 10, 'Kulfi', 'Traditional Indian frozen dessert – malai flavour', 50, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=80', 1, 0, 5);

  // ── Addons ──
  const insertAddon = db.prepare('INSERT INTO addons (menu_item_id, name, price) VALUES (?, ?, ?)');
  // Dosa addons
  insertAddon.run(1, 'Extra Sambar', 20);
  insertAddon.run(1, 'Cheese Topping', 30);
  // Biryani addons
  insertAddon.run(6, 'Extra Raita', 20);
  insertAddon.run(6, 'Extra Gravy', 40);
  insertAddon.run(6, 'Boiled Egg', 15);
  // Paneer Butter Masala addons
  insertAddon.run(5, 'Extra Paneer', 50);
  insertAddon.run(5, 'Extra Gravy', 20);
  // Naan addons
  insertAddon.run(9, 'Garlic Butter', 10);
  insertAddon.run(9, 'Cheese Stuffing', 30);
  // Samosa addons
  insertAddon.run(11, 'Extra Chutney', 10);
  // Filter Coffee
  insertAddon.run(14, 'Extra Shot', 15);
  // Chole Bhature addons
  insertAddon.run(24, 'Extra Bhatura', 25);
  insertAddon.run(24, 'Onion Salad', 10);
  // Cold Coffee addons
  insertAddon.run(31, 'Whipped Cream', 25);
  insertAddon.run(31, 'Chocolate Syrup', 15);
  // Paneer Tikka addons
  insertAddon.run(28, 'Mint Chutney', 15);
  insertAddon.run(28, 'Extra Cheese', 30);
  // Momos addons
  insertAddon.run(29, 'Spicy Mayo', 15);
  insertAddon.run(29, 'Extra Chutney', 10);

  // ── Subsidies ──
  const insertSubsidy = db.prepare('INSERT INTO subsidies (company, meal_type, amount, is_active) VALUES (?, ?, ?, ?)');
  insertSubsidy.run('TechCorp', 'breakfast', 50, 1);
  insertSubsidy.run('TechCorp', 'lunch', 100, 1);
  insertSubsidy.run('TechCorp', 'dinner', 75, 1);
  insertSubsidy.run('DesignHub', 'lunch', 80, 1);
  insertSubsidy.run('DesignHub', 'snack', 30, 1);

  console.log('✅ Seed data inserted successfully with real images!');
}

module.exports = { runSeed };
