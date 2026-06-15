// ============================================
// Shared Navbar Component
// ============================================
// Dynamically injects the navbar into the page
// and handles auth state (Login vs User menu),
// search functionality, and cart badge updates.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  updateCartBadge();
  setupSearch();
});

function renderNavbar() {
  const user = api.getUser();
  const isLoggedIn = !!user;

  // Render auth actions based on login state
  const authHtml = isLoggedIn ? `
    <div class="user-greeting">Hi, <strong>${user.name.split(' ')[0]}</strong></div>
    <button onclick="api.logout()" class="nav-btn nav-btn-outline">
      Logout
    </button>
  ` : `
    <a href="/login.html" class="nav-btn nav-btn-outline">Login</a>
    <a href="/register.html" class="nav-btn nav-btn-primary">Sign Up</a>
  `;

  const navbarHtml = `
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <!-- Logo -->
        <a href="/index.html" class="navbar-logo">
          <div class="logo-icon">🥬</div>
          FreshMart
        </a>

        <!-- Search Bar -->
        <div class="navbar-search">
          <span class="search-icon">🔍</span>
          <form id="nav-search-form" onsubmit="handleSearch(event)">
            <input type="text" id="nav-search-input" placeholder="Search for groceries, fruits, vegetables..." autocomplete="off">
          </form>
        </div>

        <!-- Actions -->
        <div class="navbar-actions">
          ${authHtml}
          
          <a href="/cart.html" class="cart-btn">
            <span class="cart-icon">🛒</span>
            <span>Cart</span>
            <div id="cart-badge" class="cart-badge hidden">0</div>
          </a>
        </div>
      </div>
    </nav>
  `;

  // Insert navbar at the top of the body
  document.body.insertAdjacentHTML('afterbegin', navbarHtml);

  // Add scroll effect
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.add('scrolled');
    }
  });
}

// ── Search Handling ────────────────────────────
function setupSearch() {
  // Pre-fill search input if on search results page
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('search');
  if (query) {
    setTimeout(() => {
      const input = document.getElementById('nav-search-input');
      if (input) input.value = query;
    }, 100);
  }
}

function handleSearch(e) {
  e.preventDefault();
  const input = document.getElementById('nav-search-input');
  if (!input) return;
  
  const query = input.value.trim();
  if (query) {
    window.location.href = `/index.html?search=${encodeURIComponent(query)}`;
  } else {
    window.location.href = '/index.html';
  }
}

// ── Cart Badge Update ──────────────────────────
async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  if (!api.getToken()) {
    badge.classList.add('hidden');
    return;
  }

  try {
    const { status, data } = await api.get('/cart');
    if (status === 200 && data.success) {
      const count = data.itemCount || 0;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
        
        // Add pop animation class, then remove it
        badge.style.animation = 'none';
        badge.offsetHeight; // trigger reflow
        badge.style.animation = null;
      } else {
        badge.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to update cart badge');
  }
}

// Attach functions to window so they can be called from HTML onclick attributes
window.handleSearch = handleSearch;
window.updateCartBadge = updateCartBadge;
