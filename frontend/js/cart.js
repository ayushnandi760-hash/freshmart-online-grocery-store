// ============================================
// Cart Page Logic
// ============================================
// Fetches the user's cart, displays items,
// and handles quantity updates and removals.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  if (!api.getToken()) {
    window.location.href = '/login.html';
    return;
  }

  fetchCart();
});

async function fetchCart() {
  const loader = document.getElementById('cart-loader');
  const emptyState = document.getElementById('cart-empty');
  const content = document.getElementById('cart-content');

  try {
    const { status, data } = await api.get('/cart');
    
    loader.style.display = 'none';

    if (status === 200 && data.success) {
      if (data.cart.length === 0) {
        emptyState.style.display = 'block';
        content.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        content.style.display = 'block';
        renderCart(data.cart, data.cartTotal, data.itemCount);
      }
      
      // Update badge via navbar.js function
      updateCartBadge();
    } else {
      showToast('Failed to load cart', 'error');
    }
  } catch (error) {
    loader.style.display = 'none';
    showToast('Network error loading cart', 'error');
  }
}

function renderCart(cartItems, cartTotal, itemCount) {
  const container = document.getElementById('cart-items-container');
  let html = '';

  cartItems.forEach(item => {
    const imageUrl = item.image_url ? `http://localhost:3000/images/${item.image_url}` : 'https://via.placeholder.com/100?text=No+Image';
    
    html += `
      <div class="cart-item" id="item-${item.product_id}">
        <div class="cart-item-image">
          <img src="${imageUrl}" alt="${item.name}">
        </div>
        
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price}</div>
        </div>

        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQty(${item.product_id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'style="color: var(--red-500);"' : ''}>
            ${item.quantity <= 1 ? '🗑️' : '-'}
          </button>
          <div class="qty-value">${item.quantity}</div>
          <button class="qty-btn" onclick="updateCartQty(${item.product_id}, ${item.quantity + 1}, ${item.stock})">+</button>
        </div>

        <div class="cart-item-subtotal">₹${item.subtotal}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update Summary
  document.getElementById('summary-count').textContent = itemCount;
  document.getElementById('summary-subtotal').textContent = cartTotal.toFixed(2);
  document.getElementById('summary-total').textContent = cartTotal.toFixed(2);
}

// Global flag to prevent spam clicking
let isUpdating = false;

async function updateCartQty(productId, newQty, maxStock) {
  if (isUpdating) return;
  
  if (maxStock && newQty > maxStock) {
    showToast(`Only ${maxStock} items available`, 'error');
    return;
  }

  isUpdating = true;

  try {
    // If newQty <= 0, the API will handle it as a removal
    const endpoint = newQty <= 0 ? '/cart/remove' : '/cart/update';
    const method = newQty <= 0 ? 'delete' : 'put';
    
    const body = newQty <= 0 
      ? { product_id: productId } 
      : { product_id: productId, quantity: newQty };

    const { status, data } = await api[method](endpoint, body);

    if (status === 200 && data.success) {
      if (data.cart.length === 0) {
        document.getElementById('cart-empty').style.display = 'block';
        document.getElementById('cart-content').style.display = 'none';
      } else {
        renderCart(data.cart, data.cartTotal, data.itemCount);
      }
      updateCartBadge(); // from navbar.js
    } else {
      showToast(data.message || 'Failed to update cart', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  } finally {
    isUpdating = false;
  }
}

// Expose to window for inline onclick
window.updateCartQty = updateCartQty;
