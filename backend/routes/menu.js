const express = require('express');
const router  = express.Router();
const db      = require('../utils/firebase');

const menuRef = db.collection('menu');

// Dữ liệu mặc định khi Firestore chưa có món nào
const defaultMenu = [
  { id: '1', name: 'Cơm Tấm Sườn Bì',  price: 35000, category: 'com',    icon: '🍚', desc: 'Sườn nướng mềm, bì trộn thơm', badge: 'hot',     soldCount: 128 },
  { id: '2', name: 'Cơm Gà Xối Mỡ',    price: 40000, category: 'com',    icon: '🍗', desc: 'Gà chiên giòn, cơm trắng dẻo', badge: 'new',     soldCount: 0   },
  { id: '3', name: 'Cơm Tấm Đặc Biệt', price: 50000, category: 'com',    icon: '🥩', desc: 'Sườn + bì + chả trứng',        badge: 'special', oldPrice: 65000, soldCount: 0 },
  { id: '4', name: 'Bún Bò Huế',        price: 40000, category: 'bun-mi', icon: '🍜', desc: 'Nước lèo đậm đà, thịt bò mềm', badge: 'hot',    soldCount: 64  },
  { id: '5', name: 'Mì Xào Hải Sản',   price: 45000, category: 'bun-mi', icon: '🍝', desc: 'Tôm, mực, nghêu xào mì vàng',  badge: '',        soldCount: 0   },
  { id: '6', name: 'Nước Mía',          price: 15000, category: 'nuoc',   icon: '🧃', desc: 'Nước mía tươi mát',             badge: '',        soldCount: 0   },
  { id: '7', name: 'Trà Sữa Trân Châu', price: 25000, category: 'nuoc',  icon: '🧋', desc: 'Trà sữa béo, trân châu đen',   badge: 'fresh',   soldCount: 0   },
];

// Khởi tạo dữ liệu mặc định nếu Firestore chưa có
async function initDefaultMenu() {
  const snapshot = await menuRef.get();
  if (snapshot.empty) {
    console.log('📦 Khởi tạo menu mặc định vào Firestore...');
    const batch = db.batch();
    defaultMenu.forEach(item => {
      batch.set(menuRef.doc(item.id), item);
    });
    await batch.commit();
    console.log('✅ Menu mặc định đã được tạo!');
  }
}
initDefaultMenu();

// ===== LẤY TOÀN BỘ MENU =====
// GET /api/menu
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = menuRef.orderBy('id');
    if (category) query = query.where('category', '==', category);

    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => doc.data());
    res.json(items);
  } catch (err) {
    console.error('Lỗi tải menu:', err);
    res.status(500).json({ error: 'Lỗi tải menu!' });
  }
});

// ===== LẤY 1 MÓN =====
// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await menuRef.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy món!' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải món!' });
  }
});

// ===== THÊM MÓN MỚI =====
// POST /api/menu
router.post('/', async (req, res) => {
  try {
    const { name, price, category, icon, desc, badge, oldPrice, soldCount } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Thiếu thông tin món ăn!' });
    }

    // Tạo ID tự động từ timestamp
    const id = Date.now().toString();
    const newItem = {
      id,
      name,
      price: parseInt(price),
      category,
      icon:      icon      || '🍽️',
      desc:      desc      || '',
      badge:     badge     || '',
      oldPrice:  oldPrice  ? parseInt(oldPrice) : null,
      soldCount: soldCount ? parseInt(soldCount) : 0,
      createdAt: new Date().toISOString()
    };

    await menuRef.doc(id).set(newItem);
    res.status(201).json({ message: 'Thêm món thành công!', item: newItem });
  } catch (err) {
    console.error('Lỗi thêm món:', err);
    res.status(500).json({ error: 'Lỗi thêm món!' });
  }
});

// ===== SỬA MÓN =====
// PUT /api/menu/:id
router.put('/:id', async (req, res) => {
  try {
    const docRef = menuRef.doc(req.params.id);
    const doc    = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy món!' });

    const updated = {
      ...doc.data(),
      ...req.body,
      id: req.params.id // giữ nguyên id
    };
    await docRef.set(updated);
    res.json({ message: 'Cập nhật thành công!', item: updated });
  } catch (err) {
    console.error('Lỗi sửa món:', err);
    res.status(500).json({ error: 'Lỗi cập nhật món!' });
  }
});

// ===== XÓA MÓN =====
// DELETE /api/menu/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await menuRef.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy món!' });

    await menuRef.doc(req.params.id).delete();
    res.json({ message: 'Xóa món thành công!' });
  } catch (err) {
    console.error('Lỗi xóa món:', err);
    res.status(500).json({ error: 'Lỗi xóa món!' });
  }
});

module.exports = router;