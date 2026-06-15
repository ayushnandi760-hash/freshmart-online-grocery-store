// ============================================
// API Client Utility
// ============================================
// Handles all HTTP requests to the backend.
// Automatically attaches the JWT token to protected routes.
// ============================================

const API_BASE = 'http://localhost:3000/api';

const api = {
  // Get the auth token from localStorage
  getToken() {
    return localStorage.getItem('freshmart_token');
  },

  // Save the token to localStorage
  setToken(token) {
    localStorage.setItem('freshmart_token', token);
  },

  // Save user data
  setUser(user) {
    localStorage.setItem('freshmart_user', JSON.stringify(user));
  },

  // Get current user
  getUser() {
    const user = localStorage.getItem('freshmart_user');
    return user ? JSON.parse(user) : null;
  },

  // Clear auth data (Logout)
  logout() {
    localStorage.removeItem('freshmart_token');
    localStorage.removeItem('freshmart_user');
    window.location.href = '/login.html';
  },

  // Helper to build headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Universal fetch wrapper
  async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE}${endpoint}`;
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      };

      const response = await fetch(url, config);
      const data = await response.json();

      // Handle token expiration globally
      if (response.status === 401 && data.message.includes('expired')) {
        this.logout();
        return null;
      }

      return { status: response.status, data };
    } catch (error) {
      console.error('API Request Error:', error);
      return { status: 500, data: { success: false, message: 'Network error. Please try again.' } };
    }
  },

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  async delete(endpoint, body) {
    return this.request(endpoint, { method: 'DELETE', body: JSON.stringify(body) });
  }
};

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : '❌';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}
