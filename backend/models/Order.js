// ============================================
// Order Model
// ============================================
// Encapsulates all database operations for orders
// and order_items tables. Uses MySQL transactions
// to ensure atomic order creation.
//
// Methods:
//   create(orderData, cartItems)  — Atomically create order + items + clear cart
//   findByUserId(userId)          — Get user's order history
//   findById(orderId)             — Get single order with items
// ============================================

const { pool } = require('../config/db');

const Order = {
  // ── Create a new order (transactional) ────────
  // This method performs 4 operations atomically:
  //   1. INSERT into orders
  //   2. INSERT each item into order_items
  //   3. Decrement product stock for each item
  //   4. Clear the user's cart
  // If any step fails, everything is rolled back.
  async create(orderData, cartItems) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // ── Step 1: Insert the order ─────────────
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, customer_name, phone, address, total_amount, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderData.user_id,
          orderData.customer_name,
          orderData.phone,
          orderData.address,
          orderData.total_amount,
          orderData.payment_method || 'COD',
          'Pending'
        ]
      );

      const orderId = orderResult.insertId;

      // ── Step 2: Insert order items ───────────
      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price]
        );
      }

      // ── Step 3: Decrement product stock ──────
      for (const item of cartItems) {
        await connection.query(
          `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
          [item.quantity, item.product_id, item.quantity]
        );
      }

      // ── Step 4: Clear the user's cart ────────
      await connection.query(
        'DELETE FROM cart WHERE user_id = ?',
        [orderData.user_id]
      );

      // ── Commit transaction ───────────────────
      await connection.commit();

      // Return the complete order
      return {
        id: orderId,
        ...orderData,
        status: 'Pending',
        items: cartItems
      };

    } catch (error) {
      // Rollback on any failure
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // ── Get all orders for a user ─────────────────
  // Returns orders sorted newest-first, each with
  // its items array containing product details.
  async findByUserId(userId) {
    // 1. Fetch all orders
    const [orders] = await pool.query(
      `SELECT * FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // 2. For each order, fetch its items with product info
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT
           oi.id,
           oi.product_id,
           oi.quantity,
           oi.price,
           p.name,
           p.image_url,
           ROUND(oi.price * oi.quantity, 2) AS subtotal
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [order.id]
      );
      order.items = items;
    }

    return orders;
  },

  // ── Get a single order by ID ──────────────────
  // Returns the order with its items, or null if
  // not found. Includes a user_id check for security.
  async findById(orderId, userId) {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) return null;

    const order = orders[0];

    // Fetch order items with product details
    const [items] = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         oi.quantity,
         oi.price,
         p.name,
         p.image_url,
         ROUND(oi.price * oi.quantity, 2) AS subtotal
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderId]
    );

    order.items = items;
    return order;
  }
};

module.exports = Order;
