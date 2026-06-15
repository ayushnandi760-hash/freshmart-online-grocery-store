// ============================================
// Authentication Routes
// ============================================
// POST /api/auth/register  — Create a new account
// POST /api/auth/login     — Login and receive JWT
// ============================================

const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login with email & password
router.post('/login', authController.login);

module.exports = router;
