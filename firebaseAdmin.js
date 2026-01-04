const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

// ✅ Load service account from ENV or JSON file
// Option 1: Use serviceAccountKey.json (recommended)
const serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };