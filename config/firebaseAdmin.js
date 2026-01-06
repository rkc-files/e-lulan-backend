const admin = require("firebase-admin");
require("dotenv").config();

let serviceAccount;

// ✅ Prefer Render environment variable (best practice)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Loaded Firebase service account from environment variable.");
  } catch (err) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON:", err.message);
  }
} else {
  // ✅ Local fallback: Use serviceAccountKey.json (ignored by Git)
  try {
    serviceAccount = require("./serviceAccountKey.json"); // ✅ FIXED PATH
    console.log("✅ Loaded Firebase service account from local JSON file.");
  } catch (err) {
    console.warn("⚠️ No Firebase service account provided (env var or JSON file missing).");
  }
}

// ✅ Initialize Firebase Admin once only
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized.");
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };