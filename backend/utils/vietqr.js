// Tạo link QR VietQR - miễn phí, không cần đăng ký
function generateVietQR(amount, orderId) {
  const BANK_ID      = process.env.BANK_ID      || 'VCB';
  const ACCOUNT_NO   = process.env.ACCOUNT_NO   || '1234567890';
  const ACCOUNT_NAME = process.env.ACCOUNT_NAME || 'NGUYEN VAN A';

  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png` +
    `?amount=${amount}` +
    `&addInfo=${orderId}` +
    `&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return {
    qrUrl,
    bankId:      BANK_ID,
    accountNo:   ACCOUNT_NO,
    accountName: ACCOUNT_NAME,
    amount,
    content:     orderId
  };
}

module.exports = generateVietQR;