// ============================================
// Authentication Controller
// ============================================
// Handles user registration and login with full
// input validation, bcrypt hashing, and JWT tokens.
//
// register() — Validates input → checks for
//              duplicate email → hashes password
//              (bcrypt, 10 rounds) → inserts user
//              → returns JWT + user data.
//
// login()    — Validates input → finds user by
//              email → compares password hash
//              → returns JWT + user data.
// ============================================

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
require('dotenv').config();

// ── Constants ──────────────────────────────────
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Helper: Generate JWT ───────────────────────
// Encodes the user's id, name, and email into a
// signed token that expires per JWT_EXPIRES_IN.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── Helper: Validate Registration Input ────────
// Returns an error message string if invalid,
// or null if all fields are valid.
function validateRegisterInput(name, email, password) {
  if (!name || !email || !password) {
    return 'All fields are required: name, email, and password.';
  }

  // Name: at least 2 characters
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long.';
  }

  // Email: basic format check
  if (!EMAIL_REGEX.test(email)) {
    return 'Please provide a valid email address.';
  }

  // Password: at least 6 characters
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }

  return null; // All valid
}

// ── Helper: Validate Login Input ───────────────
function validateLoginInput(email, password) {
  if (!email || !password) {
    return 'Email and password are required.';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Please provide a valid email address.';
  }

  return null; // All valid
}

// ════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════
// Request body: { name, email, password }
// Response:     { success, message, token, user }
// ════════════════════════════════════════════════
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── 1. Validate input ──────────────────────
    const validationError = validateRegisterInput(name, email, password);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // ── 2. Check for duplicate email ───────────
    const existingUser = await User.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // ── 3. Hash the password ───────────────────
    // bcrypt generates a unique salt and hashes in
    // one step. 10 rounds ≈ ~10 hashes/sec (secure
    // but not slow enough to hurt UX).
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── 4. Insert the user into the database ───
    const newUser = await User.create(
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword
    );

    // ── 5. Generate JWT ────────────────────────
    const token = generateToken(newUser);

    // ── 6. Return success response ─────────────
    console.log(`✅ New user registered: ${newUser.email} (ID: ${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id:    newUser.id,
        name:  newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error.message);

    // Handle MySQL duplicate entry (race condition safety)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════
// Request body: { email, password }
// Response:     { success, message, token, user }
// ════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── 1. Validate input ──────────────────────
    const validationError = validateLoginInput(email, password);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // ── 2. Find user by email ──────────────────
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Intentionally vague message to prevent
      // email enumeration attacks.
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // ── 3. Compare password with stored hash ───
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // ── 4. Generate JWT ────────────────────────
    const token = generateToken(user);

    // ── 5. Return success response ─────────────
    console.log(`✅ User logged in: ${user.email} (ID: ${user.id})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

module.exports = { register, login };
