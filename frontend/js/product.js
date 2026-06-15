// ============================================
// Product Detail Page Logic
// ============================================
// Reads the ?id= URL parameter, fetches the single
// product data, and handles the quantity selector
// + Add to Cart action.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    document.getElementById('product-loader').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
    return;
  }

  fetchProduct(productId);
});

async function fetchProduct(id) {
  try {
    const { status, data } = await api.get(`/products/${id}`);
    
    document.getElementById('product-loader').style.display = 'none';

    if (status === 200 && data.success && data.product) {
      renderProduct(data.product);
      document.getElementById('product-detail-container').style.display = 'block';
      
      // Update page title
      document.title = `${data.product.name} — FreshMart`;
    } else {
      document.getElementById('product-error').style.display = 'block';
    }
  } catch (error) {
    document.getElementById('product-loader').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
  }
}

function renderProduct(product) {
  const container = document.getElementById('product-card-inner');
  const isOutOfStock = product.stock < 1;
  const imageUrl = product.image_url ? `http://localhost:3000/images/${product.image_url}` : 'https://via.placeholder.com/400?text=No+Image';

  const stockBadge = isOutOfStock 
    ? `<div class="product-detail-stock out">❌ Out of Stock</div>`
    : `<div class="product-detail-stock">✅ In Stock (${product.stock} available)</div>`;

  const cartAction = isOutOfStock
    ? `<button class="detail-add-btn" style="background: var(--gray-400); cursor: not-allowed;" disabled>Currently Unavailable</button>`
    : `
      <div class="quantity-selector">
        <button class="qty-btn" onclick="updateQty(-1)">-</button>
        <div class="qty-value" id="qty-value">1</div>
        <button class="qty-btn" onclick="updateQty(1, ${product.stock})">+</button>
      </div>
      <button class="detail-add-btn" id="add-btn" onclick="addToCartDetail(${product.id})">
        Add to Cart — ₹<span id="btn-price">${product.price}</span>
      </button>
    `;

  container.innerHTML = `
    <div class="product-detail-image">
      <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400?text=Image+Not+Found'">
    </div>
    <div class="product-detail-info">
      <div class="product-detail-category">${product.category || 'Grocery'}</div>
      <h1 class="product-detail-name">${product.name}</h1>
      <div class="product-detail-price"><span class="currency">₹</span><span id="base-price">${product.price}</span></div>
      
      ${stockBadge}
      
      <p class="product-detail-desc">${product.description || 'No description available for this product.'}</p>
      
      ${cartAction}
    </div>
  `;
}

// Global variable for current selected quantity
let currentQty = 1;

function updateQty(change, maxStock) {
  const newQty = currentQty + change;
  if (newQty < 1) return;
  if (maxStock && newQty > maxStock) {
    showToast(`Only ${maxStock} items available in stock`, 'error');
    return;
  }
  
  currentQty = newQty;
  document.getElementById('qty-value').textContent = currentQty;
  
  // Update button price
  const basePrice = parseFloat(document.getElementById('base-price').textContent);
  const total = (basePrice * currentQty).toFixed(2);
  document.getElementById('btn-price').textContent = total;
}

async function addToCartDetail(productId) {
  // Check if logged in
  if (!api.getToken()) {
    showToast('Please login to add items to cart', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }

  const btn = document.getElementById('add-btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="btn-spinner" style="margin: 0 auto;"></div>';
  btn.style.pointerEvents = 'none';

  try {
    const { status, data } = await api.post('/cart/add', { 
      product_id: productId, 
      quantity: currentQty 
    });
    
    if (status === 200 && data.success) {
      showToast('Added to cart successfully!');
      updateCartBadge(); // from navbar.js
      
      // Reset qty back to 1
      currentQty = 1;
      document.getElementById('qty-value').textContent = currentQty;
      document.getElementById('btn-price').textContent = document.getElementById('base-price').textContent;
    } else {
      showToast(data.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  } finally {
    btn.innerHTML = originalHtml;
    btn.style.pointerEvents = 'auto';
  }
}

window.updateQty = updateQty;
window.addToCartDetail = addToCartDetail;
