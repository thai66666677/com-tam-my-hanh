const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const xss      = require('xss');
const router   = express.Router();
const db       = require('../utils/firebase');

const usersRef = db.collection('users');

// authLimiter riêng cho auth route
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Sai mật khẩu quá nhiều lần, thử lại sau 15 phút!' }
});

// ===== ĐĂNG KÝ =====
router.post('/register', async (req, res) => {
  try {
    // Sanitize XSS trước khi xử lý
    const name     = xss(req.body.name    || '').trim();
    const phone    = xss(req.body.phone   || '').trim();
    const password =     req.body.password || '';

    // Validate
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin!' });
    }
    if (!/^[0-9]{10,11}$/.test(phone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự!' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Tên quá dài!' });
    }

    // Kiểm tra SĐT đã tồn tại
    const existing = await usersRef.where('phone', '==', phone).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Số điện thoại đã được đăng ký!' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds = mạnh hơn

    await usersRef.doc(phone).set({
      name,
      phone,
      password:  hashedPassword,
      createdAt: new Date().toISOString()
    });

    console.log(`✅ User mới đăng ký: ${phone} lúc ${new Date().toISOString()}`);
    res.status(201).json({ message: 'Đăng ký thành công!', user: { name, phone } });

  } catch (err) {
    console.error('❌ Lỗi đăng ký:', err.message);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại!' });
  }
});

// ===== ĐĂNG NHẬP =====
router.post('/login', async (req, res) => {
  try {
    const phone    = xss(req.body.phone || '').trim();
    const password =     req.body.password || '';

    if (!phone || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    const doc = await usersRef.doc(phone).get();

    // Luôn dùng bcrypt.compare dù user không tồn tại
    // → tránh timing attack (đoán SĐT có tồn tại không)
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attack.xxxxxxxxxx';
    const hash      = doc.exists ? doc.data().password : dummyHash;
    const isMatch   = await bcrypt.compare(password, hash);

    if (!doc.exists || !isMatch) {
      console.warn(`⚠️ Login thất bại: ${phone} lúc ${new Date().toISOString()}`);
      return res.status(401).json({ error: 'Sai số điện thoại hoặc mật khẩu!' });
    }

    const user  = doc.data();
    const token = jwt.sign(
      { phone: user.phone, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User đăng nhập: ${phone}`);
    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: { name: user.name, phone: user.phone }
    });

  } catch (err) {
    console.error('❌ Lỗi đăng nhập:', err.message);
    res.status(500).json({ error: 'Lỗi server, vui lòng thử lại!' });
  }
});

// ===== ĐĂNG NHẬP ADMIN =====
router.post('/admin-login', authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu thông tin!' });
  }

  const validUser = username === process.env.ADMIN_USER;
  const validPass = password === process.env.ADMIN_PASS;

  if (!validUser || !validPass) {
    console.warn(`⚠️ Admin login thất bại từ IP: ${req.ip} lúc ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu!' });
  }

  const token = jwt.sign(
    { role: 'admin', username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  console.log(`✅ Admin đăng nhập lúc ${new Date().toISOString()}`);
  res.json({ message: 'Đăng nhập thành công!', token });
});

module.exports = router;