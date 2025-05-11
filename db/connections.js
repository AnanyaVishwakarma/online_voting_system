import mysql from "mysql2";

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "xxxxxx",  
  database: "online_voting"
});

const db = connection.promise();

// Optional: Test connection
db.query("SELECT 1")
  .then(() => {
    console.log("✅ DB Connected Successfully!");
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed!", err);
  });

export default db;
