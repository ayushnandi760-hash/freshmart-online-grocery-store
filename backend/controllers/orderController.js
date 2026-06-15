// ============================================
// Order Controller
// ============================================
// Handles order placement and retrieval.
// All methods expect req.user to be set by the
// auth middleware (contains { id, name, email }).
//
// placeOrder() — Validates checkout fields,
//                creates order from cart items
//                (transactional), sends emails.
//
// getOrders()  — Returns user's order history
//                with items.
//
// getOrderById() — Returns a single order.
// ============================================

const Order       = require('../models/Order');
const Cart        = require('../models/Cart');
const transporter = require('../config/email');
require('dotenv').config();

// ── Validation Constants ───────────────────────
const PHONE_REGEX = /^[6-9]\d{9}$/;   // Indian 10-digit mobile

// ════════════════════════════════════════════════
// POST /api/orders
// ════════════════════════════════════════════════
// Request body: {
//   customer_name: "John Doe",
//   phone: "9876543210",
//   address: "123 Main St, City"
// }
//
// Flow:
//   1. Validate checkout fields
//   2. Fetch user's cart (must not be empty)
//   3. Calculate total from cart items
//   4. Create order + items in a transaction
//   5. Send confirmation email to customer
//   6. Send notification email to admin
//   7. Return order details
//
// Response: { success, message, order }
// ════════════════════════════════════════════════
const placeOrder = async (req, res) => {
  try {
    const userId    = req.user.id;
    const userEmail = req.user.email;
    const { customer_name, phone, address } = req.body;

    // ── 1. Validate checkout fields ────────────
    if (!customer_name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: customer_name, phone, and address.'
      });
    }

    if (customer_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Customer name must be at least 2 characters.'
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number.'
      });
    }

    if (address.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a complete delivery address (at least 10 characters).'
      });
    }

    // ── 2. Fetch user's cart ───────────────────
    const cartItems = await Cart.getItems(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add items before placing an order.'
      });
    }

    // ── 3. Calculate total ─────────────────────
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + parseFloat(item.subtotal);
    }, 0);
    const roundedTotal = Math.round(totalAmount * 100) / 100;

    // ── 4. Create order (transactional) ────────
    const orderData = {
      user_id:        userId,
      customer_name:  customer_name.trim(),
      phone:          phone.trim(),
      address:        address.trim(),
      total_amount:   roundedTotal,
      payment_method: 'COD'
    };

    const order = await Order.create(orderData, cartItems);

    console.log(`✅ Order #${order.id} placed by User ${userId} — ₹${roundedTotal}`);

    // ── 5. Send emails (non-blocking) ──────────
    // Emails are sent asynchronously so the user
    // gets an immediate response even if SMTP is slow.
    sendCustomerEmail(userEmail, order, cartItems, roundedTotal);
    sendAdminEmail(order, cartItems, roundedTotal);

    // ── 6. Return order details ────────────────
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id:             order.id,
        customer_name:  orderData.customer_name,
        phone:          orderData.phone,
        address:        orderData.address,
        total_amount:   roundedTotal,
        payment_method: 'COD',
        status:         'Pending',
        items:          cartItems.map(item => ({
          product_id: item.product_id,
          name:       item.name,
          quantity:   item.quantity,
          price:      item.price,
          subtotal:   item.subtotal,
          image_url:  item.image_url
        }))
      }
    });

  } catch (error) {
    console.error('❌ Place order error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// GET /api/orders
// ════════════════════════════════════════════════
// Returns the authenticated user's order history,
// sorted newest-first. Each order includes its
// items with product details.
//
// Response: { success, count, orders: [...] }
// ════════════════════════════════════════════════
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findByUserId(userId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('❌ Get orders error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders. Please try again.'
    });
  }
};

// ════════════════════════════════════════════════
// EMAIL: Customer Confirmation
// ════════════════════════════════════════════════
// Sends a beautifully formatted HTML email to the
// customer with their order details.
async function sendCustomerEmail(customerEmail, order, items, total) {
  try {
    const itemRows = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.subtotal}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛒 FreshMart</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Order Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #1e293b; font-size: 16px;">Hi <strong>${order.customer_name}</strong>,</p>
          <p style="color: #475569;">Thank you for your order! Here are your order details:</p>

          <!-- Order Info -->
          <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1e293b;"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin: 4px 0; color: #1e293b;"><strong>Payment:</strong> Cash on Delivery (COD)</p>
            <p style="margin: 4px 0; color: #1e293b;"><strong>Status:</strong> Pending</p>
            <p style="margin: 4px 0; color: #1e293b;"><strong>Delivery Address:</strong> ${order.address}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 13px; text-transform: uppercase;">Item</th>
                <th style="padding: 12px; text-align: center; color: #64748b; font-size: 13px; text-transform: uppercase;">Qty</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 13px; text-transform: uppercase;">Price</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 13px; text-transform: uppercase;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 14px; text-align: right; font-weight: bold; font-size: 16px; color: #1e293b;">Total:</td>
                <td style="padding: 14px; text-align: right; font-weight: bold; font-size: 16px; color: #22c55e;">₹${total}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #475569; font-size: 14px;">We'll deliver your order soon. Thank you for choosing FreshMart! 🥬</p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} FreshMart. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from:    `"FreshMart" <${process.env.SMTP_EMAIL}>`,
      to:      customerEmail,
      subject: `✅ Order Confirmed — #${order.id}`,
      html
    });

    console.log(`📧 Confirmation email sent to ${customerEmail}`);
  } catch (error) {
    // Don't crash the order flow if email fails
    console.error('⚠️  Customer email failed:', error.message);
  }
}

// ════════════════════════════════════════════════
// EMAIL: Admin Notification
// ════════════════════════════════════════════════
// Sends an email to the admin whenever a new
// order is placed.
async function sendAdminEmail(order, items, total) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('⚠️  ADMIN_EMAIL not set in .env — skipping admin notification');
      return;
    }

    const itemList = items.map(item =>
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${item.subtotal}</td>
      </tr>`
    ).join('');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔔 New Order Received!</h1>
        </div>

        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 4px 0;"><strong>Order ID:</strong> #${order.id}</p>
            <p style="margin: 4px 0;"><strong>Customer:</strong> ${order.customer_name}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${order.phone}</p>
            <p style="margin: 4px 0;"><strong>Address:</strong> ${order.address}</p>
            <p style="margin: 4px 0;"><strong>Payment:</strong> COD</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px; text-align: left; font-size: 13px; color: #64748b;">ITEM</th>
                <th style="padding: 10px; text-align: center; font-size: 13px; color: #64748b;">QTY</th>
                <th style="padding: 10px; text-align: right; font-size: 13px; color: #64748b;">PRICE</th>
                <th style="padding: 10px; text-align: right; font-size: 13px; color: #64748b;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>${itemList}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; color: #d97706; font-size: 18px;">₹${total}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">FreshMart Admin Notification</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from:    `"FreshMart Orders" <${process.env.SMTP_EMAIL}>`,
      to:      adminEmail,
      subject: `🔔 New Order #${order.id} — ₹${total} from ${order.customer_name}`,
      html
    });

    console.log(`📧 Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('⚠️  Admin email failed:', error.message);
  }
}

module.exports = { placeOrder, getOrders };
