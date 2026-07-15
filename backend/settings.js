const express      = require('express');
const router       = express.Router();
const db           = require('../utils/firebase');
const requireAdmin = require('../middleware/admin');

const settingsRef = db.collection('settings');

// ===== LẤY CÀI ĐẶT (Public — frontend dùng) =====
router.get('/', async (req, res) => {
  try {
    const doc = await settingsRef.doc('site').get();
    if (!doc.exists) {
      // Trả về mặc định nếu chưa có
      return res.json({
        backgrounds: {
          home:    '',
          menu:    '',
          order:   '',
          account: '',
          history: '',
          reviews: ''
        },
        siteName:  'Cơm Tấm Mỹ Hạnh',
        slogan:    'Hương vị đậm đà, giao tận nơi nhanh chóng',
        logoEmoji: '🍚'
      });
    }
    res.json(doc.data());
  } catch (err) {
    console.error('❌ Lỗi GET settings:', err.message);
    res.status(500).json({ error: 'Lỗi tải cài đặt!' });
  }
});

// ===== LƯU CÀI ĐẶT (Admin only) =====
router.put('/', requireAdmin, async (req, res) => {
  try {
    const settings = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    await settingsRef.doc('site').set(settings, { merge: true });
    console.log('✅ Cập nhật cài đặt site');
    res.json({ message: 'Lưu cài đặt thành công!', settings });
  } catch (err) {
    console.error('❌ Lỗi PUT settings:', err.message);
    res.status(500).json({ error: 'Lỗi lưu cài đặt!' });
  }
});

module.exports = router;