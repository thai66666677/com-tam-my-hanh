const express = require('express');
const router  = express.Router();
const db      = require('../utils/firebase');
const sendTelegram = require('../utils/telegram');
const { sendZaloNotification } = require('../utils/zalo');

const ordersRef = db.collection('orders');

// ===== LẤY TẤT CẢ ĐƠN (Admin) =====
router.get('/', async (req, res) => {
  try {
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();
    const orders = snapshot.docs.map(doc => doc.data());
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải đơn hàng!' });
  }
});

// ===== LẤY ĐƠN THEO SĐT (Khách hàng) =====
router.get('/phone/:phone', async (req, res) => {
  try {
    const snapshot = await ordersRef
      .where('customer.phone', '==', req.params.phone)
      .orderBy('createdAt', 'desc')
      .get();
    const orders = snapshot.docs.map(doc => doc.data());
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải lịch sử đơn!' });
  }
});

// ===== TẠO ĐƠN MỚI =====
router.post('/', async (req, res) => {
  try {
    const { customer, items, total, payment } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ error: 'Thiếu thông tin khách hàng!' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống!' });
    }

    const orderId = 'DH' + Date.now().toString().slice(-5);

    const newOrder = {
      id: orderId,
      customer,
      items,
      total,
      payment,
      status: 'new',
      createdAt: new Date().toISOString()
    };

    await ordersRef.doc(orderId).set(newOrder);

    // Gửi thông báo (không chặn response)
    Promise.allSettled([
      sendZaloNotification(newOrder),
      sendTelegram(newOrder)
    ]).catch(() => {});

    res.status(201).json({ message: 'Đặt món thành công!', orderId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tạo đơn hàng!' });
  }
});

// ===== CẬP NHẬT TRẠNG THÁI (Admin) =====
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ['new', 'confirmed', 'done', 'cancelled'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
    }

    const docRef = ordersRef.doc(req.params.id);
    const doc    = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }

    await docRef.update({ status });
    const updated = await docRef.get();

    res.json({ message: 'Cập nhật thành công!', order: updated.data() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi cập nhật đơn hàng!' });
  }
});

module.exports = router;