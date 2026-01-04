const { Pool } = require("pg");
require("dotenv").config();

// ✅ Use DATABASE_URL if available (Render), otherwise fallback to local env vars
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  database: process.env.DATABASE_URL ? undefined : process.env.DB_DATABASE,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  port: process.env.DATABASE_URL ? undefined : process.env.DB_PORT,

  // ✅ Render Postgres needs SSL in production
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// ✅ Test the connection on startup
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL database successfully!");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
  });

module.exports = pool;