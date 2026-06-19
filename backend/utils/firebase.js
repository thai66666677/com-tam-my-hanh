const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore }                 = require('firebase-admin/firestore');

let serviceAccount;

try {
  // Thử đọc từ biến JSON nguyên vẹn (cho Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Fallback: đọc từng biến riêng lẻ (cho local .env)
    serviceAccount = {
      type:                        process.env.FIREBASE_TYPE,
      project_id:                  process.env.FIREBASE_PROJECT_ID,
      private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email:                process.env.FIREBASE_CLIENT_EMAIL,
      client_id:                   process.env.FIREBASE_CLIENT_ID,
      auth_uri:                    'https://accounts.google.com/o/oauth2/auth',
      token_uri:                   'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:        `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };
  }
} catch (err) {
  console.error('❌ Lỗi parse Firebase credentials:', err.message);
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
module.exports = db;