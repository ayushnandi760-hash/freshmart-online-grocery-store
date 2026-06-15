// ============================================
// FreshMart — Express Server Entry Point
// ============================================
// This is the main server file that:
//   1. Loads environment variables
//   2. Initializes Express with middleware
//   3. Tests the MySQL connection
//   4. Auto-creates tables & seeds data
//   5. Mounts API route groups
//   6. Serves the frontend as static files
//   7. Starts listening on the configured port
// ============================================

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

// ── Internal modules ───────────────────────────
const { testConnection }  = require('./config/db');
const setupDatabase       = require('./models/setup');

// ── Route modules (to be implemented) ──────────
const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');

// ── Initialize Express app ─────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ──────────────────────────
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins (development-friendly)
app.use(cors());

// ── Serve Frontend Static Files ────────────────
// The frontend/ folder sits one level up from backend/
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve product images explicitly
app.use('/images', express.static(path.join(__dirname, '..', 'frontend', 'images')));

// ── Mount API Routes ───────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);

// ── Health Check Endpoint ──────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FreshMart API is running 🥬',
    timestamp: new Date().toISOString()
  });
});

// ── Catch-all: serve index.html for unknown routes ──
// (Supports client-side page navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Global Error Handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ── Start Server ───────────────────────────────
async function startServer() {
  try {
    // 1. Test database connection
    await testConnection();

    // 2. Create tables & seed data
    await setupDatabase();

    // 3. Start listening
    app.listen(PORT, () => {
      console.log(`🚀 FreshMart server running at http://localhost:${PORT}`);
      console.log(`📁 Serving frontend from: ${path.join(__dirname, '..', 'frontend')}`);
      console.log('');
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
