// =====================
// GIỜ MỞ/ĐÓNG CỬA TỰ ĐỘNG
// =====================
const BUSINESS_HOURS = {
  0: { open: '06:00', close: '22:00' },
  1: { open: '06:00', close: '22:00' },
  2: { open: '06:00', close: '22:00' },
  3: { open: '06:00', close: '22:00' },
  4: { open: '06:00', close: '22:00' },
  5: { open: '06:00', close: '22:00' },
  6: { open: '06:00', close: '22:00' },
};

function checkBusinessHours() {
  const now   = new Date();
  const day   = now.getDay();
  const hours = BUSINESS_HOURS[day];
  if (!hours) return { isOpen: false, timeMsg: 'Hôm nay quán nghỉ' };

  const [openH,  openM]  = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const openTime  = openH  * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  const nowTime   = now.getHours() * 60 + now.getMinutes();
  const isOpen    = nowTime >= openTime && nowTime < closeTime;

  let timeMsg = '';
  if (isOpen) {
    const remaining = closeTime - nowTime;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    timeMsg = h > 0 ? `Đóng cửa sau ${h} giờ ${m} phút` : `Đóng cửa sau ${m} phút`;
  } else {
    if (nowTime < openTime) {
      const wait = openTime - nowTime;
      const h = Math.floor(wait / 60);
      const m = wait % 60;
      timeMsg = h > 0 ? `Mở cửa sau ${h} giờ ${m} phút` : `Mở cửa sau ${m} phút`;
    } else {
      timeMsg = `Mở cửa lúc ${hours.open} ngày mai`;
    }
  }
  return { isOpen, openTime: hours.open, closeTime: hours.close, timeMsg };
}

function renderBusinessStatus() {
  const status    = checkBusinessHours();
  const banners   = document.querySelectorAll('.business-status');
  const orderBtns = document.querySelectorAll('.btn-submit, .btn-add, .btn-order');

  banners.forEach(banner => {
    if (status.isOpen) {
      banner.className = 'business-status status-open';
      banner.innerHTML = `
        <span class="status-dot"></span>
        <span>🟢 Đang mở cửa · ${status.openTime} – ${status.closeTime}</span>
        <span class="status-time">${status.timeMsg}</span>
      `;
      orderBtns.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor  = '';
        if (btn.classList.contains('btn-submit') && btn.textContent.includes('đóng cửa')) {
          btn.textContent = '🚀 Đặt Món Ngay';
        }
      });
    } else {
      banner.className = 'business-status status-closed';
      banner.innerHTML = `
        <span class="status-dot"></span>
        <span>🔴 Đã đóng cửa · Mở lại lúc ${status.openTime}</span>
        <span class="status-time">${status.timeMsg}</span>
      `;
      orderBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor  = 'not-allowed';
        if (btn.classList.contains('btn-submit')) {
          btn.textContent = '❌ Quán đang đóng cửa';
        }
      });
    }
  });
}

renderBusinessStatus();
setInterval(renderBusinessStatus, 60000);


// =====================
// GIỎ HÀNG
// =====================
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = total);
}

function addToCart(name, price) {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) {
    if (confirm('Vui lòng đăng nhập để đặt món!\nBấm OK để đến trang đăng nhập.')) {
      window.location.href = 'account.html?redirect=order';
    }
    return;
  }

  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart();
  updateCartCount();
  showToast();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function showToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function formatPrice(price) {
  return price.toLocaleString('vi-VN') + 'đ';
}


