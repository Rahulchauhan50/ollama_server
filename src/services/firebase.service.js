const admin = require('firebase-admin');
const { AppError } = require('../utils');

let initialized = false;

function initFirebase() {
  if (initialized) return;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    // We won't throw here; callers will handle missing config
    return;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (err) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
}

const FirebaseService = {
  init: () => initFirebase(),

  async verifyIdToken(idToken) {
    try {
      if (!initialized) initFirebase();
      if (!initialized) throw AppError.internal('Firebase service not configured');
      const decoded = await admin.auth().verifyIdToken(idToken);
      return decoded; // contains uid, email, name, picture, etc.
    } catch (error) {
      throw AppError.unauthorized('Invalid Firebase ID token', { error: error.message });
    }
  },
};

module.exports = FirebaseService;
