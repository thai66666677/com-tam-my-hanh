const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore }                 = require('firebase-admin/firestore');

if (!getApps().length) {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // Render: decode từ base64
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64'
    ).toString('utf8');
    serviceAccount = JSON.parse(json);
    console.log('✅ Firebase: dùng base64 credential');

  } else {
    // Local: đọc từng biến trong .env
    serviceAccount = {
      type:           process.env.FIREBASE_TYPE,
      project_id:     process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key:    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email:   process.env.FIREBASE_CLIENT_EMAIL,
      client_id:      process.env.FIREBASE_CLIENT_ID,
    };
    console.log('✅ Firebase: dùng biến riêng lẻ');
  }

  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
module.exports = db;