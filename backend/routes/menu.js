const express = require('express');
const router  = express.Router();

// Dữ liệu menu mặc định
let menuItems = [
  { id: 1, name: 'Cơm Tấm Sườn Bì',  price: 35000, category: 'com',    icon: '🍚', desc: 'Sườn nướng mềm, bì trộn thơm' },
  { id: 2, name: 'Cơm Gà Xối Mỡ',    price: 40000, category: 'com',    icon: '🍗', desc: 'Gà chiên giòn, cơm trắng dẻo' },
  { id: 3, name: 'Cơm Tấm Đặc Biệt', price: 50000, category: 'com',    icon: '🥩', desc: 'Sườn + bì + chả trứng' },
  { id: 4, name: 'Bún Bò Huế',        price: 40000, category: 'bun-mi', icon: '🍜', desc: 'Nước lèo đậm đà, thịt bò mềm' },
  { id: 5, name: 'Mì Xào Hải Sản',   price: 45000, category: 'bun-mi', icon: '🍝', desc: 'Tôm, mực, nghêu xào mì vàng' },
  { id: 6, name: 'Nước Mía',          price: 15000, category: 'nuoc',   icon: '🧃', desc: 'Nước mía tươi mát' },
  { id: 7, name: 'Trà Sữa Trân Châu', price: 25000, category: 'nuoc',   icon: '🧋', desc: 'Trà sữa béo, trân châu đen' },
];

// ===== LẤY TOÀN BỘ MENU =====
// GET /api/menu
router.get('/', (req, res) => {
  const { category } = req.query;
  const result = category
    ? menuItems.filter(item => item.category === category)
    : menuItems;
  res.json(result);
});

// ===== LẤY 1 MÓN =====
// GET /api/menu/:id
router.get('/:id', (req, res) => {
  const item = menuItems.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Không tìm thấy món!' });
  res.json(item);
});

// ===== THÊM MÓN MỚI =====
// POST /api/menu
router.post('/', (req, res) => {
  const { name, price, category, icon, desc } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Thiếu thông tin món ăn!' });
  }

  const newItem = {
    id: Math.max(...menuItems.map(i => i.id), 0) + 1,
    name, price: parseInt(price), category,
    icon: icon || '🍽️',
    desc: desc || ''
  };

  menuItems.push(newItem);
  res.status(201).json({ message: 'Thêm món thành công!', item: newItem });
});

// ===== SỬA MÓN =====
// PUT /api/menu/:id
router.put('/:id', (req, res) => {
  const index = menuItems.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Không tìm thấy món!' });

  menuItems[index] = { ...menuItems[index], ...req.body, id: menuItems[index].id };
  res.json({ message: 'Cập nhật thành công!', item: menuItems[index] });
});

// ===== XÓA MÓN =====
// DELETE /api/menu/:id
router.delete('/:id', (req, res) => {
  const index = menuItems.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Không tìm thấy món!' });

  menuItems.splice(index, 1);
  res.json({ message: 'Xóa món thành công!' });
});

module.exports = router;