// =====================
// TRANG ORDER.HTML — GIỎ HÀNG
// =====================
function checkAuthForOrder() {
  const orderContent = document.getElementById('order-content');
  const loginPrompt  = document.getElementById('login-required-prompt');
  if (!orderContent) return;

  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) {
    orderContent.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
  } else {
    orderContent.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
  }
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    if (cartEmpty) cartEmpty.style.display = 'block';
    if (cartTotal) cartTotal.style.display = 'none';
    return;
  }

  if (cartEmpty) cartEmpty.style.display = 'none';
  if (cartTotal) cartTotal.style.display = 'block';

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${formatPrice(item.price)}</span>
      </div>
      <div class="cart-item-qty">
        <button onclick="changeQty(${index}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty(${index}, 1)">+</button>
        <button class="btn-remove" onclick="removeItem(${index})">🗑️</button>
      </div>
    </div>
  `).join('');

  updateTotal();
}

function changeQty(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartCount();
  renderCart();
}

function updateTotal() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total    = subtotal + 15000;
  const subEl    = document.getElementById('subtotal');
  const totEl    = document.getElementById('total-price');
  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (totEl) totEl.textContent = formatPrice(total);
}


// =====================
// THANH TOÁN QR
// =====================
document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener('change', function () {
    const qrSection = document.getElementById('qr-section');
    if (!qrSection) return;
    if (this.value === 'qr') {
      qrSection.style.display = 'block';
      generateQR();
    } else {
      qrSection.style.display = 'none';
    }
  });
});

function generateQR() {
  const total      = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;
  const orderId    = 'DH' + Date.now().toString().slice(-5);
  const contentEl  = document.getElementById('qr-content');
  const imgEl      = document.getElementById('qr-img');
  if (contentEl) contentEl.textContent = orderId;

  const BANK_ID      = 'VCB';
  const ACCOUNT_NO   = '1234567890';
  const ACCOUNT_NAME = 'NGUYEN VAN A';

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${total}&addInfo=${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  if (imgEl) imgEl.src = qrUrl;
}


// =====================
// GỬI ĐƠN HÀNG
// =====================
async function submitOrder() {
  const nameEl    = document.getElementById('customer-name');
  const phoneEl   = document.getElementById('customer-phone');
  const addressEl = document.getElementById('customer-address');
  const noteEl    = document.getElementById('order-note');
  const payEl     = document.querySelector('input[name="payment"]:checked');

  if (!nameEl || !phoneEl) return;

  const name    = nameEl.value.trim();
  const phone   = phoneEl.value.trim();
  const address = addressEl ? addressEl.value.trim() : '';
  const note    = noteEl    ? noteEl.value.trim()    : '';
  const payment = payEl     ? payEl.value            : 'cod';

  if (!name)  { alert('Vui lòng nhập họ tên!');        return; }
  if (!phone) { alert('Vui lòng nhập số điện thoại!'); return; }
  if (cart.length === 0) { alert('Giỏ hàng trống!');   return; }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (currentUser && address) {
    localStorage.setItem(`lastAddress_${currentUser.phone}`, address);
  }

  const total     = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;
  const orderData = {
    customer: { name, phone, address, note },
    items:    [...cart],
    total,
    payment,
    userId:   currentUser ? currentUser.phone : null,
    userName: currentUser ? currentUser.name  : null
  };

  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Đang gửi đơn...'; }

  try {
    const token = localStorage.getItem('authToken');
    const res   = await fetch(`${API_URL}/orders`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Có lỗi xảy ra!');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Đặt Món Ngay'; }
      return;
    }

    const orderId = data.orderId;
    sessionStorage.setItem('lastOrderCustomerName', name);
    sessionStorage.setItem('lastOrderItems', JSON.stringify(cart.map(i => i.name)));

    cart = [];
    saveCart();
    updateCartCount();

    const formEl    = document.getElementById('order-form');
    const successEl = document.getElementById('order-success');
    const orderIdEl = document.getElementById('order-id');
    if (formEl)    formEl.style.display    = 'none';
    if (successEl) successEl.style.display = 'block';
    if (orderIdEl) {
      orderIdEl.textContent = orderId;
      orderIdEl.style.cursor = 'pointer';
      orderIdEl.title = 'Bấm để copy';
      orderIdEl.onclick = () => {
        navigator.clipboard.writeText(orderId);
        orderIdEl.textContent = orderId + ' ✅ Đã copy!';
        setTimeout(() => orderIdEl.textContent = orderId, 2000);
      };
    }

    startOrderTracking(orderId);

  } catch (err) {
    console.error('Lỗi đặt món:', err);
    alert('Không kết nối được server. Vui lòng thử lại!');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Đặt Món Ngay'; }
  }
}


// =====================
// THEO DÕI ĐƠN REAL-TIME
// =====================
let trackingInterval  = null;
let lastTrackedStatus = null;

function startOrderTracking(orderId) {
  lastTrackedStatus = 'new';

  const trackingEl   = document.getElementById('order-tracking');
  const trackingIdEl = document.getElementById('tracking-id');
  if (trackingEl)   trackingEl.style.display   = 'block';
  if (trackingIdEl) trackingIdEl.textContent = orderId;

  updateTrackingUI({ id: orderId, status: 'new', createdAt: new Date().toISOString() });

  fetchOrderStatus(orderId);
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(() => fetchOrderStatus(orderId), 10000);
}

async function fetchOrderStatus(orderId) {
  try {
    const res   = await fetch(`${API_URL}/orders/${orderId}`);
    const order = await res.json();
    if (!res.ok) return;

    if (lastTrackedStatus && order.status !== lastTrackedStatus) {
      playStatusChangeSound(order.status);
      lastTrackedStatus = order.status;
    }

    updateTrackingUI(order);

    if (order.status === 'done' || order.status === 'cancelled') {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
  } catch (err) {
    console.log('Lỗi theo dõi đơn:', err.message);
  }
}

function updateTrackingUI(order) {
  const steps = {
    new:       { active: 'step-new',       done: [] },
    confirmed: { active: 'step-confirmed', done: ['step-new'] },
    done:      { active: 'step-done',      done: ['step-new','step-confirmed','step-cooking'] },
    cancelled: { active: null,              done: [] }
  };

  const cfg = steps[order.status] || steps.new;
  ['step-new','step-confirmed','step-cooking','step-done'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'tracking-step';
  });

  cfg.done.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('done');
  });

  if (order.status === 'cancelled') {
    ['step-new','step-confirmed','step-cooking','step-done'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('cancelled');
    });
  } else if (cfg.active) {
    const el = document.getElementById(cfg.active);
    if (el) el.classList.add('active');
    if (order.status === 'confirmed') {
      const cookEl = document.getElementById('step-cooking');
      if (cookEl) cookEl.classList.add('active');
    }
  }

  const timeEl = document.getElementById('step-new-time');
  if (timeEl) {
    timeEl.textContent = new Date(order.createdAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  const messages = {
    new:       { text: '⏳ Đơn hàng đang chờ quán xác nhận...', cls: 'new' },
    confirmed: { text: '👨‍🍳 Quán đã xác nhận! Đang chuẩn bị món...', cls: 'confirmed' },
    done:      { text: '🎉 Đơn hàng đã hoàn thành! Chúc ngon miệng!', cls: 'done' },
    cancelled: { text: '❌ Đơn hàng đã bị hủy. Vui lòng liên hệ quán.', cls: 'cancelled' }
  };

  const msg   = messages[order.status] || messages.new;
  const msgEl = document.getElementById('tracking-status-msg');
  if (msgEl) {
    msgEl.textContent = msg.text;
    msgEl.className   = `tracking-status-msg ${msg.cls}`;
  }

  const infoEl = document.getElementById('tracking-info');
  if (infoEl && order.items) {
    infoEl.innerHTML = `
      <strong>📋 Món đã đặt:</strong><br>
      ${order.items.map(i => `${i.name} x${i.quantity}`).join(' · ')}<br>
      <strong>💰 Tổng:</strong> ${formatPrice(order.total || 0)} ·
      <strong>💳</strong> ${order.payment === 'cod' ? 'Tiền mặt' : 'Chuyển khoản'}
    `;
  }
}

function playStatusChangeSound(status) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (status === 'done') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
}


// =====================
// TÌM KIẾM + LỌC DANH MỤC MENU
// =====================
let currentCategory  = 'all';
let currentSearchTerm = '';

function applyMenuFilters() {
  const cards      = document.querySelectorAll('.menu-card');
  const noResultEl = document.getElementById('search-no-result');
  let visibleCount = 0;

  cards.forEach(card => {
    const category = card.dataset.category;
    const nameEl   = card.querySelector('h3');
    const name     = nameEl ? nameEl.textContent.toLowerCase() : '';

    const matchCategory = currentCategory === 'all' || category === currentCategory;
    const matchSearch   = currentSearchTerm === '' || name.includes(currentSearchTerm);

    if (matchCategory && matchSearch) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (noResultEl) {
    noResultEl.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    applyMenuFilters();
  });
});

const searchInput    = document.getElementById('menu-search');
const searchClearBtn = document.getElementById('search-clear');

if (searchInput) {
  searchInput.addEventListener('input', () => {
    currentSearchTerm = searchInput.value.trim().toLowerCase();
    if (searchClearBtn) {
      searchClearBtn.style.display = currentSearchTerm ? 'block' : 'none';
    }
    applyMenuFilters();
  });
}

function clearSearch() {
  if (searchInput) searchInput.value = '';
  currentSearchTerm = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  applyMenuFilters();
}


// =====================
// LOAD MENU TỪ API + SMART POLLING
// =====================
let menuPollInterval  = null;
let menuCacheSnapshot = {};

async function loadMenu() {
  const grid    = document.getElementById('menu-grid');
  const loading = document.getElementById('menu-loading');
  if (!grid) return;

  try {
    const res   = await fetch(`${API_URL}/menu`);
    const items = await res.json();

    if (loading) loading.style.display = 'none';
    grid.style.display = 'grid';

    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#999;padding:40px">Chưa có món ăn nào</p>';
      return;
    }

    renderMenuGrid(items);
    items.forEach(item => { menuCacheSnapshot[item.id] = item.available !== false; });
    startMenuPolling();

  } catch (err) {
    console.error('Lỗi tải menu:', err);
    if (loading) loading.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:40px">⚠️ Không tải được thực đơn!</p>';
  }
}

function renderMenuGrid(items) {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  grid.innerHTML = items.map(item => buildMenuCard(item)).join('');
  applyMenuFilters();
}

function buildMenuCard(item) {
  const isAvailable = item.available !== false;
  const images = (item.images && item.images.length > 0)
    ? item.images
    : item.imageUrl ? [item.imageUrl] : [];
  const hasMultiple = images.length > 1;

  return `
    <div class="menu-card ${!isAvailable ? 'menu-card-sold-out' : ''}"
         data-category="${item.category}"
         data-item-id="${item.id}">
      <div class="menu-img-wrap" style="position:relative;overflow:hidden;">

        ${hasMultiple ? `
          <div class="img-carousel" id="carousel-${item.id}">
            ${images.map((url, i) => `
              <img src="${url}"
                   class="carousel-img ${i === 0 ? 'active' : ''}"
                   alt="${item.name}"
                   style="${!isAvailable ? 'filter:grayscale(0.7)' : ''}"
                   onerror="this.style.display='none'">
            `).join('')}
          </div>
          <div class="carousel-dots">
            ${images.map((_, i) => `
              <span class="dot ${i === 0 ? 'active' : ''}"
                    onclick="goToSlide('${item.id}', ${i})"></span>
            `).join('')}
          </div>
          <button class="carousel-btn prev" onclick="changeSlide('${item.id}', -1)">&#8249;</button>
          <button class="carousel-btn next" onclick="changeSlide('${item.id}', 1)">&#8250;</button>
        ` : `
          <img src="${images[0] || ''}"
               onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'menu-img-emoji\\'>${item.icon || '🍽️'}</div>'"
               alt="${item.name}" class="menu-img-real"
               style="${!isAvailable ? 'filter:grayscale(0.7)' : ''}">
        `}

        ${item.badge && isAvailable
          ? `<span class="badge badge-${item.badge}">${getBadgeLabel(item.badge)}</span>`
          : ''}
        ${!isAvailable
          ? `<span class="badge badge-sold-out">😢 Hết hàng</span>`
          : ''}
      </div>

      <div class="menu-info">
        <h3>${item.name}</h3>
        <p>${item.desc || ''}</p>
        ${item.soldCount > 0 && isAvailable
          ? `<div class="order-count">🛒 Đã bán ${item.soldCount} lần hôm nay</div>`
          : ''}
        <div class="menu-footer">
          <div class="price-wrap">
            <span class="price">${formatPrice(item.price)}</span>
            ${item.oldPrice ? `<span class="price-old">${formatPrice(item.oldPrice)}</span>` : ''}
          </div>
          ${isAvailable
            ? `<button class="btn-add" onclick="addToCart('${item.name}', ${item.price})">+ Thêm</button>`
            : `<button class="btn-add btn-sold-out" disabled>Hết hàng</button>`}
        </div>
      </div>
    </div>
  `;
}

function getBadgeLabel(badge) {
  return { hot: '🔥 Bán chạy', new: '⭐ Nổi bật', special: '🎁 Đặc biệt', fresh: '✨ Mới có' }[badge] || '';
}

// Carousel functions
const carouselState = {};

function changeSlide(itemId, direction) {
  const carousel = document.getElementById(`carousel-${itemId}`);
  if (!carousel) return;
  const imgs  = carousel.querySelectorAll('.carousel-img');
  const dots  = carousel.parentElement.querySelectorAll('.dot');
  const total = imgs.length;
  carouselState[itemId] = ((carouselState[itemId] || 0) + direction + total) % total;
  const idx = carouselState[itemId];
  imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
}

function goToSlide(itemId, index) {
  const carousel = document.getElementById(`carousel-${itemId}`);
  if (!carousel) return;
  const imgs = carousel.querySelectorAll('.carousel-img');
  const dots = carousel.parentElement.querySelectorAll('.dot');
  carouselState[itemId] = index;
  imgs.forEach((img, i) => img.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

// Smart polling — chỉ cập nhật card thay đổi
function startMenuPolling() {
  if (menuPollInterval) return;
  menuPollInterval = setInterval(async () => {
    const grid = document.getElementById('menu-grid');
    if (!grid) { clearInterval(menuPollInterval); menuPollInterval = null; return; }
    try {
      const res   = await fetch(`${API_URL}/menu`);
      const items = await res.json();
      if (!items) return;
      let hasChange = false;
      items.forEach(item => {
        const newAvail = item.available !== false;
        const oldAvail = menuCacheSnapshot[item.id];
        if (oldAvail !== newAvail) {
          updateMenuCard(item, newAvail);
          menuCacheSnapshot[item.id] = newAvail;
          hasChange = true;
        }
      });
      if (hasChange) showMenuUpdateToast();
    } catch (err) {}
  }, 30000);
}

function updateMenuCard(item, isAvailable) {
  const card = document.querySelector(`.menu-card[data-item-id="${item.id}"]`);
  if (!card) return;
  card.classList.toggle('menu-card-sold-out', !isAvailable);
  const img = card.querySelector('.menu-img-real, .carousel-img');
  if (img) img.style.filter = isAvailable ? '' : 'grayscale(0.7)';
  const imgWrap = card.querySelector('.menu-img-wrap');
  if (imgWrap) {
    const oldBadge = imgWrap.querySelector('.badge-sold-out');
    if (oldBadge) oldBadge.remove();
    if (!isAvailable) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-sold-out';
      badge.textContent = '😢 Hết hàng';
      imgWrap.appendChild(badge);
    }
  }
  const btnArea = card.querySelector('.menu-footer');
  if (btnArea) {
    const oldBtn = btnArea.querySelector('.btn-add, .btn-sold-out');
    if (oldBtn) oldBtn.remove();
    const newBtn = document.createElement('button');
    if (isAvailable) {
      newBtn.className = 'btn-add';
      newBtn.textContent = '+ Thêm';
      newBtn.onclick = () => addToCart(item.name, item.price);
    } else {
      newBtn.className = 'btn-add btn-sold-out';
      newBtn.textContent = 'Hết hàng';
      newBtn.disabled = true;
    }
    btnArea.appendChild(newBtn);
  }
}

function showMenuUpdateToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const original = toast.textContent;
  toast.textContent = '🔄 Menu vừa được cập nhật!';
  toast.style.background = '#3498db';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.textContent  = original;
    toast.style.background = '';
  }, 3000);
}


// =====================
// MINI MENU TRONG ORDER.HTML
// =====================
let miniMenuItems = [];

async function loadMiniMenu() {
  const grid    = document.getElementById('mini-menu-grid');
  const loading = document.getElementById('mini-menu-loading');
  if (!grid) return;

  try {
    const res   = await fetch(`${API_URL}/menu`);
    const items = await res.json();
    miniMenuItems = items;
    if (loading) loading.style.display = 'none';
    grid.style.display = 'grid';
    renderMiniMenu(items);
  } catch (err) {
    if (loading) loading.textContent = '⚠️ Không tải được món. Vui lòng thử lại!';
  }
}

function renderMiniMenu(items) {
  const grid = document.getElementById('mini-menu-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = '<p style="color:#999;padding:10px">Chưa có món nào</p>';
    return;
  }

  grid.innerHTML = items.map(item => {
    const isAvailable = item.available !== false;
    const thumbUrl    = (item.images && item.images[0])
      ? item.images[0]
      : item.imageUrl || '';

    return `
      <div class="mini-item ${!isAvailable ? 'mini-item-sold-out' : ''}"
           data-cat="${item.category}">
        ${thumbUrl ? `
          <img src="${thumbUrl}" alt="${item.name}"
               style="width:44px;height:44px;border-radius:8px;object-fit:cover;
                      flex-shrink:0;${!isAvailable ? 'filter:grayscale(1);opacity:0.5;' : ''}"
               onerror="this.style.display='none'">
        ` : `<span>${item.icon || '🍽️'}</span>`}
        <span>
          ${item.name}
          ${!isAvailable ? '<small style="color:#e74c3c;font-weight:600;">(Hết hàng)</small>' : ''}
        </span>
        <div class="mini-item-right">
          <span class="price">${formatPrice(item.price)}</span>
          ${isAvailable
            ? `<button class="btn-add" onclick="addToCart('${item.name}', ${item.price})">+ Thêm</button>`
            : `<button class="btn-add" disabled style="opacity:0.4;cursor:not-allowed;background:#ccc;">Hết</button>`}
        </div>
      </div>
    `;
  }).join('');
}

document.querySelectorAll('.mini-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mini-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat      = btn.dataset.cat;
    const filtered = cat === 'all' ? miniMenuItems : miniMenuItems.filter(i => i.category === cat);
    renderMiniMenu(filtered);
  });
});


// =====================
// TỰ ĐIỀN FORM KHI ĐÃ ĐĂNG NHẬP
// =====================
function initOrderPage() {
  const orderContent = document.getElementById('order-content');
  if (!orderContent) return;

  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) return;

  const nameEl  = document.getElementById('customer-name');
  const phoneEl = document.getElementById('customer-phone');
  const addrEl  = document.getElementById('customer-address');

  if (nameEl  && !nameEl.value)  nameEl.value  = user.name;
  if (phoneEl && !phoneEl.value) phoneEl.value = user.phone;

  const savedAddr = localStorage.getItem(`lastAddress_${user.phone}`);
  if (addrEl && savedAddr && !addrEl.value) addrEl.value = savedAddr;
}


// =====================
// TÀI KHOẢN KHÁCH HÀNG
// =====================
function switchTab(tab) {
  ['login', 'register', 'logged-in'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(`tab-${tab}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active',
      (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
}

