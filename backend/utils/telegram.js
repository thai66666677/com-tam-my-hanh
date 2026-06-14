const axios = require('axios');

function formatPrice(price) {
  return price.toLocaleString('vi-VN') + 'đ';
}

async function sendTelegram(order) {
  const token  = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Nếu chưa cấu hình thì bỏ qua
  if (!token || token === 'your_bot_token_here') return;

  const itemsList = order.items
    .map(i => `  • ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join('\n');

  const message = `
🔔 *ĐƠN HÀNG MỚI!*

📋 Mã đơn: \`${order.id}\`
👤 Khách: ${order.customer.name}
📞 SĐT: ${order.customer.phone}
📍 Địa chỉ: ${order.customer.address || 'Không có'}
📝 Ghi chú: ${order.customer.note || 'Không có'}
💳 Thanh toán: ${order.payment === 'cod' ? 'Tiền mặt' : 'Chuyển khoản QR'}

🍽️ *Món đã đặt:*
${itemsList}

💰 *Tổng cộng: ${formatPrice(order.total)}*
⏰ ${new Date(order.createdAt).toLocaleString('vi-VN')}
  `.trim();

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id:    chatId,
    text:       message,
    parse_mode: 'Markdown'
  });
}

module.exports = sendTelegram;