// =====================
// GIỜ MỞ/ĐÓNG CỬA TỰ ĐỘNG
// =====================
const BUSINESS_HOURS = {
  // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
  0: { open: '06:00', close: '22:00' }, // Chủ nhật
  1: { open: '06:00', close: '22:00' }, // Thứ 2
  2: { open: '06:00', close: '22:00' }, // Thứ 3
  3: { open: '06:00', close: '22:00' }, // Thứ 4
  4: { open: '06:00', close: '22:00' }, // Thứ 5
  5: { open: '06:00', close: '22:00' }, // Thứ 6
  6: { open: '06:00', close: '22:00' }, // Thứ 7
};

function checkBusinessHours() {
  const now      = new Date();
  const day      = now.getDay();
  const hours    = BUSINESS_HOURS[day];

  if (!hours) return { isOpen: false, message: 'Hôm nay quán nghỉ' };

  // Tách giờ mở/đóng
  const [openH,  openM]  = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);

  const openTime  = openH  * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  const nowTime   = now.getHours() * 60 + now.getMinutes();

  const isOpen = nowTime >= openTime && nowTime < closeTime;

  // Tính thời gian còn lại
  let timeMsg = '';
  if (isOpen) {
    const remaining = closeTime - nowTime;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    timeMsg = h > 0 ? `Đóng cửa sau ${h} giờ ${m} phút` : `Đóng cửa sau ${m} phút`;
  } else {
    // Tính giờ mở cửa tiếp theo
    if (nowTime < openTime) {
      const wait = openTime - nowTime;
      const h = Math.floor(wait / 60);
      const m = wait % 60;
      timeMsg = h > 0 ? `Mở cửa sau ${h} giờ ${m} phút` : `Mở cửa sau ${m} phút`;
    } else {
      timeMsg = `Mở cửa lúc ${hours.open} ngày mai`;
    }
  }

  return {
    isOpen,
    openTime:  hours.open,
    closeTime: hours.close,
    timeMsg
  };
}

function renderBusinessStatus() {
  const status  = checkBusinessHours();
  const banners = document.querySelectorAll('.business-status');
  const orderBtns = document.querySelectorAll('.btn-submit, .btn-add, .btn-order');

  banners.forEach(banner => {
    if (status.isOpen) {
      banner.className = 'business-status status-open';
      banner.innerHTML = `
        <span class="status-dot"></span>
        <span>🟢 Đang mở cửa · ${status.openTime} – ${status.closeTime}</span>
        <span class="status-time">${status.timeMsg}</span>
      `;
    } else {
      banner.className = 'business-status status-closed';
      banner.innerHTML = `
        <span class="status-dot"></span>
        <span>🔴 Đã đóng cửa · Mở lại lúc ${status.openTime}</span>
        <span class="status-time">${status.timeMsg}</span>
      `;

      // Vô hiệu hóa nút đặt món khi đóng cửa
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

// Chạy ngay và cập nhật mỗi phút
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
// TRANG ORDER.HTML
// =====================
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartTotal = document.getElementById('cart-total');
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    cartEmpty.style.display = 'block';
    cartTotal.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  cartTotal.style.display = 'block';

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
  const total = subtotal + 15000; // phí ship 15k
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('total-price').textContent = formatPrice(total);
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
  document.getElementById('qr-content').textContent = orderId;

  // VietQR API - miễn phí, không cần đăng ký
  // Thay BANK_ID và ACCOUNT_NO bằng thông tin thật của quán
  const BANK_ID = 'VCB';           // Vietcombank
  const ACCOUNT_NO = '1234567890'; // Số tài khoản
  const ACCOUNT_NAME = 'NGUYEN VAN A';

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${total}&addInfo=${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  document.getElementById('qr-img').src = qrUrl;
}

// =====================
// GỬI ĐƠN HÀNG
// =====================
function submitOrder() {
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  const note = document.getElementById('order-note').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;

  // Validate
  if (!name) { alert('Vui lòng nhập họ tên!'); return; }
  if (!phone) { alert('Vui lòng nhập số điện thoại!'); return; }
  if (cart.length === 0) { alert('Giỏ hàng trống!'); return; }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;
  const orderId = 'DH' + Date.now().toString().slice(-5);

  const orderData = {
    id: orderId,
    customer: { name, phone, address, note },
    items: cart,
    total,
    payment,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  // Lưu tạm vào localStorage (sau này gửi lên backend)
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push(orderData);
  localStorage.setItem('orders', JSON.stringify(orders));

  // Xóa giỏ hàng
  cart = [];
  saveCart();
  updateCartCount();

  // Hiện thông báo thành công
  document.getElementById('order-form').style.display = 'none';
  document.getElementById('order-success').style.display = 'block';
  document.getElementById('order-id').textContent = orderId;
}

// =====================
// LỌC DANH MỤC MENU
// =====================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.dataset.category;
    document.querySelectorAll('.menu-card').forEach(card => {
      card.style.display =
        (category === 'all' || card.dataset.category === category) ? 'block' : 'none';
    });
  });
});

// =====================
// KHỞI ĐỘNG
// =====================
updateCartCount();
renderCart();
// =====================
// TÀI KHOẢN KHÁCH HÀNG
// =====================
function switchTab(tab) {
  document.getElementById('tab-login').style.display = 'none';
  document.getElementById('tab-register').style.display = 'none';
  document.getElementById('tab-logged-in').style.display = 'none';
  document.getElementById(`tab-${tab}`).style.display = 'block';

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const tabIndex = tab === 'login' ? 0 : 1;
  document.querySelectorAll('.tab-btn')[tabIndex]?.classList.add('active');
}

function showAccountMsg(msg, type = 'success') {
  const el = document.getElementById('account-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = `account-msg ${type}`;
  setTimeout(() => el.textContent = '', 3000);
}

function handleRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (!name || !phone || !password) {
    showAccountMsg('Vui lòng điền đầy đủ thông tin!', 'error'); return;
  }
  if (password.length < 6) {
    showAccountMsg('Mật khẩu tối thiểu 6 ký tự!', 'error'); return;
  }
  if (password !== confirm) {
    showAccountMsg('Mật khẩu không khớp!', 'error'); return;
  }

  // Lưu user vào localStorage (tạm thời, sau dùng Firebase)
  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.find(u => u.phone === phone)) {
    showAccountMsg('Số điện thoại đã được đăng ký!', 'error'); return;
  }

  users.push({ name, phone, password });
  localStorage.setItem('users', JSON.stringify(users));

  showAccountMsg('Đăng ký thành công! Vui lòng đăng nhập.');
  setTimeout(() => switchTab('login'), 1500);
}

