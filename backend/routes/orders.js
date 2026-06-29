const express  = require('express');
const router   = express.Router();
const db       = require('../utils/firebase');
const sendTelegram          = require('../utils/telegram');
const { sendZaloNotification } = require('../utils/zalo');

const ordersRef = db.collection('orders');

// ===== 1. LẤY TẤT CẢ ĐƠN (Admin) =====
router.get('/', async (req, res) => {
  try {
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();
    const orders   = snapshot.docs.map(doc => doc.data());
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi tải đơn hàng!' });
  }
});

// ===== 2. THỐNG KÊ DOANH THU ← PHẢI TRƯỚC /:id =====
router.get('/stats', async (req, res) => {
  try {
    const snapshot = await ordersRef.get();
    const orders   = snapshot.docs.map(doc => doc.data());

    const now   = new Date();
    const today = now.toDateString();

    // 7 ngày gần nhất
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label   = i === 0 ? 'Hôm nay'
                    : i === 1 ? 'Hôm qua'
                    : `${d.getDate()}/${d.getMonth() + 1}`;

      const dayOrders = orders.filter(o =>
        o.status === 'done' &&
        new Date(o.createdAt).toDateString() === dateStr
      );
      last7Days.push({
        label,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        count:   dayOrders.length
      });
    }

    // Hôm nay
    const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todayDone    = todayOrders.filter(o => o.status === 'done');
    const todayRevenue = todayDone.reduce((sum, o) => sum + o.total, 0);

    // Tổng tất cả
    const totalRevenue = orders
      .filter(o => o.status === 'done')
      .reduce((sum, o) => sum + o.total, 0);

    // Món bán chạy nhất
    const itemCount = {};
    orders.filter(o => o.status === 'done').forEach(o => {
      o.items.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
      });
    });
    const topItems = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Tỷ lệ trạng thái
    const statusCount = {
      new:       orders.filter(o => o.status === 'new').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      done:      orders.filter(o => o.status === 'done').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    res.json({
      last7Days,
      today: {
        revenue:   todayRevenue,
        orders:    todayOrders.length,
        done:      todayDone.length,
        newOrders: todayOrders.filter(o => o.status === 'new').length
      },
      total: { revenue: totalRevenue, orders: orders.length },
      topItems,
      statusCount
    });

  } catch (err) {
    console.error('Lỗi thống kê:', err);
    res.status(500).json({ error: 'Lỗi lấy thống kê!' });
  }
});

// ===== 3. LẤY ĐƠN THEO SĐT ← PHẢI TRƯỚC /:id =====
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

// ===== 4. LẤY 1 ĐƠN THEO ID ← SAU CÙNG =====
router.get('/:id', async (req, res) => {
  try {
    const doc = await ordersRef.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }
    res.json(doc.data());
  } catch (err) {
    console.error('Lỗi lấy đơn:', err);
    res.status(500).json({ error: 'Lỗi server!' });
  }
});

// ===== 5. TẠO ĐƠN MỚI =====
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
      status:    'new',
      createdAt: new Date().toISOString()
    };

    await ordersRef.doc(orderId).set(newOrder);

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

// ===== 6. CẬP NHẬT TRẠNG THÁI (Admin) =====
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