const requireAuth = require('../middleware/auth');
const express  = require('express');
const router   = express.Router();
const db       = require('../utils/firebase');
const sendTelegram             = require('../utils/telegram');
const { sendZaloNotification } = require('../utils/zalo');

const ordersRef = db.collection('orders');

// 1. Tất cả đơn (Admin)
router.get('/', async (req, res) => {
  try {
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();
    res.json(snapshot.docs.map(doc => doc.data()));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải đơn hàng!' });
  }
});

// 2. Thống kê ← TRƯỚC /:id
router.get('/stats', async (req, res) => {
  try {
    const snapshot = await ordersRef.get();
    const orders   = snapshot.docs.map(doc => doc.data());
    const now      = new Date();
    const today    = now.toDateString();

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d       = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label   = i === 0 ? 'Hôm nay' : i === 1 ? 'Hôm qua' : `${d.getDate()}/${d.getMonth()+1}`;
      const dayOrders = orders.filter(o => o.status === 'done' && new Date(o.createdAt).toDateString() === dateStr);
      last7Days.push({ label, revenue: dayOrders.reduce((s,o) => s+o.total,0), count: dayOrders.length });
    }

    const todayOrders  = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todayDone    = todayOrders.filter(o => o.status === 'done');
    const itemCount    = {};
    orders.filter(o => o.status === 'done').forEach(o => {
      o.items.forEach(item => { itemCount[item.name] = (itemCount[item.name]||0) + item.quantity; });
    });

    res.json({
      last7Days,
      today: {
        revenue:   todayDone.reduce((s,o) => s+o.total, 0),
        orders:    todayOrders.length,
        done:      todayDone.length,
        newOrders: todayOrders.filter(o => o.status==='new').length
      },
      total: {
        revenue: orders.filter(o=>o.status==='done').reduce((s,o)=>s+o.total,0),
        orders:  orders.length
      },
      topItems: Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count})),
      statusCount: {
        new:       orders.filter(o=>o.status==='new').length,
        confirmed: orders.filter(o=>o.status==='confirmed').length,
        done:      orders.filter(o=>o.status==='done').length,
        cancelled: orders.filter(o=>o.status==='cancelled').length,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi thống kê!' });
  }
});

// 3. Theo SĐT ← TRƯỚC /:id — ĐÃ SỬA bỏ orderBy
router.get('/phone/:phone', async (req, res) => {
  try {
    const snapshot = await ordersRef
      .where('customer.phone', '==', req.params.phone)
      .get();
    const orders = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    console.error('❌ Lỗi /phone:', err.message);
    res.status(500).json({ error: 'Lỗi tải lịch sử đơn!' });
  }
});

// 4. Theo token ← TRƯỚC /:id — ĐÃ SỬA bỏ orderBy
router.get('/my-orders', requireAuth, async (req, res) => {
  try {
    const snapshot = await ordersRef
      .where('userId', '==', req.user.phone)
      .get();
    const orders = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(`✅ /my-orders: ${orders.length} đơn cho ${req.user.phone}`);
    res.json(orders);
  } catch (err) {
    console.error('❌ Lỗi /my-orders:', err.message);
    res.status(500).json({ error: 'Lỗi tải lịch sử!' });
  }
});

// 5. Theo ID ← SAU CÙNG
router.get('/:id', async (req, res) => {
  try {
    const doc = await ordersRef.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy đơn!' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server!' });
  }
});

// 6. Tạo đơn mới
router.post('/', requireAuth, async (req, res) => {
  try {
    const { customer, items, total, payment } = req.body;
    if (!customer?.name || !customer?.phone) return res.status(400).json({ error: 'Thiếu thông tin!' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'Giỏ hàng trống!' });

    const orderId  = 'DH' + Date.now().toString().slice(-5);
    const newOrder = {
      id:        orderId,
      userId:    req.user.phone,
      customer,
      items,
      total,
      payment,
      status:    'new',
      createdAt: new Date().toISOString()
    };

    await ordersRef.doc(orderId).set(newOrder);
    Promise.allSettled([sendZaloNotification(newOrder), sendTelegram(newOrder)]).catch(()=>{});
    res.status(201).json({ message: 'Đặt món thành công!', orderId });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo đơn!' });
  }
});

// 7. Cập nhật trạng thái (Admin)
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new','confirmed','done','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
    }
    const docRef = ordersRef.doc(req.params.id);
    if (!(await docRef.get()).exists) return res.status(404).json({ error: 'Không tìm thấy đơn!' });
    await docRef.update({ status });
    res.json({ message: 'Cập nhật thành công!' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật!' });
  }
});

module.exports = router;