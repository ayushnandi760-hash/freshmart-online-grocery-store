// ============================================
// Cart Model
// ============================================
// Encapsulates all database operations for the
// shopping cart. Each user has their own cart,
// stored as rows in the `cart` table with a
// UNIQUE(user_id, product_id) constraint.
//
// Methods:
//   addItem(userId, productId, qty)    — Upsert item
//   getItems(userId)                   — Full cart with product details
//   updateQuantity(userId, productId, qty) — Set quantity
//   removeItem(userId, productId)      — Delete one item
//   clear(userId)                      — Empty entire cart
//   getItemCount(userId)               — Total items in cart
// ============================================

const { pool } = require('../config/db');

const Cart = {
  // ── Add item (upsert) ────────────────────────
  // If the product is already in the user's cart,
  // INCREMENT the quantity instead of inserting a
  // duplicate. This uses MySQL's ON DUPLICATE KEY
  // UPDATE on the (user_id, product_id) unique key.
  async addItem(userId, productId, quantity = 1) {
    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [userId, productId, quantity, quantity]
    );
  },

  // ── Get all cart items with product details ───
  // JOINs the cart table with products to return
  // complete product info + quantity + subtotal.
  // Results are ordered by cart insertion order.
  async getItems(userId) {
    const [rows] = await pool.query(
      `SELECT
         c.id          AS cart_id,
         c.product_id,
         c.quantity,
         p.name,
         p.price,
         p.image_url,
         p.stock,
         p.category,
         ROUND(p.price * c.quantity, 2) AS subtotal
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.id ASC`,
      [userId]
    );
    return rows;
  },

  // ── Update quantity for a specific item ───────
  // Sets the quantity to an exact value (not increment).
  // Returns true if a row was actually updated.
  async updateQuantity(userId, productId, quantity) {
    const [result] = await pool.query(
      `UPDATE cart
       SET quantity = ?
       WHERE user_id = ? AND product_id = ?`,
      [quantity, userId, productId]
    );
    return result.affectedRows > 0;
  },

  // ── Remove a single item from the cart ────────
  // Deletes the row for this user + product pair.
  // Returns true if a row was actually deleted.
  async removeItem(userId, productId) {
    const [result] = await pool.query(
      `DELETE FROM cart
       WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );
    return result.affectedRows > 0;
  },

  // ── Clear the entire cart for a user ──────────
  // Called after an order is placed to empty the cart.
  async clear(userId) {
    await pool.query(
      'DELETE FROM cart WHERE user_id = ?',
      [userId]
    );
  },

  // ── Count total distinct items in the cart ────
  // Used for the cart badge count on the frontend.
  async getItemCount(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM cart WHERE user_id = ?',
      [userId]
    );
    return rows[0].count;
  }
};

module.exports = Cart;
