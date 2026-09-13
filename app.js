const products = [
  { id: 1, name: "Анатомічна подушка Світанок", price: 1450, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "Органічна постель 'Ранкова роса'", price: 2890, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "Аромадифузор 'Сонячний цитрус'", price: 790, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "Ранковий заварник для кави", price: 1120, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80" }
];

let cart = JSON.parse(localStorage.getItem('svitanok_cart')) || [];

function renderProducts(items) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = items.map(p => `
    <div class="product-card">
      <div class="product-thumb"><img src="${p.image}" alt="${p.name}"></div>
      <div class="product-content">
        <h3 class="product-title">${p.name}</h3>
        <div class="product-footer">
          <span class="current-price">${p.price} грн</span>
          <button class="btn btn-primary" onclick="addToCart(${p.id})">В кошик</button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }
  localStorage.setItem('svitanok_cart', JSON.stringify(cart));
  updateCounters();
  alert('Товар додано до кошика!');
}

function updateCounters() {
  const badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
  }
}

function renderCartPage() {
  const container = document.getElementById('cartPageContent');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Ваш кошик порожній.</p>';
    return;
  }

  let total = 0;
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${cart.map(item => {
        const product = products.find(p => p.id === item.id);
        total += product.price * item.quantity;
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-color); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <h4>${product.name}</h4>
              <p style="color: var(--text-muted);">${item.quantity} шт. × ${product.price} грн</p>
            </div>
            <button class="btn" style="background: #EF4444; color: white;" onclick="removeFromCart(${product.id})">Видалити</button>
          </div>
        `;
      }).join('')}
      <div style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <h3>Загальна сума: ${total} грн</h3>
        <button class="btn btn-primary" onclick="alert('Замовлення успішно оформлено!'); cart=[]; localStorage.removeItem('svitanok_cart'); location.reload();">Оформити замовлення</button>
      </div>
    </div>
  `;
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem('svitanok_cart', JSON.stringify(cart));
  renderCartPage();
  updateCounters();
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
  });
}

renderProducts(products);
renderCartPage();
updateCounters();
