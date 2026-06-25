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

  if (!hours) return { isOpen: false, message: 'Hôm nay quán nghỉ' };

  const [openH,  openM]  = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);

  const openTime  = openH  * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  const nowTime   = now.getHours() * 60 + now.getMinutes();

  const isOpen = nowTime >= openTime && nowTime < closeTime;

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

      // ✅ FIX: Mở khóa lại nút nếu trước đó bị khóa do đóng cửa
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

////////////////////
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


// =====================
// TRANG ORDER.HTML - GIỎ HÀNG
// =====================
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
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
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
  const total = subtotal + 15000;
  const subEl = document.getElementById('subtotal');
  const totEl = document.getElementById('total-price');
  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (totEl) totEl.textContent = formatPrice(total);
}

function formatPrice(price) {
  return price.toLocaleString('vi-VN') + 'đ';
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
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;
  const orderId = 'DH' + Date.now().toString().slice(-5);
  const contentEl = document.getElementById('qr-content');
  const imgEl     = document.getElementById('qr-img');
  if (contentEl) contentEl.textContent = orderId;

  const BANK_ID      = 'VCB';
  const ACCOUNT_NO   = '1234567890';
  const ACCOUNT_NAME = 'NGUYEN VAN A';

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${total}&addInfo=${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  if (imgEl) imgEl.src = qrUrl;
}


// =====================
// GỬI ĐƠN HÀNG — GỌI API BACKEND (CHỈ 1 BẢN DUY NHẤT)
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
  if (cart.length === 0) { alert('Giỏ hàng trống!');  return; }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;

  const orderData = {
    customer: { name, phone, address, note },
    items: [...cart],
    total,
    payment
  };

  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang gửi đơn...';
  }

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Có lỗi xảy ra, vui lòng thử lại!');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Đặt Món Ngay';
      }
      return;
    }

    const orderId = data.orderId;
    // ✅ FIX: Lưu tạm thông tin để dùng cho phần đánh giá
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
    if (orderIdEl) orderIdEl.textContent   = orderId;

    document.querySelectorAll('.btn-contact-zalo').forEach(link => {
      link.href  = 'https://zalo.me/0901234567';
      link.title = `Nhắn Zalo kèm mã đơn: ${orderId}`;
    });

    if (orderIdEl) {
      orderIdEl.style.fontSize = '1.3rem';
      orderIdEl.style.color    = '#c0392b';
      orderIdEl.style.cursor   = 'pointer';
      orderIdEl.title          = 'Bấm để copy';
      orderIdEl.onclick = () => {
        navigator.clipboard.writeText(orderId);
        orderIdEl.textContent = orderId + ' ✅ Đã copy!';
        setTimeout(() => orderIdEl.textContent = orderId, 2000);
      };
    }

  } catch (err) {
    console.error('Lỗi đặt món:', err);
    alert('Không kết nối được server. Vui lòng thử lại sau ít giây!');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Đặt Món Ngay';
    }
  }
}


// =====================
// =====================
// TÌM KIẾM + LỌC DANH MỤC MENU
// =====================
let currentCategory = 'all';
let currentSearchTerm = '';

