// ✅ Load environment variables immediately
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// ✅ Load PostgreSQL connection (tests connection on startup)
const pool = require("./db/db");

// ✅ Import Firebase Admin routes
const userRoutes = require("./routes/userRoutes");

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
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman or server-side requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
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

/* ======================================================
    ✅ START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Access API: http://localhost:${PORT}`);
});