// ============================================
// Product Model
// ============================================
// Encapsulates all database operations related
// to the products table. Controllers call these
// methods instead of writing raw SQL directly.
//
// Methods:
//   findAll(filters)       — List products with optional search/category/sort
//   findById(id)           — Get single product by ID
//   getCategories()        — Get all distinct categories
//   updateStock(id, qty)   — Decrease stock after order
// ============================================

const { pool } = require('../config/db');

const Product = {
  // ── Find all products with optional filters ──
  // Supports:
  //   search   — matches product name (LIKE %term%)
  //   category — exact category match
  //   sort     — 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'
  //   limit    — max number of results
  //   offset   — pagination offset
  async findAll({ search, category, sort, limit, offset } = {}) {
    let sql    = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // ── Search filter (match product name) ─────
    if (search && search.trim()) {
      sql += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    // ── Category filter ────────────────────────
    if (category && category.trim()) {
      sql += ' AND category = ?';
      params.push(category.trim());
    }

    // ── Only in-stock products ─────────────────
    sql += ' AND stock > 0';

    // ── Sorting ────────────────────────────────
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'name_asc':
        sql += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        sql += ' ORDER BY name DESC';
        break;
      case 'newest':
        sql += ' ORDER BY created_at DESC';
        break;
      default:
        sql += ' ORDER BY id ASC';   // default: insertion order
    }

    // ── Pagination ─────────────────────────────
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));

      if (offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // ── Find a single product by ID ──────────────
  // Returns the full product row or null if not found.
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // ── Get all distinct categories ──────────────
  // Used to populate the category filter on the
  // frontend. Returns an array of category strings.
  async getCategories() {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC'
    );
    return rows.map(row => row.category);
  },

  // ── Update stock quantity ────────────────────
  // Called after an order is placed to decrement
  // the stock. Uses a safety check to prevent
  // negative stock values.
  async updateStock(id, quantityPurchased) {
    const [result] = await pool.query(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantityPurchased, id, quantityPurchased]
    );
    return result.affectedRows > 0;
  },

  // ── Count total products (for pagination) ────
  async count({ search, category } = {}) {
    let sql    = 'SELECT COUNT(*) AS total FROM products WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      sql += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    if (category && category.trim()) {
      sql += ' AND category = ?';
      params.push(category.trim());
    }

    sql += ' AND stock > 0';

    const [rows] = await pool.query(sql, params);
    return rows[0].total;
  }
};

module.exports = Product;
