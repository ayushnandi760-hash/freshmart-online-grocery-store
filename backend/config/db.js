// ============================================
// MySQL Database Connection Pool
// ============================================
// Creates a reusable connection pool using mysql2/promise.
// All controllers import this pool to run queries.
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'freshmart',

  // Pool configuration
  waitForConnections: true,
  connectionLimit:    10,       // max simultaneous connections
  queueLimit:         0,        // unlimited queue
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0
});

// Quick connectivity check (called on startup)
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully —', `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('   Make sure MySQL is running and your .env credentials are correct.');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
