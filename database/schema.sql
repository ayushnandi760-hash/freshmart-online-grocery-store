-- ============================================
-- FreshMart Grocery E-Commerce Database Schema
-- ============================================
-- Run this script to set up the complete database.
-- Usage: mysql -u root -p < schema.sql
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS freshmart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE freshmart;

-- ============================================
-- 1. USERS TABLE
-- Stores registered customer accounts.
-- Passwords are stored as bcrypt hashes.
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,          -- bcrypt hashed password
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. PRODUCTS TABLE
-- Stores the grocery product catalog.
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url   VARCHAR(255),
  category    VARCHAR(100),
  stock       INT           DEFAULT 100,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 3. CART TABLE
-- Stores items in a user's shopping cart.
-- Each row = one product in one user's cart.
-- Uses a unique constraint to prevent duplicate
-- entries for the same user + product pair.
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  UNIQUE KEY  unique_user_product (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 4. ORDERS TABLE
-- Stores placed orders with customer details.
-- ============================================
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
) ENGINE=InnoDB;

-- ============================================
-- 5. ORDER_ITEMS TABLE
-- Stores individual products within an order.
-- Links orders to the products they contain.
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           NOT NULL,
  product_id  INT           NOT NULL,
  quantity    INT           NOT NULL,
  price       DECIMAL(10,2) NOT NULL,           -- price at time of purchase
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA: 15 Grocery Products
-- ============================================
INSERT INTO products (name, price, description, image_url, category, stock) VALUES
  ('Basmati Rice (1kg)',   90.00,  'Premium long-grain basmati rice, aged for rich aroma and fluffy texture.',           'rice.jpg',      'Grains & Staples', 100),
  ('Wheat Flour (5kg)',   250.00,  'Finely ground whole wheat flour, perfect for chapatis, rotis, and baking.',          'flour.jpg',     'Grains & Staples', 100),
  ('Milk (500ml)',         30.00,  'Farm-fresh pasteurized toned milk, packed with essential nutrients.',                 'milk.jpg',      'Dairy',            150),
  ('Bread',                40.00,  'Soft and fresh white sandwich bread, ideal for toast and sandwiches.',                'bread.jpg',     'Bakery',           120),
  ('Eggs (12 pcs)',        75.00,  'Farm-fresh brown eggs, rich in protein and perfect for every meal.',                  'eggs.jpg',      'Dairy',            100),
  ('Potatoes (1kg)',       35.00,  'Fresh and firm potatoes, great for curries, fries, and snacks.',                      'potatoes.jpg',  'Vegetables',       200),
  ('Onions (1kg)',         40.00,  'Premium quality onions, essential for everyday Indian cooking.',                       'onions.jpg',    'Vegetables',       200),
  ('Tomatoes (1kg)',       50.00,  'Ripe and juicy tomatoes, perfect for gravies, salads, and sauces.',                   'tomatoes.jpg',  'Vegetables',       180),
  ('Bananas (1 dozen)',    60.00,  'Sweet and ripe yellow bananas, loaded with potassium and energy.',                    'bananas.jpg',   'Fruits',           150),
  ('Apples (1kg)',        180.00,  'Crisp and juicy Shimla apples, a healthy and delicious snack.',                       'apples.jpg',    'Fruits',           100),
  ('Cooking Oil (1L)',    150.00,  'Refined sunflower cooking oil, light and heart-healthy for daily use.',               'oil.jpg',       'Oils & Spices',    100),
  ('Sugar (1kg)',          55.00,  'Fine-grain white sugar, ideal for beverages, desserts, and cooking.',                 'sugar.jpg',     'Grains & Staples', 150),
  ('Salt (1kg)',           25.00,  'Iodized table salt, an essential kitchen staple for every household.',                'salt.jpg',      'Grains & Staples', 200),
  ('Biscuits Pack',        20.00,  'Crunchy and delicious butter biscuits, perfect with tea or coffee.',                  'biscuits.jpg',  'Snacks',           250),
  ('Tea Powder (250g)',   120.00,  'Premium Assam tea powder, delivers a strong and aromatic cup every time.',            'tea.jpg',       'Beverages',        130);