function showAccountMsg(msg, type = 'success') {
  const el = document.getElementById('account-msg');
  if (!el) return;
  el.textContent = msg;
  el.className   = `account-msg ${type}`;
  setTimeout(() => el.textContent = '', 3000);
}

async function handleRegister() {
  const name     = document.getElementById('reg-name')?.value.trim();
  const phone    = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm  = document.getElementById('reg-confirm')?.value;

  if (!name || !phone || !password) { showAccountMsg('Vui lòng điền đầy đủ thông tin!', 'error'); return; }
  if (password.length < 6)          { showAccountMsg('Mật khẩu tối thiểu 6 ký tự!', 'error');    return; }
  if (password !== confirm)          { showAccountMsg('Mật khẩu không khớp!', 'error');            return; }

  const btn = document.querySelector('#tab-register .btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang xử lý...'; }

  try {
    const res  = await fetch(`${API_URL}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, phone, password })
    });
    const data = await res.json();
    if (!res.ok) { showAccountMsg(data.error || 'Đăng ký thất bại!', 'error'); return; }
    showAccountMsg('Đăng ký thành công! Vui lòng đăng nhập.');
    setTimeout(() => switchTab('login'), 1500);
  } catch (err) {
    showAccountMsg('Không kết nối được server!', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✅ Đăng Ký'; }
  }
}

async function handleLogin() {
  const phone    = document.getElementById('login-phone')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!phone || !password) { showAccountMsg('Vui lòng nhập đầy đủ thông tin!', 'error'); return; }

  const btn = document.querySelector('#tab-login .btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang đăng nhập...'; }

  try {
    const res  = await fetch(`${API_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) { showAccountMsg(data.error || 'Sai số điện thoại hoặc mật khẩu!', 'error'); return; }
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('authToken',   data.token);
    showAccountMsg('Đăng nhập thành công!');
    setTimeout(() => showLoggedIn(data.user), 1000);
  } catch (err) {
    showAccountMsg('Không kết nối được server!', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔐 Đăng Nhập'; }
  }
}

async function showLoggedIn(user) {
  ['tab-login', 'tab-register'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.style.display = 'none');

  const loggedIn = document.getElementById('tab-logged-in');
  if (loggedIn) loggedIn.style.display = 'block';

  const nameEl    = document.getElementById('user-name-display');
  const phoneEl   = document.getElementById('user-phone-display');
  const infoName  = document.getElementById('info-name');
  const infoPhone = document.getElementById('info-phone');

  if (nameEl)    nameEl.textContent    = user.name;
  if (phoneEl)   phoneEl.textContent   = user.phone;
  if (infoName)  infoName.textContent  = user.name;
  if (infoPhone) infoPhone.textContent = user.phone;

  const savedAddr   = localStorage.getItem(`lastAddress_${user.phone}`);
  const addrRow     = document.getElementById('info-address-row');
  const addrDisplay = document.getElementById('info-address');
  if (savedAddr && addrRow && addrDisplay) {
    addrRow.style.display   = 'block';
    addrDisplay.textContent = savedAddr;
  }

  await loadUserStats(user);

  const params   = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect === 'order') {
    setTimeout(() => window.location.href = 'order.html', 800);
  }
}

async function loadUserStats(user) {
  const statOrders = document.getElementById('stat-total-orders');
  const statSpent  = document.getElementById('stat-total-spent');
  const statDone   = document.getElementById('stat-done-orders');
  if (!statOrders) return;

  try {
    const token = localStorage.getItem('authToken');
    const res   = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await res.json();
    if (!Array.isArray(orders)) return;

    const done  = orders.filter(o => o.status === 'done');
    const spent = done.reduce((sum, o) => sum + (o.total || 0), 0);

    statOrders.textContent = orders.length;
    statDone.textContent   = done.length;
    statSpent.textContent  = spent >= 1000000
      ? (spent / 1000000).toFixed(1) + 'tr'
      : (spent / 1000).toFixed(0) + 'k';
  } catch (err) {
    console.log('Lỗi tải thống kê user:', err.message);
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  location.reload();
}

function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');

  if (!user) {
    const params   = new URLSearchParams(window.location.search);
    const preName  = params.get('prefill_name');
    const prePhone = params.get('prefill_phone');
    if (preName) {
      const regNameEl  = document.getElementById('reg-name');
      const regPhoneEl = document.getElementById('reg-phone');
      if (regNameEl)  regNameEl.value  = preName;
      if (regPhoneEl) regPhoneEl.value = prePhone;
      switchTab('register');
    }
    return;
  }

  const el = document.getElementById('tab-logged-in');
  if (el) showLoggedIn(user);
}


// =====================
// LỊCH SỬ ĐƠN HÀNG
// =====================
async function renderHistory() {
  const historyList          = document.getElementById('history-list');
  const historyEmpty         = document.getElementById('history-empty');
  const historyLoginRequired = document.getElementById('history-login-required');
  if (!historyList) return;

  const user  = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const token = localStorage.getItem('authToken');

  if (!user || !token) {
    if (historyLoginRequired) historyLoginRequired.style.display = 'block';
    return;
  }

  historyList.innerHTML = '<p style="text-align:center;color:#999;padding:20px">⏳ Đang tải lịch sử...</p>';

  try {
    let orders = null;
    const res1 = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res1.status === 401) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      historyList.innerHTML = '';
      if (historyLoginRequired) historyLoginRequired.style.display = 'block';
      return;
    }

    if (res1.ok) {
      orders = await res1.json();
      if (orders.length === 0) {
        const res2 = await fetch(`${API_URL}/orders/phone/${user.phone}`);
        if (res2.ok) {
          const fb = await res2.json();
          if (fb.length > 0) orders = fb;
        }
      }
    } else {
      const res2 = await fetch(`${API_URL}/orders/phone/${user.phone}`);
      if (res2.ok) orders = await res2.json();
    }

    if (!orders || orders.length === 0) {
      historyList.innerHTML = '';
      if (historyEmpty) {
        historyEmpty.style.display = 'block';
        const p = historyEmpty.querySelector('p');
        if (p) p.textContent = '📭 Bạn chưa có đơn hàng nào';
      }
      return;
    }

    const statusLabel = {
      new: '🆕 Đơn mới', confirmed: '✅ Đã xác nhận',
      done: '🎉 Hoàn thành', cancelled: '❌ Đã hủy'
    };

    historyList.innerHTML = orders.map(order => `
      <div class="history-card">
        <div class="history-header">
          <span class="order-id">Mã đơn: <strong>${order.id}</strong></span>
          <span class="order-status status-${order.status}">
            ${statusLabel[order.status] || order.status}
          </span>
        </div>
        <div class="history-items">
          ${order.items.map(item => `
            <div class="history-item">
              <span>${item.name} x${item.quantity}</span>
              <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="history-footer">
          <span>📅 ${new Date(order.createdAt).toLocaleString('vi-VN')}</span>
          <span class="history-total">Tổng: <strong>${formatPrice(order.total)}</strong></span>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('❌ Lỗi tải lịch sử:', err);
    historyList.innerHTML = '';
    if (historyEmpty) {
      historyEmpty.style.display = 'block';
      const p = historyEmpty.querySelector('p');
      if (p) p.textContent = '⚠️ Không kết nối được server!';
    }
  }
}