function applyMenuFilters() {
  const cards = document.querySelectorAll('.menu-card');
  const noResultEl = document.getElementById('search-no-result');
  let visibleCount = 0;

  cards.forEach(card => {
    const category = card.dataset.category;
    const nameEl = card.querySelector('h3');
    const name = nameEl ? nameEl.textContent.toLowerCase() : '';

    const matchCategory = currentCategory === 'all' || category === currentCategory;
    const matchSearch    = currentSearchTerm === '' || name.includes(currentSearchTerm);

    if (matchCategory && matchSearch) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
   // =====================
// LOAD MENU TỪ API (Firestore)
// =====================
async function loadMenu() {
  const grid    = document.getElementById('menu-grid');
  const loading = document.getElementById('menu-loading');
  if (!grid) return; // không phải trang menu.html

  try {
    const res   = await fetch(`${API_URL}/menu`);
    const items = await res.json();

    loading.style.display = 'none';
    grid.style.display    = 'grid';

    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#999;padding:40px">Chưa có món ăn nào</p>';
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="menu-card" data-category="${item.category}">
        <div class="menu-img-wrap">
          <img src="images/${item.id}.jpg"
               onerror="this.src='https://via.placeholder.com/400x300/fff5f5/c0392b?text=${encodeURIComponent(item.icon || '🍽️')}'"
               alt="${item.name}" class="menu-img-real">
          ${item.badge ? `<span class="badge badge-${item.badge}">${getBadgeLabel(item.badge)}</span>` : ''}
        </div>
        <div class="menu-info">
          <h3>${item.name}</h3>
          <p>${item.desc || ''}</p>
          ${item.soldCount > 0 ? `<div class="order-count">🛒 Đã bán ${item.soldCount} lần hôm nay</div>` : ''}
          <div class="menu-footer">
            <div class="price-wrap">
              <span class="price">${formatPrice(item.price)}</span>
              ${item.oldPrice ? `<span class="price-old">${formatPrice(item.oldPrice)}</span>` : ''}
            </div>
            <button class="btn-add" onclick="addToCart('${item.name}', ${item.price})">+ Thêm</button>
          </div>
        </div>
      </div>
    `).join('');

    // Khởi chạy lại bộ lọc sau khi render xong
    applyMenuFilters();

  } catch (err) {
    console.error('Lỗi tải menu:', err);
    loading.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:40px">⚠️ Không tải được thực đơn. Vui lòng thử lại!</p>';
  }
}

function getBadgeLabel(badge) {
  const labels = {
    hot:     '🔥 Bán chạy',
    new:     '⭐ Nổi bật',
    special: '🎁 Đặc biệt',
    fresh:   '✨ Mới có'
  };
  return labels[badge] || '';
}

  // Hiện thông báo nếu không có kết quả
  if (noResultEl) {
    noResultEl.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

// Bộ lọc danh mục
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    applyMenuFilters();
  });
});

// Ô tìm kiếm
const searchInput = document.getElementById('menu-search');
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
  el.className = `account-msg ${type}`;
  setTimeout(() => el.textContent = '', 3000);
}

async function handleRegister() {
  const name     = document.getElementById('reg-name')?.value.trim();
  const phone    = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm  = document.getElementById('reg-confirm')?.value;

  if (!name || !phone || !password) {
    showAccountMsg('Vui lòng điền đầy đủ thông tin!', 'error'); return;
  }
  if (password.length < 6) {
    showAccountMsg('Mật khẩu tối thiểu 6 ký tự!', 'error'); return;
  }
  if (password !== confirm) {
    showAccountMsg('Mật khẩu không khớp!', 'error'); return;
  }

  const btn = document.querySelector('#tab-register .btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang xử lý...'; }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAccountMsg(data.error || 'Đăng ký thất bại!', 'error');
      return;
    }

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

  if (!phone || !password) {
    showAccountMsg('Vui lòng nhập đầy đủ thông tin!', 'error'); return;
  }

  const btn = document.querySelector('#tab-login .btn-submit');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang đăng nhập...'; }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showAccountMsg(data.error || 'Sai số điện thoại hoặc mật khẩu!', 'error');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('authToken', data.token);

    showAccountMsg('Đăng nhập thành công!');
    setTimeout(() => showLoggedIn(data.user), 1000);

  } catch (err) {
    showAccountMsg('Không kết nối được server!', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔐 Đăng Nhập'; }
  }
}

function showLoggedIn(user) {
  ['tab-login', 'tab-register'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const loggedIn = document.getElementById('tab-logged-in');
  if (loggedIn) loggedIn.style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(b => b.style.display = 'none');

  const nameEl  = document.getElementById('user-name-display');
  const phoneEl = document.getElementById('user-phone-display');
  if (nameEl)  nameEl.textContent  = '👋 ' + user.name;
  if (phoneEl) phoneEl.textContent = '📞 ' + user.phone;
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  location.reload();
}

function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  const el = document.getElementById('tab-logged-in');
  if (el) showLoggedIn(user);
}


// =====================
// LỊCH SỬ ĐƠN HÀNG — GỌI API BACKEND
// =====================
async function renderHistory() {
  const historyList          = document.getElementById('history-list');
  const historyEmpty         = document.getElementById('history-empty');
  const historyLoginRequired = document.getElementById('history-login-required');
  if (!historyList) return; // không phải trang history.html

  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    if (historyLoginRequired) historyLoginRequired.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/phone/${user.phone}`);
    const myOrders = await res.json();

    if (!myOrders || myOrders.length === 0) {
      if (historyEmpty) historyEmpty.style.display = 'block';
      return;
    }

    const statusLabel = {
      new:       '🆕 Đơn mới',
      confirmed: '✅ Đã xác nhận',
      done:      '🎉 Hoàn thành',
      cancelled: '❌ Đã hủy'
    };

    historyList.innerHTML = myOrders.map(order => `
      <div class="history-card">
        <div class="history-header">
          <span class="order-id">Mã đơn: <strong>${order.id}</strong></span>
          <span class="order-status status-${order.status}">
            ${statusLabel[order.status] || order.status}
          </span>
        </div>
        <div class="history-items">
          ${order.items.map(item =>
            `<div class="history-item">
              <span>${item.name} x${item.quantity}</span>
              <span>${formatPrice(item.price * item.quantity)}</span>
            </div>`
          ).join('')}
        </div>
        <div class="history-footer">
          <span>📅 ${new Date(order.createdAt).toLocaleString('vi-VN')}</span>
          <span class="history-total">Tổng: <strong>${formatPrice(order.total)}</strong></span>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Lỗi tải lịch sử đơn hàng:', err);
    if (historyEmpty) {
      historyEmpty.style.display = 'block';
      historyEmpty.querySelector('p').textContent = '⚠️ Không kết nối được server';
    }
  }
}


// =====================
// ĐÁNH GIÁ SAU ĐẶT MÓN
// (⚠️ Vẫn dùng localStorage — backend chưa có API reviews,
//  sẽ chuyển sang API sau khi tạo route /api/reviews)
// =====================
let selectedRating = 0;

function enableReviewDemo() {
  const prompt = document.getElementById('review-prompt');
  const form    = document.getElementById('review-form');
  if (prompt) prompt.style.display = 'none';
  if (form)   form.style.display = 'block';
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
  if (selectedRating === 0) {
    alert('Vui lòng chọn số sao đánh giá!');
    return;
  }

  const orderId = document.getElementById('order-id')?.textContent.replace(' ✅ Đã copy!', '');
  const comment = document.getElementById('review-comment')?.value.trim() || '';

  const savedName  = sessionStorage.getItem('lastOrderCustomerName');
const savedItems = JSON.parse(sessionStorage.getItem('lastOrderItems') || '[]');

const review = {
  id:           'RV' + Date.now().toString().slice(-6),
  orderId:      orderId,
  customerName: savedName ? maskName(savedName) : 'Khách hàng',
  items:        savedItems.join(', '),
  rating:       selectedRating,
  comment:      comment,
  createdAt:    new Date().toISOString()
};
 /////

  const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  reviews.push(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));

  const formEl   = document.getElementById('review-form');
  const thanksEl = document.getElementById('review-thanks');
  if (formEl)   formEl.style.display = 'none';
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

  const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  const noReviews = document.getElementById('no-reviews');

  if (reviews.length === 0) {
    if (noReviews) noReviews.style.display = 'block';
    renderSummary([]);
    return;
  }

  if (noReviews) noReviews.style.display = 'none';

  const sorted = [...reviews].reverse();

  list.innerHTML = sorted.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">👤</div>
        <div class="review-meta">
          <strong>${r.customerName}</strong>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <span class="review-date">${formatReviewDate(r.createdAt)}</span>
      </div>
      ${r.items ? `<div class="review-items">🍽️ ${r.items}</div>` : ''}
      ${r.comment ? `<p class="review-comment">"${r.comment}"</p>` : ''}
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
    avgEl.textContent = '—';
    starsEl.textContent = '☆☆☆☆☆';
    countEl.textContent = '0 đánh giá';
    breakEl.innerHTML = '';
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  avgEl.textContent = avg.toFixed(1);
  starsEl.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  countEl.textContent = `${reviews.length} đánh giá`;

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

function formatReviewDate(dateStr) {
  const date = new Date(dateStr);
  const now  = new Date();
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
const mainNav    = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });

  // Tự đóng menu khi bấm chọn 1 link
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });
}

// =====================
// KHỞI ĐỘNG TẤT CẢ
// =====================
updateCartCount();
renderCart();
checkLoginStatus();
renderHistory();
renderReviews();
loadMenu(); 