function handleLogin() {
  const phone    = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user  = users.find(u => u.phone === phone && u.password === password);

  if (!user) {
    showAccountMsg('Sai số điện thoại hoặc mật khẩu!', 'error'); return;
  }

  // Lưu session
  localStorage.setItem('currentUser', JSON.stringify(user));
  showAccountMsg('Đăng nhập thành công!');
  setTimeout(() => showLoggedIn(user), 1000);
}

function showLoggedIn(user) {
  document.getElementById('tab-login').style.display    = 'none';
  document.getElementById('tab-register').style.display = 'none';
  document.getElementById('tab-logged-in').style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(b => b.style.display = 'none');

  document.getElementById('user-name-display').textContent  = '👋 ' + user.name;
  document.getElementById('user-phone-display').textContent = '📞 ' + user.phone;
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  location.reload();
}

// Kiểm tra đã đăng nhập chưa khi mở account.html
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  const loggedInTab = document.getElementById('tab-logged-in');
  if (loggedInTab) showLoggedIn(user);
}

// =====================
// LỊCH SỬ ĐƠN HÀNG
// =====================
function renderHistory() {
  const historyList          = document.getElementById('history-list');
  const historyEmpty         = document.getElementById('history-empty');
  const historyLoginRequired = document.getElementById('history-login-required');
  if (!historyList) return;

  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    historyLoginRequired.style.display = 'block';
    return;
  }

  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  // Lọc đơn theo SĐT của user
  const myOrders = orders
    .filter(o => o.customer.phone === user.phone)
    .reverse(); // mới nhất lên đầu

  if (myOrders.length === 0) {
    historyEmpty.style.display = 'block';
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
}

// Khởi động thêm
checkLoginStatus();
renderHistory();
// =====================
// TẠO LINK ZALO VỚI NỘI DUNG SẴN
// =====================
function generateZaloLink(orderId) {
  const order = JSON.parse(localStorage.getItem('orders') || '[]')
    .find(o => o.id === orderId);

  if (!order) return 'https://zalo.me/0901234567';

  const itemsList = order.items
    .map(i => `${i.name} x${i.quantity}`)
    .join(', ');

  // Nội dung tin nhắn mẫu
  const message =
    `Xin chào quán! Tôi vừa đặt món:\n` +
    `📋 Mã đơn: ${order.id}\n` +
    `🍽️ Món: ${itemsList}\n` +
    `💰 Tổng: ${order.total.toLocaleString('vi-VN')}đ\n` +
    `👤 Tên: ${order.customer.name}\n` +
    `📞 SĐT: ${order.customer.phone}\n` +
    `📍 Địa chỉ: ${order.customer.address || 'Đến lấy tại quán'}`;

  // Zalo không hỗ trợ pre-fill text
  // nên chỉ mở chat, khách tự copy mã đơn
  return 'https://zalo.me/0901234567';
}