// =====================
// ĐÁNH GIÁ SAU ĐẶT MÓN
// =====================
let selectedRating = 0;

function enableReviewDemo() {
  const prompt = document.getElementById('review-prompt');
  const form   = document.getElementById('review-form');
  if (prompt) prompt.style.display = 'none';
  if (form)   form.style.display   = 'block';
}

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.value);
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
    });
  });
  star.addEventListener('mouseenter', () => {
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('hover', parseInt(s.dataset.value) <= parseInt(star.dataset.value));
    });
  });
  star.addEventListener('mouseleave', () => {
    document.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
  });
});

function submitReview() {
  if (selectedRating === 0) { alert('Vui lòng chọn số sao!'); return; }

  const orderId    = document.getElementById('order-id')?.textContent.replace(' ✅ Đã copy!', '');
  const comment    = document.getElementById('review-comment')?.value.trim() || '';
  const savedName  = sessionStorage.getItem('lastOrderCustomerName');
  const savedItems = JSON.parse(sessionStorage.getItem('lastOrderItems') || '[]');

  const review = {
    id:           'RV' + Date.now().toString().slice(-6),
    orderId,
    customerName: savedName ? maskName(savedName) : 'Khách hàng',
    items:        savedItems.join(', '),
    rating:       selectedRating,
    comment,
    createdAt:    new Date().toISOString()
  };

  const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
  reviews.push(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));

  const formEl   = document.getElementById('review-form');
  const thanksEl = document.getElementById('review-thanks');
  if (formEl)   formEl.style.display   = 'none';
  if (thanksEl) thanksEl.style.display = 'block';
}

