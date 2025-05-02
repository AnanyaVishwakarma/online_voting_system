import express from 'express';
import db from '../db/connections.js';

const router = express.Router();

// Voter Login
router.post('/login', (req, res) => {
    const { user_id, password } = req.body;

    const query = 'SELECT * FROM users WHERE user_id = ? AND password = ?';
    db.query(query, [user_id, password], (err, results) => {
        if (err) return res.status(500).send('Server error');

        if (results.length > 0) {
            req.session.voter = user_id;
            res.redirect('/voter_dashboard.html');
        } else {
            res.status(401).send('Invalid User ID or Password');
        }
    });
});


// Voter Register
  router.post('/register', (req, res) => {
    const { name, government_id, password } = req.body;
  
    db.query('SELECT COUNT(*) AS count FROM users', (err, result) => {
      if (err) {
        console.error('User ID count error:', err);
        return res.status(500).send('Error generating user ID');
      }
  
      const index = result[0].count + 1;
      const user_id = generateUserId(index);
  
      const insertQuery = 'INSERT INTO users (user_id, name, government_id, password) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [user_id, name, government_id, password], (err2) => {
        if (err2) {
          console.error('Insert error:', err2);
          return res.status(500).send('Registration failed');
        }
  
        res.json({ message: 'Registered successfully', userId: user_id });
      });
    });
  });
  
export default router;
