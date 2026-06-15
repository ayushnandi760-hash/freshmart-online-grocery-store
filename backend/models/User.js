// ============================================
// User Model
// ============================================
// Encapsulates all database operations related
// to the users table. Controllers call these
// methods instead of writing raw SQL directly.
//
// Methods:
//   findByEmail(email)       — Lookup user by email
//   findById(id)             — Lookup user by ID
//   create(name, email, hash)— Insert a new user
// ============================================

const { pool } = require('../config/db');

const User = {
  // ── Find a user by email ─────────────────────
  // Used during login (to verify credentials) and
  // registration (to check for duplicates).
  // Returns the full user row including the hashed
  // password, or null if not found.
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // ── Find a user by ID ────────────────────────
  // Used to fetch user profile data from the JWT
  // payload's id. Returns user WITHOUT password.
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // ── Create a new user ────────────────────────
  // Inserts a user with an already-hashed password.
  // Returns the full user object (id, name, email)
  // for immediate JWT generation.
  async create(name, email, hashedPassword) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Return the newly created user (without password)
    return {
      id: result.insertId,
      name,
      email
    };
  }
};

module.exports = User;
