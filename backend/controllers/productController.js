// ============================================
// Product Controller
// ============================================
// Handles all product catalog operations.
//
// getAll()         — Returns products with support
//                    for search, category filtering,
//                    sorting, and pagination.
//
// getById()        — Returns a single product by ID.
//
// getCategories()  — Returns all distinct product
//                    categories for the filter bar.
// ============================================

const Product = require('../models/Product');

// ════════════════════════════════════════════════
// GET /api/products
// ════════════════════════════════════════════════
// Query Parameters (all optional):
//   ?search=rice       — Filter by product name
//   ?category=Dairy    — Filter by category
//   ?sort=price_asc    — Sort order (price_asc, price_desc, name_asc, name_desc, newest)
//   ?limit=10          — Max results per page
//   ?offset=0          — Pagination offset
//
// Response: {
//   success: true,
//   count: 15,
//   total: 15,
//   products: [ ... ]
// }
// ════════════════════════════════════════════════
const getAll = async (req, res) => {
  try {
    // ── 1. Extract query parameters ────────────
    const { search, category, sort, limit, offset } = req.query;

    const filters = { search, category, sort, limit, offset };

    // ── 2. Fetch products from database ────────
    const products = await Product.findAll(filters);

    // ── 3. Get total count for pagination ──────
    const total = await Product.count({ search, category });

    // ── 4. Return response ─────────────────────
    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      products
    });

  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// GET /api/products/:id
// ════════════════════════════════════════════════
// URL Parameter:
//   :id — Product ID (integer)
//
// Response: {
//   success: true,
//   product: { id, name, price, ... }
// }
// ════════════════════════════════════════════════
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // ── 1. Validate ID is a number ─────────────
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID. Must be a number.'
      });
    }

    // ── 2. Fetch product from database ─────────
    const product = await Product.findById(parseInt(id, 10));

    // ── 3. Handle not found ────────────────────
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found.`
      });
    }

    // ── 4. Return product ──────────────────────
    return res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    console.error('❌ Error fetching product:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// GET /api/products/categories
// ════════════════════════════════════════════════
// Returns all distinct product categories.
//
// Response: {
//   success: true,
//   categories: ["Bakery", "Beverages", "Dairy", ...]
// }
// ════════════════════════════════════════════════
const getCategories = async (req, res) => {
  try {
    const categories = await Product.getCategories();

    return res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

module.exports = { getAll, getById, getCategories };
