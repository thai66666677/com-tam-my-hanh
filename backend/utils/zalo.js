const axios = require('axios');

function formatPrice(price) {
  return price.toLocaleString('vi-VN') + 'đ';
}

async function sendZaloNotification(order) {
  const token  = process.env.ZALO_OA_TOKEN;
  const userId = process.env.ZALO_OWNER_ID;

  // Nếu chưa cấu hình Zalo thì bỏ qua
  if (!token || token === 'your_oa_access_token') {
    console.log('⚠️  Zalo chưa cấu hình, bỏ qua');
    return;
  }

  const itemsList = order.items
    .map(i => `  • ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join('\n');

  const message =
    `🔔 ĐƠN HÀNG MỚI!\n` +
    `──────────────────\n` +
    `📋 Mã đơn: ${order.id}\n` +
    `👤 Khách: ${order.customer.name}\n` +
    `📞 SĐT: ${order.customer.phone}\n` +
    `📍 Địa chỉ: ${order.customer.address || 'Không có'}\n` +
    `📝 Ghi chú: ${order.customer.note || 'Không có'}\n` +
    `💳 Thanh toán: ${order.payment === 'cod' ? 'Tiền mặt' : 'Chuyển khoản QR'}\n` +
    `──────────────────\n` +
    `🍽️ Món đặt:\n${itemsList}\n` +
    `──────────────────\n` +
    `💰 Tổng: ${formatPrice(order.total)}\n` +
    `⏰ ${new Date(order.createdAt).toLocaleString('vi-VN')}`;

  try {
    await axios.post(
      'https://openapi.zalo.me/v2.0/oa/message',
      {
        recipient: { user_id: userId },
        message:   { text: message }
      },
      {
        headers: {
          'access_token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Gửi Zalo thành công!');
  } catch (err) {
    console.log('⚠️ Zalo lỗi (không ảnh hưởng đơn hàng):', err.message);
  }
}

module.exports = { sendZaloNotification };