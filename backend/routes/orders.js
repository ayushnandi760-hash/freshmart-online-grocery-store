// ============================================
// Order Routes
// ============================================
// All routes require authentication (JWT).
//
// POST /api/orders  — Place a new order
// GET  /api/orders  — Get user's order history
// ============================================

const express    = require('express');
const router     = express.Router();
const verifyToken = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// All order routes are protected
router.use(verifyToken);

router.post('/', orderController.placeOrder);
router.get('/',  orderController.getOrders);

module.exports = router;
