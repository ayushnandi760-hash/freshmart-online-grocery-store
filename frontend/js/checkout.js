// ============================================
// Checkout Page Logic
// ============================================
// Loads the user's cart for the summary sidebar.
// Validates the delivery form and places the order
// via the API.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to login if not authenticated
  const user = api.getUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Pre-fill name from auth context
  const nameInput = document.getElementById('name');
  if (nameInput && user.name) {
    nameInput.value = user.name;
  }

  fetchCheckoutSummary();

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckout);
  }
});

async function fetchCheckoutSummary() {
  const loader = document.getElementById('checkout-loader');
  const content = document.getElementById('checkout-content');

  try {
    const { status, data } = await api.get('/cart');
    
    if (status === 200 && data.success) {
      if (data.cart.length === 0) {
        // Redirect empty carts back to home
        showToast('Your cart is empty', 'error');
        setTimeout(() => { window.location.href = '/index.html'; }, 1000);
        return;
      }

      renderSummary(data.cart, data.cartTotal);
      
      loader.style.display = 'none';
      content.style.display = 'block';
    } else {
      showToast('Failed to load cart summary', 'error');
    }
  } catch (error) {
    showToast('Network error loading summary', 'error');
  }
}

function renderSummary(cartItems, cartTotal) {
  const container = document.getElementById('summary-items-list');
  let html = '';

  cartItems.forEach(item => {
    html += `
      <div class="summary-item">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-qty">x${item.quantity}</div>
        <div class="summary-item-price">₹${item.subtotal}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  document.getElementById('summary-subtotal').textContent = cartTotal.toFixed(2);
  document.getElementById('summary-total').textContent = cartTotal.toFixed(2);
}

// ── Form Validation & Submission ─────────────────
function clearErrors() {
  document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
  const generalError = document.getElementById('form-general-error');
  if (generalError) {
    generalError.style.display = 'none';
    generalError.textContent = '';
  }
}

function showError(fieldId, message) {
  const group = document.getElementById(`group-${fieldId}`);
  if (group) {
    group.classList.add('error');
    const errorEl = document.getElementById(`error-${fieldId}`);
    if (errorEl) errorEl.textContent = message;
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const btn = document.getElementById('submit-btn');

  // Client Validation
  let hasError = false;
  if (!name || name.length < 2) { 
    showError('name', 'Name must be at least 2 characters'); 
    hasError = true; 
  }
  
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) { 
    showError('phone', 'Please enter a valid 10-digit mobile number'); 
    hasError = true; 
  }
  
  if (!address || address.length < 10) { 
    showError('address', 'Please provide a complete delivery address'); 
    hasError = true; 
  }

  if (hasError) return;

  // Set loading state
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="btn-spinner"></div> Placing Order...';
  btn.disabled = true;

  try {
    const { status, data } = await api.post('/orders', { 
      customer_name: name, 
      phone, 
      address 
    });

    if (status === 201 && data.success) {
      // Save order details to sessionStorage for the confirmation page
      sessionStorage.setItem('freshmart_last_order', JSON.stringify(data.order));
      
      // Redirect to confirmation
      window.location.href = '/confirmation.html';
    } else {
      const generalError = document.getElementById('form-general-error');
      generalError.style.display = 'block';
      generalError.textContent = data.message || 'Failed to place order';
    }
  } catch (error) {
    const generalError = document.getElementById('form-general-error');
    generalError.style.display = 'block';
    generalError.textContent = 'Network error. Please try again.';
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
