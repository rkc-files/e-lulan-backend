// Import the PostgreSQL client and load environment variables
const { Pool } = require('pg');
require('dotenv').config();

// Create a new Pool instance using environment variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the connection when the module loads
pool.connect()
    .then(client => {
        console.log('✅ Connected to PostgreSQL database successfully!');
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
        console.error('❌ Database connection error:', err.stack);
        // You might want to exit the application if the DB connection is critical
    });

// Export the pool so other modules (like controllers) can run queries
module.exports = pool;