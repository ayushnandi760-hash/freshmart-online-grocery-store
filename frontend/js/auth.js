// ============================================
// Authentication Logic
// ============================================
// Handles form submission, validation, and API
// requests for both Login and Register pages.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // If user is already logged in, redirect to home
  if (api.getToken()) {
    window.location.href = '/index.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

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

function showGeneralError(message) {
  const generalError = document.getElementById('form-general-error');
  if (generalError) {
    generalError.style.display = 'block';
    generalError.textContent = message;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('submit-btn');

  // Basic client validation
  let hasError = false;
  if (!email) { showError('email', 'Email is required'); hasError = true; }
  if (!password) { showError('password', 'Password is required'); hasError = true; }
  if (hasError) return;

  // Set loading state
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="btn-spinner"></div>';
  btn.disabled = true;

  try {
    const { status, data } = await api.post('/auth/login', { email, password });

    if (status === 200 && data.success) {
      // Save token and user info
      api.setToken(data.token);
      api.setUser(data.user);
      
      // Redirect to home
      window.location.href = '/index.html';
    } else {
      showGeneralError(data.message || 'Login failed');
    }
  } catch (error) {
    showGeneralError('Network error. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('submit-btn');

  // Basic client validation
  let hasError = false;
  if (!name || name.length < 2) { showError('name', 'Name must be at least 2 characters'); hasError = true; }
  if (!email) { showError('email', 'Email is required'); hasError = true; }
  if (!password || password.length < 6) { showError('password', 'Password must be at least 6 characters'); hasError = true; }
  if (hasError) return;

  // Set loading state
  const originalText = btn.innerHTML;
  btn.innerHTML = '<div class="btn-spinner"></div>';
  btn.disabled = true;

  try {
    const { status, data } = await api.post('/auth/register', { name, email, password });

    if (status === 201 && data.success) {
      // Save token and user info
      api.setToken(data.token);
      api.setUser(data.user);
      
      // Redirect to home
      window.location.href = '/index.html';
    } else {
      // Handle specific errors
      if (status === 409) {
        showError('email', data.message);
      } else {
        showGeneralError(data.message || 'Registration failed');
      }
    }
  } catch (error) {
    showGeneralError('Network error. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
