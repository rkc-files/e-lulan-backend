// ✅ Load environment variables immediately
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ✅ Load PostgreSQL connection (optional test)
const pool = require("./db/db");

// ✅ Import Routes
const userRoutes = require("./routes/userRoutes");
const fleetRoutes = require("./routes/fleetRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ======================================================
    ✅ MIDDLEWARE
====================================================== */
app.use(express.json());

// ✅ Allow requests from both local + production frontend
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://e-lulan-system.web.app",
  "https://e-lulan-system.firebaseapp.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, curl

      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ======================================================
    ✅ ROUTES
====================================================== */

// ✅ Root check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "✅ e-lulan Backend API is running!" });
});

// ✅ Firebase Admin User Management Routes
app.use("/api/users", userRoutes);

// ✅ Fleet Bus Account Routes (Option A1)
app.use("/api/fleet", fleetRoutes);

/* ======================================================
    ✅ START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Access API: http://localhost:${PORT}`);
});