// Cập nhật hàm submitOrder - thêm nút Zalo sau khi đặt xong
function submitOrder() {
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

  const total   = cart.reduce((sum, i) => sum + i.price * i.quantity, 0) + 15000;
  const orderId = 'DH' + Date.now().toString().slice(-5);

  const orderData = {
    id: orderId,
    customer: { name, phone, address, note },
    items: [...cart],
    total,
    payment,
    status:    'new',
    createdAt: new Date().toISOString()
  };

  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push(orderData);
  localStorage.setItem('orders', JSON.stringify(orders));

  cart = [];
  saveCart();
  updateCartCount();

  // Hiện thành công
  const formEl    = document.getElementById('order-form');
  const successEl = document.getElementById('order-success');
  const orderIdEl = document.getElementById('order-id');
  if (formEl)    formEl.style.display    = 'none';
  if (successEl) successEl.style.display = 'block';
  if (orderIdEl) orderIdEl.textContent   = orderId;

  // Cập nhật link Zalo với mã đơn
  const zaloLinks = document.querySelectorAll('.btn-contact-zalo');
  zaloLinks.forEach(link => {
    link.href = `https://zalo.me/0901234567`;
    // Thêm mã đơn vào title để khách biết cần gửi gì
    link.title = `Nhắn Zalo kèm mã đơn: ${orderId}`;
  });

  // Hiện mã đơn to để khách dễ copy gửi Zalo
  if (orderIdEl) {
    orderIdEl.style.fontSize   = '1.3rem';
    orderIdEl.style.color      = '#c0392b';
    orderIdEl.style.cursor     = 'pointer';
    orderIdEl.title            = 'Bấm để copy';
    orderIdEl.onclick = () => {
      navigator.clipboard.writeText(orderId);
      orderIdEl.textContent = orderId + ' ✅ Đã copy!';
      setTimeout(() => orderIdEl.textContent = orderId, 2000);
    };
  }
}
// =====================
// ĐÁNH GIÁ SAU ĐẶT MÓN
// =====================
let selectedRating = 0;

// Demo: bấm để "giả lập" đã nhận món xong
function enableReviewDemo() {
  document.getElementById('review-prompt').style.display = 'none';
  document.getElementById('review-form').style.display = 'block';
}

// Chọn số sao
document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.value);
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
    });
  });

  // Hover preview
  star.addEventListener('mouseenter', () => {
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('hover', parseInt(s.dataset.value) <= parseInt(star.dataset.value));
    });
  });
  star.addEventListener('mouseleave', () => {
    document.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
  });
});

// Gửi đánh giá
function submitReview() {
  if (selectedRating === 0) {
    alert('Vui lòng chọn số sao đánh giá!');
    return;
  }

  const orderId  = document.getElementById('order-id')?.textContent.replace(' ✅ Đã copy!', '');
  const comment  = document.getElementById('review-comment')?.value.trim() || '';

  // Lấy thông tin đơn để hiện tên khách
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const order  = orders.find(o => o.id === orderId);

  const review = {
    id:        'RV' + Date.now().toString().slice(-6),
    orderId:   orderId,
    customerName: order ? maskName(order.customer.name) : 'Khách hàng',
    items:     order ? order.items.map(i => i.name).join(', ') : '',
    rating:    selectedRating,
    comment:   comment,
    createdAt: new Date().toISOString()
  };

  // ⚙️ KHI DEPLOY THẬT: thay localStorage bằng API call
  // Ví dụ: await fetch('/api/reviews', { method: 'POST', body: JSON.stringify(review) })
  const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  reviews.push(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));

  // Hiện cảm ơn
  document.getElementById('review-form').style.display = 'none';
  document.getElementById('review-thanks').style.display = 'block';
}

// Ẩn 1 phần tên để bảo mật: "Nguyễn Văn A" -> "Nguyễn V. A"
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
  const list  = document.getElementById('reviews-list');
  if (!list) return; // không phải trang reviews

  // ⚙️ KHI DEPLOY THẬT: thay bằng fetch('/api/reviews')
  const reviews = JSON.parse(localStorage.getItem('reviews')) || [];

  const noReviews = document.getElementById('no-reviews');

  if (reviews.length === 0) {
    noReviews.style.display = 'block';
    renderSummary([]);
    return;
  }

  noReviews.style.display = 'none';

  // Mới nhất lên đầu
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

  // Breakdown từng mức sao
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

// Khởi động
renderReviews();