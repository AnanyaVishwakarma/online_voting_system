import express from 'express';
const router = express.Router();

import db from '../db/connections.js';

// 🔐 ADMIN REGISTER
router.post('/register', async (req, res) => {
  const { name, phone, government_id, password } = req.body;

  try {
    // Step 1: Check if Aadhaar (government_id) already exists
    const [existingAdmin] = await db.query(
      'SELECT * FROM admins WHERE government_id = ?',
      [government_id]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: 'Admin already registered with this Aadhaar.' });
    }

    // Step 2: Generate unique admin ID
    const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const admin_id = `ADM${randomDigits}`;

    // Step 3: Insert new admin
    const insertQuery = `
      INSERT INTO admins (admin_id, name, phone, government_id, password)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(insertQuery, [admin_id, name, phone, government_id, password]);

    return res.status(200).json({
      message: '✅ Registered successfully!',
      user_id: admin_id
    });

  } catch (err) {
    console.error('Admin Registration Error:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message
    });
  }
});

// 🔑 ADMIN LOGIN
router.post('/login', async (req, res) => {
  const { admin_id, password } = req.body;

  try {
    const [results] = await db.query(
      'SELECT * FROM admins WHERE admin_id = ? AND password = ?',
      [admin_id, password]
    );

    if (results.length > 0) {
      req.session.admin = admin_id;
      console.log("Form Data Received:", req.body);
      return res.status(200).json({
        message: 'Login successful!',
        redirectTo: '/admin_dashboard.html'
      });
    } else {
      return res.status(401).json({ message: 'Invalid admin ID or password' });
    }

  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message
    });
  }
});

export default router;
