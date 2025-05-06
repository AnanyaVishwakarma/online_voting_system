import express from 'express';
import db from '../db/connections.js';
import crypto from 'crypto'; 

const router = express.Router();

// Admin Register
router.post('/register', (req, res) => {
      console.log("Admin register route hit!");
      console.log("Request body", req.body);
    const { username, password } = req.body;
    const admin_id = 'ADM' + crypto.randomBytes(3).toString('hex'); 

    const query = 'INSERT INTO admins (admin_id, username, password) VALUES (?, ?, ?)';
    db.query(query, [admin_id, username, password], (err, result) => {
        if (err) {
            console.error('Register Error:', err);
            return res.status(500).send('Server error');
        }

        res.status(200).json({ message: 'Admin registered successfully!', admin_id });
    });
});

// Admin Login
router.post('/login', (req, res) => {
    const { admin_id, password } = req.body;

    db.query('SELECT * FROM admins WHERE admin_id = ? AND password = ?', [admin_id, password], (err, results) => {
        if (err) {
            console.error('Login Error:', err);
            return res.status(500).send('Server error');
        }
        if (results.length > 0) {
            req.session.admin = admin_id;
            res.redirect('/admin/dashboard');
        } else {
            res.send('Invalid admin ID or password');
        }
    });
});

export default router;

