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
  
    // Step 1: Check if Aadhaar (govt ID) already exists

    db.query('SELECT * FROM users WHERE government_id = ?', [government_id], (err, result) => {
        if (err) {
        console.error('Check Error:', err);
        return res.status(500).send('Server error');
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

router.post('/vote', async (req, res) => {
  if (!req.session.voter) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const voterId = req.session.voter.user_id;
  const { partyId } = req.body;

  try {
    // Prevent multiple votes
    const [check] = await db.query('SELECT has_voted FROM users WHERE user_id = ?', [voterId]);
    if (check[0].has_voted) {
      return res.status(400).json({ message: "You have already voted!" });
    }

    await db.query('INSERT INTO votes (voter_id, party_id) VALUES (?, ?)', [voterId, partyId]);
    await db.query('UPDATE users SET has_voted = 1 WHERE user_id = ?', [voterId]);

    res.status(200).json({ message: "Vote casted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while voting." });
  }
});

  
export default router;
