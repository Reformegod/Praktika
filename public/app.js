const API = '/api';
let products = [];

const productsTable = document.getElementById('productsTable');
const movementProduct = document.getElementById('movementProduct');
const reservationProduct = document.getElementById('reservationProduct');
const inventoryProduct = document.getElementById('inventoryProduct');
const movementsList = document.getElementById('movementsList');
const reservationsList = document.getElementById('reservationsList');
const reportCards = document.getElementById('reportCards');
const toast = document.getElementById('toast');

function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2500);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
  return data;
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ru-RU');
}

async function loadProducts(params = '') {
  products = await request(`${API}/products${params}`);
  renderProducts();
  fillProductSelects();
}

function renderProducts() {
  if (!products.length) {
    productsTable.innerHTML = '<tr><td colspan="10" class="empty-row">Товаров пока нет. Заполните форму выше и нажмите «Добавить товар».</td></tr>';
    return;
  }

  productsTable.innerHTML = products.map(product => `
    <tr class="${product.quantity <= product.min_quantity ? 'low-stock' : ''}">
      <td>${product.sku}</td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.quantity} ${product.unit}</td>
      <td>${product.cell}</td>
      <td>${product.batch}</td>
      <td>${formatDate(product.expiration_date)}</td>
      <td>${product.min_quantity}</td>
      <td>${product.status}</td>
      <td><button onclick="deleteProduct(${product.id})">Удалить</button></td>
    </tr>
  `).join('');
}

function fillProductSelects() {
  if (!products.length) {
    const emptyOption = '<option value="">Сначала добавьте товар</option>';
    movementProduct.innerHTML = emptyOption;
    reservationProduct.innerHTML = emptyOption;
    inventoryProduct.innerHTML = emptyOption;
    return;
  }

  const options = '<option value="">Выберите товар</option>' + products.map(product => `
    <option value="${product.id}">${product.sku} — ${product.name} (${product.quantity} ${product.unit})</option>
  `).join('');

  movementProduct.innerHTML = options;
  reservationProduct.innerHTML = options;
  inventoryProduct.innerHTML = options;
}

async function deleteProduct(id) {
  if (!confirm('Удалить товар?')) return;
  await request(`${API}/products/${id}`, { method: 'DELETE' });
  showToast('Товар удален');
  await refreshAll();
}

async function loadReports() {
  const report = await request(`${API}/reports/summary`);
  reportCards.innerHTML = `
    <div class="card"><span>Всего товаров</span><strong>${report.totalProducts}</strong></div>
    <div class="card"><span>Ниже минимума</span><strong>${report.lowStock}</strong></div>
    <div class="card"><span>Просрочено</span><strong>${report.expired}</strong></div>
    <div class="card"><span>В резерве</span><strong>${report.reserved}</strong></div>
  `;
}

async function loadMovements() {
  const movements = await request(`${API}/movements`);
  movementsList.innerHTML = movements.slice(0, 8).map(item => `
    <li>
      <b>${item.sku} — ${item.name}</b><br>
      ${operationName(item.operation_type)}: ${item.quantity}, ${formatDate(item.created_at)}<br>
      <small>${item.comment || ''}</small>
    </li>
  `).join('');
}

async function loadReservations() {
  const reservations = await request(`${API}/reservations`);
  const activeReservations = reservations.filter(item => item.status === 'active');

  if (!activeReservations.length) {
    reservationsList.innerHTML = '<li class="empty-list">Активных резервов пока нет.</li>';
    return;
  }

  reservationsList.innerHTML = activeReservations.map(item => `
    <li>
      <div>
        <b>${item.sku} — ${item.name}</b><br>
        Количество: ${item.quantity}<br>
        Заказчик: ${item.customer}<br>
        <small>Создан: ${formatDate(item.created_at)}</small>
      </div>
      <button class="small-btn" onclick="closeReservation(${item.id})">Снять резерв</button>
    </li>
  `).join('');
}

async function closeReservation(id) {
  if (!confirm('Снять этот товар с резерва?')) return;
  await request(`${API}/reservations/${id}/close`, { method: 'PATCH' });
  showToast('Резерв снят');
  await refreshAll();
}

function operationName(type) {
  const names = {
    receipt: 'Приемка',
    move: 'Перемещение',
    writeoff: 'Списание',
  };
  return names[type] || type;
}

async function refreshAll() {
  await loadProducts();
  await loadReports();
  await loadMovements();
  await loadReservations();
}

document.getElementById('productForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToObject(event.target);
  await request(`${API}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  event.target.reset();
  document.getElementById('searchInput').value = '';
  showToast('Товар добавлен. Он появился в таблице ниже.');
  await refreshAll();
});

document.getElementById('movementForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToObject(event.target);
  await request(`${API}/movements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  event.target.reset();
  showToast('Операция сохранена');
  await refreshAll();
});

document.getElementById('reservationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToObject(event.target);
  await request(`${API}/reservations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  event.target.reset();
  showToast('Резерв создан');
  await refreshAll();
});

document.getElementById('inventoryForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formToObject(event.target);
  await request(`${API}/inventory`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  event.target.reset();
  showToast('Инвентаризация проведена');
  await refreshAll();
});

document.getElementById('searchInput').addEventListener('input', async (event) => {
  const value = encodeURIComponent(event.target.value);
  await loadProducts(`?search=${value}`);
});

document.getElementById('lowStockBtn').addEventListener('click', async () => {
  await loadProducts('?lowStock=true');
});

document.getElementById('showAllBtn').addEventListener('click', async () => {
  document.getElementById('searchInput').value = '';
  await loadProducts();
});

refreshAll().catch(error => showToast(error.message));
