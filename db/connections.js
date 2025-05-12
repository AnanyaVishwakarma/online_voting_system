import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '638716',
  database: 'online_voting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: Check connection (for debugging)
try {
  const conn = await pool.getConnection();
  console.log('✅ DB Connected Successfully!');
  conn.release();
} catch (err) {
  console.error('❌ DB Connection Failed! Error:', err);
}

export default pool;
