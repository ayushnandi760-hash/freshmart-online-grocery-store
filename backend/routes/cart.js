// ============================================
// Cart Routes
// ============================================
// All routes require authentication (JWT).
//
// POST   /api/cart/add     — Add item to cart
// GET    /api/cart         — Get current user's cart
// PUT    /api/cart/update  — Update item quantity
// DELETE /api/cart/remove  — Remove item from cart
// ============================================

const express    = require('express');
const router     = express.Router();
const verifyToken = require('../middleware/auth');
const cartController = require('../controllers/cartController');

// All cart routes are protected
router.use(verifyToken);

router.post('/add',      cartController.addToCart);
router.get('/',          cartController.getCart);
router.put('/update',    cartController.updateCart);
router.delete('/remove', cartController.removeFromCart);

module.exports = router;
