const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// =====================
// 1. SECURITY HEADERS
// =====================
  app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:", "blob:"],
      connectSrc:  ["'self'", "https://com-tam-my-hanh.onrender.com"],
    }
  },
  permissionsPolicy: {
    features: {
      camera:         [],  // Không dùng camera
      microphone:     [],  // Không dùng mic
      geolocation:    [],  // Không dùng GPS
      payment:        [],  // Không dùng Payment API
      usb:            [],  // Không dùng USB
    }
  }
}));

// =====================
// 2. LOGGING
// =====================
app.use(morgan('combined'));

// =====================
// 3. CORS
// =====================
const allowedOrigins = [
  'https://com-tam-my-hanh.vercel.app',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Domain không được phép!'));
    }
  },
  credentials: true
}));

// =====================
// 4. BODY PARSER (giới hạn 1MB)
// =====================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// =====================
// 5. RATE LIMITING
// =====================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau!' }
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10,
  message: { error: 'Bạn đặt quá nhiều đơn, vui lòng thử lại sau 1 giờ!' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  message: { error: 'Sai mật khẩu quá nhiều lần, thử lại sau 15 phút!' }
});

// Áp dụng rate limit ← PHẢI SAU KHI ĐỊNH NGHĨA
app.use('/api/', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/auth', authLimiter);

// =====================
// 6. ROUTES
// =====================
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/menu',   require('./routes/menu'));

// =====================
// 7. HEALTH CHECK
// =====================
app.get('/', (req, res) => {
  res.json({
    message: '🍚 Cơm Tấm Mỹ Hạnh API đang chạy!',
    version: '1.0.0',
    time:    new Date().toISOString()
  });
});

// =====================
// 8. ERROR HANDLERS (luôn ở cuối)
// =====================
app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm thấy!' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: 'Có lỗi xảy ra, vui lòng thử lại!' });
});

// =====================
// 9. START SERVER (luôn ở cuối cùng)
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});