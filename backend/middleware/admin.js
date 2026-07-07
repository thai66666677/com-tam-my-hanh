const jwt = require('jsonwebtoken');

module.exports = function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Chưa đăng nhập!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      console.warn(`⚠️ Truy cập trái phép: ${decoded.phone}`);
      return res.status(403).json({ error: 'Không có quyền truy cập!' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ!' });
  }
};