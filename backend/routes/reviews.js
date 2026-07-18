const express      = require('express');
const router       = express.Router();
const db           = require('../utils/firebase');
const requireAuth  = require('../middleware/auth');

const reviewsRef = db.collection('reviews');

// Lấy tất cả đánh giá (Public)
router.get('/', async (req, res) => {
  try {
    const snapshot = await reviewsRef
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    res.json(snapshot.docs.map(d => d.data()));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải đánh giá!' });
  }
});

// Gửi đánh giá (Cần đăng nhập)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { orderId, rating, comment, items } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating không hợp lệ!' });
    }

    const id     = 'RV' + Date.now().toString().slice(-6);
    const review = {
      id,
      orderId:      orderId  || '',
      customerName: maskName(req.user.name || 'Khách hàng'),
      userId:       req.user.phone,
      rating:       parseInt(rating),
      comment:      (comment || '').trim().slice(0, 500),
      items:        items || '',
      createdAt:    new Date().toISOString()
    };

    await reviewsRef.doc(id).set(review);
    console.log(`✅ Review mới: ${id} từ ${req.user.phone}`);
    res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá!', review });

  } catch (err) {
    console.error('❌ Lỗi gửi review:', err.message);
    res.status(500).json({ error: 'Lỗi gửi đánh giá!' });
  }
});

function maskName(name) {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name[0] + '***';
  return parts.map((p, i) =>
    (i === 0 || i === parts.length - 1) ? p : p[0] + '.'
  ).join(' ');
}

module.exports = router;