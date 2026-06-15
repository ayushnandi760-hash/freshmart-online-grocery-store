// ============================================
// Database Setup & Seed Script
// ============================================
// Called on server startup. Ensures all tables
// exist and seeds the products catalog if empty.
// This makes the app self-initializing — no need
// to manually run SQL scripts.
// ============================================

const { pool } = require('../config/db');

// ── Table Creation Queries ─────────────────────

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB
`;

const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url   VARCHAR(255),
    category    VARCHAR(100),
    stock       INT           DEFAULT 100,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB
`;

const CREATE_CART_TABLE = `
  CREATE TABLE IF NOT EXISTS cart (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    UNIQUE KEY  unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`;

const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT           NOT NULL,
    customer_name   VARCHAR(100)  NOT NULL,
    phone           VARCHAR(20)   NOT NULL,
    address         TEXT          NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(50)   DEFAULT 'COD',
    status          VARCHAR(50)   DEFAULT 'Pending',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`;

const CREATE_ORDER_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS order_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT           NOT NULL,
    product_id  INT           NOT NULL,
    quantity    INT           NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`;

// ── Seed Data ──────────────────────────────────

const SEED_PRODUCTS = `
  INSERT INTO products (name, price, description, image_url, category, stock) VALUES
    ('Basmati Rice (1kg)',   90.00,  'Premium long-grain basmati rice, aged for rich aroma and fluffy texture.',     'rice.jpg',      'Grains & Staples', 100),
    ('Wheat Flour (5kg)',   250.00,  'Finely ground whole wheat flour, perfect for chapatis, rotis, and baking.',    'flour.jpg',     'Grains & Staples', 100),
    ('Milk (500ml)',         30.00,  'Farm-fresh pasteurized toned milk, packed with essential nutrients.',           'milk.jpg',      'Dairy',            150),
    ('Bread',                40.00,  'Soft and fresh white sandwich bread, ideal for toast and sandwiches.',          'bread.jpg',     'Bakery',           120),
    ('Eggs (12 pcs)',        75.00,  'Farm-fresh brown eggs, rich in protein and perfect for every meal.',            'eggs.jpg',      'Dairy',            100),
    ('Potatoes (1kg)',       35.00,  'Fresh and firm potatoes, great for curries, fries, and snacks.',                'potatoes.jpg',  'Vegetables',       200),
    ('Onions (1kg)',         40.00,  'Premium quality onions, essential for everyday Indian cooking.',                 'onions.jpg',    'Vegetables',       200),
    ('Tomatoes (1kg)',       50.00,  'Ripe and juicy tomatoes, perfect for gravies, salads, and sauces.',             'tomatoes.jpg',  'Vegetables',       180),
    ('Bananas (1 dozen)',    60.00,  'Sweet and ripe yellow bananas, loaded with potassium and energy.',              'bananas.jpg',   'Fruits',           150),
    ('Apples (1kg)',        180.00,  'Crisp and juicy Shimla apples, a healthy and delicious snack.',                 'apples.jpg',    'Fruits',           100),
    ('Cooking Oil (1L)',    150.00,  'Refined sunflower cooking oil, light and heart-healthy for daily use.',         'oil.jpg',       'Oils & Spices',    100),
    ('Sugar (1kg)',          55.00,  'Fine-grain white sugar, ideal for beverages, desserts, and cooking.',           'sugar.jpg',     'Grains & Staples', 150),
    ('Salt (1kg)',           25.00,  'Iodized table salt, an essential kitchen staple for every household.',          'salt.jpg',      'Grains & Staples', 200),
    ('Biscuits Pack',        20.00,  'Crunchy and delicious butter biscuits, perfect with tea or coffee.',            'biscuits.jpg',  'Snacks',           250),
    ('Tea Powder (250g)',   120.00,  'Premium Assam tea powder, delivers a strong and aromatic cup every time.',      'tea.jpg',       'Beverages',        130)
`;

// ── Setup Function ─────────────────────────────

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...');

    // Create tables in order (respecting foreign key dependencies)
    await pool.query(CREATE_USERS_TABLE);
    console.log('   ✓ users table ready');

    await pool.query(CREATE_PRODUCTS_TABLE);
    console.log('   ✓ products table ready');

    await pool.query(CREATE_CART_TABLE);
    console.log('   ✓ cart table ready');

    await pool.query(CREATE_ORDERS_TABLE);
    console.log('   ✓ orders table ready');

    await pool.query(CREATE_ORDER_ITEMS_TABLE);
    console.log('   ✓ order_items table ready');

    // Seed products only if the table is empty
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM products');
    if (rows[0].count === 0) {
      await pool.query(SEED_PRODUCTS);
      console.log('   ✓ 15 grocery products seeded');
    } else {
      console.log(`   ✓ products already populated (${rows[0].count} items)`);
    }

    console.log('✅ Database setup complete!\n');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  }
}

module.exports = setupDatabase;
