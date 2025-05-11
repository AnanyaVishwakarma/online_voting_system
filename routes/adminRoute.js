import express from 'express';
import db from '../db/connections.js';
import crypto from 'crypto'; 

const router = express.Router();

// Admin Register
router.post('/register', (req, res) => {
    const { name, phone, government_id, password } = req.body;

    // Step 1: Check if Aadhaar (government_id) already exists
    db.query('SELECT * FROM admins WHERE government_id = ?', [government_id], (err, result) => {
        if (err) {
            console.error('Admin check error:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: 'Admin already registered with this Aadhaar.' });
        }

        // Step 2: Generate unique admin ID
const admin_id = `ADM${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

        // Step 3: Insert new admin
        const query = `
            INSERT INTO admins (admin_id, name, phone, government_id, password)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(query, [admin_id, name, phone, government_id, password], (err2) => {
            if (err2) {
                console.error('Register Error:', err2);
                return res.status(500).json({ message: 'Server error' });
            }

            return res.status(200).json({
                message: '✅ Registered successfully!',
                user_id: admin_id
            });
        });
    });
});

//Admin Login
router.post('/login', (req, res) => {
    const { admin_id, password } = req.body;
  
    db.query('SELECT * FROM admins WHERE admin_id = ? AND password = ?', [admin_id, password], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
  
      if (results.length > 0) {
        req.session.admin = admin_id;
        return res.status(200).json({ message: 'Login successful!', redirectTo: '/admin_dashboard.html' });
      } else {
        res.status(401).json({ message: 'Invalid admin ID or password' });
      }
    });
  });
  

export default router;


