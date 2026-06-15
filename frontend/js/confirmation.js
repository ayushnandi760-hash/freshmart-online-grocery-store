// ============================================
// Confirmation Page Logic
// ============================================
// Retrieves the newly placed order details from
// sessionStorage and renders the success UI.
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Read order from sessionStorage
  const orderJson = sessionStorage.getItem('freshmart_last_order');

  if (!orderJson) {
    document.getElementById('conf-error').style.display = 'block';
    return;
  }

  try {
    const order = JSON.parse(orderJson);
    renderConfirmation(order);
    
    // Optional: Clear it so refreshing doesn't keep showing it forever
    // sessionStorage.removeItem('freshmart_last_order');

    // Update cart badge (since cart is now empty)
    updateCartBadge();
  } catch (e) {
    document.getElementById('conf-error').style.display = 'block';
  }
});

function renderConfirmation(order) {
  document.getElementById('conf-card').style.display = 'block';

  // Fill details
  document.getElementById('conf-name').textContent = order.customer_name.split(' ')[0];
  document.getElementById('conf-id').textContent = `#${order.id}`;
  document.getElementById('conf-address').textContent = order.address;
  document.getElementById('conf-total').textContent = parseFloat(order.total_amount).toFixed(2);

  // Fill items
  const itemsContainer = document.getElementById('conf-items-list');
  let itemsHtml = '';

  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      itemsHtml += `
        <div class="conf-item-row">
          <span>${item.quantity}x ${item.name}</span>
          <span>₹${item.subtotal}</span>
        </div>
      `;
    });
  }

  itemsContainer.innerHTML = itemsHtml;
}
