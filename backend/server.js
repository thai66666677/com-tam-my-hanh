const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/menu',   require('./routes/menu'));

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.json({ 
    message: '🍚 Cơm Tấm Mỹ Hạnh API đang chạy!',
    version: '1.0.0'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});