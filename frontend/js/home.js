// ============================================
// Home Page Logic
// ============================================
// Fetches categories and products from the API.
// Handles search and category filtering via URL params.
// Manages "Add to Cart" functionality on product cards.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initHomePage();
});

// Category emojis mapping
const categoryEmojis = {
  'Grains & Staples': '🌾',
  'Dairy': '🥛',
  'Bakery': '🍞',
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Oils & Spices': '🏺',
  'Snacks': '🍪',
  'Beverages': '☕'
};

async function initHomePage() {
  // Read URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  const activeCategory = urlParams.get('category');

  // Update UI for search mode
  if (searchQuery) {
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('categories-section').style.display = 'none';
    
    const searchHeader = document.getElementById('search-header');
    searchHeader.style.display = 'flex';
    document.getElementById('search-subtitle').textContent = `Showing results for "${searchQuery}"`;
    document.getElementById('products-title').textContent = 'Search Results';
  }

  // Fetch data
  await fetchCategories(activeCategory);
  await fetchProducts(searchQuery, activeCategory);
}

// ── Fetch & Render Categories ───────────────────
async function fetchCategories(activeCategory) {
  const container = document.getElementById('categories-container');
  
  try {
    const { status, data } = await api.get('/products/categories');
    
    if (status === 200 && data.success) {
      // Add "All" category pill
      let html = `
        <a href="/" class="category-pill ${!activeCategory ? 'active' : ''}">
          <span class="cat-emoji">🌟</span> All
        </a>
      `;

      // Add dynamic categories
      data.categories.forEach(cat => {
        const isActive = activeCategory === cat;
        const emoji = categoryEmojis[cat] || '📦';
        html += `
          <a href="/index.html?category=${encodeURIComponent(cat)}" class="category-pill ${isActive ? 'active' : ''}">
            <span class="cat-emoji">${emoji}</span> ${cat}
          </a>
        `;
      });

      container.innerHTML = html;
    }
  } catch (error) {
    console.error('Failed to load categories');
  }
}

// ── Fetch & Render Products ─────────────────────
async function fetchProducts(searchQuery, activeCategory) {
  const grid = document.getElementById('products-grid');
  const loader = document.getElementById('products-loader');
  const emptyState = document.getElementById('products-empty');
  
  try {
    // Build query string
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (activeCategory) params.append('category', activeCategory);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const { status, data } = await api.get(`/products${queryString}`);
    
    // Hide loader
    loader.style.display = 'none';

    if (status === 200 && data.success) {
      if (data.products.length === 0) {
        emptyState.style.display = 'block';
        return;
      }

      // Update category title if applicable
      if (activeCategory) {
        document.getElementById('products-title').textContent = `${activeCategory} (${data.products.length})`;
      }

      let html = '';
      data.products.forEach(product => {
        const isOutOfStock = product.stock < 1;
        
        // Use a placeholder if image is missing
        const imageUrl = product.image_url ? `http://localhost:3000/images/${product.image_url}` : 'https://via.placeholder.com/200?text=No+Image';

        html += `
          <div class="product-card" onclick="window.location.href='/product.html?id=${product.id}'">
            <div class="product-card-image">
              <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/200?text=Image+Not+Found'">
            </div>
            <div class="product-card-body">
              <div class="product-card-category">${product.category || 'Grocery'}</div>
              <h3 class="product-card-name">${product.name}</h3>
              <p class="product-card-desc">${product.description}</p>
              <div class="product-card-footer">
                <div class="product-card-price"><span class="currency">₹</span>${product.price}</div>
                ${isOutOfStock 
                  ? `<span class="stock-out">Out of Stock</span>` 
                  : `<button class="add-to-cart-btn" onclick="addToCart(event, ${product.id})">
                       <span>+</span> Add
                     </button>`
                }
              </div>
            </div>
          </div>
        `;
      });

      grid.innerHTML = html;
    } else {
      showToast('Failed to load products', 'error');
    }
  } catch (error) {
    loader.style.display = 'none';
    showToast('Network error loading products', 'error');
  }
}

// ── Add to Cart Handler ─────────────────────────
async function addToCart(event, productId) {
  // Prevent click from navigating to product detail page
  event.stopPropagation();

  // Check if logged in
  if (!api.getToken()) {
    showToast('Please login to add items to cart', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }

  // Change button state to loading
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="btn-spinner"></div>';
  btn.style.pointerEvents = 'none';

  try {
    const { status, data } = await api.post('/cart/add', { product_id: productId, quantity: 1 });
    
    if (status === 200 && data.success) {
      showToast('Added to cart!');
      updateCartBadge(); // from navbar.js
    } else {
      showToast(data.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  } finally {
    // Restore button state
    btn.innerHTML = originalText;
    btn.style.pointerEvents = 'auto';
  }
}

// Expose to window for inline onclick
window.addToCart = addToCart;
