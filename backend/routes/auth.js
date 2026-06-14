const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// Lưu tạm users trong bộ nhớ (sau thay bằng Firebase)
let users = [];

// ===== ĐĂNG KÝ KHÁCH HÀNG =====
// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin!' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự!' });
  }

  const existing = users.find(u => u.phone === phone);
  if (existing) {
    return res.status(400).json({ error: 'Số điện thoại đã được đăng ký!' });
  }

  const newUser = { id: Date.now(), name, phone, password };
  users.push(newUser);

  res.json({ message: 'Đăng ký thành công!', user: { name, phone } });
});

// ===== ĐĂNG NHẬP KHÁCH HÀNG =====
// POST /api/auth/login
router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  const user = users.find(u => u.phone === phone && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Sai số điện thoại hoặc mật khẩu!' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ message: 'Đăng nhập thành công!', token, user: { name: user.name, phone: user.phone } });
});

// ===== ĐĂNG NHẬP ADMIN =====
// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Sai tài khoản admin!' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ message: 'Đăng nhập admin thành công!', token });
});

module.exports = router;