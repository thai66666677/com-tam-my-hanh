const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const db       = require('../utils/firebase');

const usersRef = db.collection('users');

// ===== ĐĂNG KÝ KHÁCH HÀNG =====
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự!' });
    }

    // Kiểm tra SĐT đã tồn tại chưa
    const existing = await usersRef.where('phone', '==', phone).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Số điện thoại đã được đăng ký!' });
    }

    // Mã hóa mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      phone,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Dùng phone làm Document ID (đảm bảo không trùng)
    await usersRef.doc(phone).set(newUser);

    res.json({ message: 'Đăng ký thành công!', user: { name, phone } });

  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại!' });
  }
});

// ===== ĐĂNG NHẬP KHÁCH HÀNG =====
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    const doc = await usersRef.doc(phone).get();

    if (!doc.exists) {
      return res.status(401).json({ error: 'Sai số điện thoại hoặc mật khẩu!' });
    }

    const user = doc.data();

    // So sánh mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Sai số điện thoại hoặc mật khẩu!' });
    }

    const token = jwt.sign(
      { phone: user.phone, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: { name: user.name, phone: user.phone }
    });

  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại!' });
  }
});

// ===== ĐĂNG NHẬP ADMIN (giữ nguyên, không cần Firestore) =====
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