// ============================================
// Product Routes
// ============================================
// GET /api/products             — List all products
//     ?search=keyword           — Filter by name
//     ?category=Dairy           — Filter by category
//     ?sort=price_asc           — Sort results
//     ?limit=10&offset=0        — Pagination
//
// GET /api/products/categories  — Get all categories
// GET /api/products/:id         — Get single product
// ============================================

const express = require('express');
const router  = express.Router();
const productController = require('../controllers/productController');

// Get all distinct categories (must be BEFORE /:id to avoid matching "categories" as an ID)
router.get('/categories', productController.getCategories);

// Get all products (supports search, category, sort, pagination)
router.get('/',    productController.getAll);

// Get a single product by ID
router.get('/:id', productController.getById);

module.exports = router;
