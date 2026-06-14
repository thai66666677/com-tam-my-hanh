const express  = require('express');
const router   = express.Router();
const sendTelegram = require('../utils/telegram');

// Lưu đơn hàng trong bộ nhớ (sau thay bằng Firebase)
let orders = [];

// ===== LẤY TẤT CẢ ĐƠN (Admin) =====
// GET /api/orders
router.get('/', (req, res) => {
  // Sắp xếp mới nhất lên đầu
  const sorted = [...orders].reverse();
  res.json(sorted);
});

// ===== LẤY ĐƠN THEO SĐT (Khách hàng) =====
// GET /api/orders/phone/:phone
router.get('/phone/:phone', (req, res) => {
  const myOrders = orders
    .filter(o => o.customer.phone === req.params.phone)
    .reverse();
  res.json(myOrders);
});

// ===== TẠO ĐƠN MỚI =====
// POST /api/orders
router.post('/', async (req, res) => {
  const { customer, items, total, payment } = req.body;

  // Validate
  if (!customer?.name || !customer?.phone) {
    return res.status(400).json({ error: 'Thiếu thông tin khách hàng!' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống!' });
  }

  const newOrder = {
    id:        'DH' + Date.now().toString().slice(-5),
    customer,
    items,
    total,
    payment,
    status:    'new',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  // Gửi thông báo Telegram cho chủ quán
  try {
    await sendTelegram(newOrder);
  } catch (err) {
    console.log('Telegram lỗi:', err.message);
  }

  res.status(201).json({ 
    message: 'Đặt món thành công!', 
    orderId: newOrder.id 
  });
});

// ===== CẬP NHẬT TRẠNG THÁI (Admin) =====
// PATCH /api/orders/:id
router.patch('/:id', (req, res) => {
  const { status } = req.body;
  const validStatus = ['new', 'confirmed', 'done', 'cancelled'];

  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
  }

  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
  }

  orders[index].status = status;
  res.json({ message: 'Cập nhật thành công!', order: orders[index] });
});

module.exports = router;