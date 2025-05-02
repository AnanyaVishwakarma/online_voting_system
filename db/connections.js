import mysql from 'mysql2';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '638716',
    database: 'online_voting'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
    } else {
        console.log('✅ Connected to MySQL Database!');
    }
});

export default db;
