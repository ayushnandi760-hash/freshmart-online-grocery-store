// ============================================
// Cart Controller
// ============================================
// Handles shopping cart CRUD operations.
// All methods expect req.user to be set by the
// auth middleware (contains { id, name, email }).
//
// addToCart()      — Add product or increment qty
// getCart()        — Full cart with totals
// updateCart()     — Set item quantity
// removeFromCart() — Remove one item
// ============================================

const Cart    = require('../models/Cart');
const Product = require('../models/Product');

// ════════════════════════════════════════════════
// POST /api/cart/add
// ════════════════════════════════════════════════
// Request body: { product_id, quantity? }
//   - product_id (required): ID of the product
//   - quantity (optional): defaults to 1
//
// If the product is already in the cart, the
// quantity is INCREMENTED (not replaced).
//
// Response: { success, message, cart, cartTotal }
// ════════════════════════════════════════════════
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // ── 1. Validate product_id ─────────────────
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required.'
      });
    }

    // ── 2. Validate quantity ───────────────────
    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1.'
      });
    }

    // ── 3. Check product exists & is in stock ──
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is currently out of stock.`
      });
    }

    // ── 4. Add to cart (upsert) ────────────────
    await Cart.addItem(userId, product_id, qty);

    // ── 5. Return updated cart ─────────────────
    const cart = await Cart.getItems(userId);
    const cartTotal = calculateTotal(cart);

    console.log(`🛒 User ${userId}: Added ${qty}x "${product.name}" to cart`);

    return res.status(200).json({
      success: true,
      message: `${product.name} added to cart!`,
      cart,
      cartTotal,
      itemCount: cart.length
    });

  } catch (error) {
    console.error('❌ Add to cart error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// GET /api/cart
// ════════════════════════════════════════════════
// Returns the full cart for the authenticated user.
// Each item includes product details + subtotal.
// Also returns the cart total and item count.
//
// Response: {
//   success, cart: [...], cartTotal, itemCount
// }
// ════════════════════════════════════════════════
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── 1. Fetch cart items with product details ─
    const cart = await Cart.getItems(userId);

    // ── 2. Calculate total ─────────────────────
    const cartTotal = calculateTotal(cart);

    // ── 3. Return response ─────────────────────
    return res.status(200).json({
      success: true,
      cart,
      cartTotal,
      itemCount: cart.length
    });

  } catch (error) {
    console.error('❌ Get cart error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cart. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// PUT /api/cart/update
// ════════════════════════════════════════════════
// Request body: { product_id, quantity }
//   - quantity: the NEW quantity (replaces old)
//   - If quantity is 0 or less, the item is removed.
//
// Response: { success, message, cart, cartTotal }
// ════════════════════════════════════════════════
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    // ── 1. Validate inputs ─────────────────────
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required.'
      });
    }

    if (isNaN(qty)) {
      return res.status(400).json({
        success: false,
        message: 'quantity is required and must be a number.'
      });
    }

    // ── 2. If quantity <= 0, remove the item ───
    if (qty <= 0) {
      await Cart.removeItem(userId, product_id);
      const cart = await Cart.getItems(userId);
      const cartTotal = calculateTotal(cart);

      return res.status(200).json({
        success: true,
        message: 'Item removed from cart.',
        cart,
        cartTotal,
        itemCount: cart.length
      });
    }

    // ── 3. Check stock availability ────────────
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of ${product.name} available.`
      });
    }

    // ── 4. Update the quantity ─────────────────
    const updated = await Cart.updateQuantity(userId, product_id, qty);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart.'
      });
    }

    // ── 5. Return updated cart ─────────────────
    const cart = await Cart.getItems(userId);
    const cartTotal = calculateTotal(cart);

    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully!',
      cart,
      cartTotal,
      itemCount: cart.length
    });

  } catch (error) {
    console.error('❌ Update cart error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// DELETE /api/cart/remove
// ════════════════════════════════════════════════
// Request body: { product_id }
//
// Response: { success, message, cart, cartTotal }
// ════════════════════════════════════════════════
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    // ── 1. Validate product_id ─────────────────
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required.'
      });
    }

    // ── 2. Remove the item ─────────────────────
    const removed = await Cart.removeItem(userId, product_id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart.'
      });
    }

    // ── 3. Return updated cart ─────────────────
    const cart = await Cart.getItems(userId);
    const cartTotal = calculateTotal(cart);

    console.log(`🛒 User ${userId}: Removed product ${product_id} from cart`);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      cart,
      cartTotal,
      itemCount: cart.length
    });

  } catch (error) {
    console.error('❌ Remove from cart error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// Helper: Calculate Cart Total
// ════════════════════════════════════════════════
// Sums up all item subtotals and rounds to 2
// decimal places to avoid floating-point drift.
function calculateTotal(cartItems) {
  const total = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.subtotal);
  }, 0);
  return Math.round(total * 100) / 100;
}

module.exports = { addToCart, getCart, updateCart, removeFromCart };