function maskName(name) {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;
  return parts.map((p, i) =>
    (i === 0 || i === parts.length - 1) ? p : p[0] + '.'
  ).join(' ');
}


// =====================
// TRANG REVIEWS.HTML
// =====================
function renderReviews() {
  const list = document.getElementById('reviews-list');
  if (!list) return;

  const reviews   = JSON.parse(localStorage.getItem('reviews') || '[]');
  const noReviews = document.getElementById('no-reviews');

  if (reviews.length === 0) {
    if (noReviews) noReviews.style.display = 'block';
    renderSummary([]);
    return;
  }

  if (noReviews) noReviews.style.display = 'none';

  list.innerHTML = [...reviews].reverse().map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">👤</div>
        <div class="review-meta">
          <strong>${r.customerName}</strong>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <span class="review-date">${formatReviewDate(r.createdAt)}</span>
      </div>
      ${r.items   ? `<div class="review-items">🍽️ ${r.items}</div>` : ''}
      ${r.comment ? `<p class="review-comment">"${r.comment}"</p>`   : ''}
    </div>
  `).join('');

  renderSummary(reviews);
}

function renderSummary(reviews) {
  const avgEl   = document.getElementById('avg-score');
  const starsEl = document.getElementById('avg-stars');
  const countEl = document.getElementById('total-reviews');
  const breakEl = document.getElementById('score-breakdown');
  if (!avgEl) return;

  if (reviews.length === 0) {
    avgEl.textContent   = '—';
    starsEl.textContent = '☆☆☆☆☆';
    countEl.textContent = '0 đánh giá';
    if (breakEl) breakEl.innerHTML = '';
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  avgEl.textContent   = avg.toFixed(1);
  starsEl.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  countEl.textContent = `${reviews.length} đánh giá`;

  if (breakEl) {
    breakEl.innerHTML = [5,4,3,2,1].map(star => {
      const count   = reviews.filter(r => r.rating === star).length;
      const percent = (count / reviews.length) * 100;
      return `
        <div class="breakdown-row">
          <span>${star} ★</span>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width:${percent}%"></div>
          </div>
          <span>${count}</span>
        </div>
      `;
    }).join('');
  }
}

function formatReviewDate(dateStr) {
  const date     = new Date(dateStr);
  const now      = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7)   return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}


// =====================
// MOBILE HAMBURGER MENU
// =====================
const navToggle = document.getElementById('nav-toggle');
const mainNav   = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    navToggle.textContent = mainNav.classList.contains('open') ? '✕' : '☰';
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.textContent = '☰';
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.header')) {
      mainNav.classList.remove('open');
      navToggle.textContent = '☰';
    }
  });
}


// =====================
// LOAD SITE SETTINGS & ÁP DỤNG BACKGROUND
// =====================
function convertDriveUrl(url) {
  if (!url) return '';
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
  return url;
}

async function loadSiteSettings() {
  try {
    const res      = await fetch(`${API_URL}/settings`);
    const settings = await res.json();
    if (!settings) return;

    // Áp dụng background
    const path    = window.location.pathname;
    const pageKey =
      path.includes('menu.html')    ? 'menu'    :
      path.includes('order.html')   ? 'order'   :
      path.includes('account.html') ? 'account' :
      path.includes('history.html') ? 'history' :
      path.includes('reviews.html') ? 'reviews' : 'home';

    const bgData = settings.backgrounds?.[pageKey];
    if (bgData) {
      const url     = typeof bgData === 'string' ? bgData      : bgData.url;
      const opacity = typeof bgData === 'string' ? 30          : (bgData.opacity ?? 30);
      if (url) applyBackground(url, opacity);
    }

    // Áp dụng tên quán + slogan
    if (settings.siteName) {
      const titleEl  = document.getElementById('hero-title');
      const sloganEl = document.getElementById('hero-slogan');
      if (titleEl)  titleEl.textContent  = settings.siteName;
      if (sloganEl && settings.slogan) sloganEl.textContent = settings.slogan;

      // Cập nhật logo
      if (typeof applyLogo === 'function') {
        applyLogo(settings.logoUrl || '', settings.logoEmoji, settings.siteName);
      }
    }

  } catch (err) {
    console.log('Không tải được settings:', err.message);
  }
}

function applyBackground(url, overlayOpacity = 30) {
  if (!url) return;
  const bgUrl  = convertDriveUrl(url);
  const heroEl = document.querySelector('.hero, .page-title');
  if (!heroEl) return;

  heroEl.style.backgroundImage    = `url('${bgUrl}')`;
  heroEl.style.backgroundSize     = 'cover';
  heroEl.style.backgroundPosition = 'center';
  heroEl.style.backgroundRepeat   = 'no-repeat';
  heroEl.style.position           = 'relative';

  const oldOverlay = heroEl.querySelector('.bg-overlay');
  if (oldOverlay) oldOverlay.remove();

  const alpha   = overlayOpacity / 100;
  const overlay = document.createElement('div');
  overlay.className = 'bg-overlay';
  overlay.style.cssText = `
    position:absolute;inset:0;
    background:rgba(0,0,0,${alpha});
    z-index:0;pointer-events:none;
  `;
  heroEl.insertBefore(overlay, heroEl.firstChild);

  Array.from(heroEl.children).forEach(child => {
    if (!child.classList.contains('bg-overlay')) {
      child.style.position = 'relative';
      child.style.zIndex   = '1';
    }
  });
}

function applyBackground(url, overlayOpacity = 30) {
  if (!url) return;
  const bgUrl = convertDriveUrl(url);

  // Tìm hero section theo id trước, fallback về class
  const heroEl = document.getElementById('hero-section')
               || document.querySelector('.hero')
               || document.querySelector('.page-title');
  if (!heroEl) return;

  heroEl.style.backgroundImage    = `url('${bgUrl}')`;
  heroEl.style.backgroundSize     = 'cover';
  heroEl.style.backgroundPosition = 'center top';
  heroEl.style.backgroundRepeat   = 'no-repeat';
  heroEl.style.position           = 'relative';
  heroEl.style.overflow           = 'hidden';

  // Xóa overlay cũ tránh chồng lớp
  const oldOverlay = heroEl.querySelector('.bg-overlay');
  if (oldOverlay) oldOverlay.remove();

  const alpha   = Math.min(Math.max(overlayOpacity, 0), 80) / 100;
  const overlay = document.createElement('div');
  overlay.className = 'bg-overlay';
  overlay.style.cssText = `
    position:absolute;
    inset:0;
    background:rgba(0,0,0,${alpha});
    z-index:0;
    pointer-events:none;
  `;
  heroEl.insertBefore(overlay, heroEl.firstChild);

  // Đẩy tất cả nội dung lên trên overlay
  Array.from(heroEl.children).forEach(child => {
    if (!child.classList.contains('bg-overlay')) {
      child.style.position = 'relative';
      child.style.zIndex   = '1';
    }
  });
}

// =====================
// KHỞI ĐỘNG TẤT CẢ
// =====================
checkAuthForOrder();
updateCartCount();
renderCart();
checkLoginStatus();
renderHistory();
renderReviews();
loadMenu();
loadMiniMenu();
initOrderPage();
loadSiteSettings();