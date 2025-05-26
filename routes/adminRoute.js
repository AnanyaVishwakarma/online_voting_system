import express from "express";
import bcrypt from "bcrypt";
const router = express.Router();

import db from "../db/connections.js";

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
// 1️⃣ LOGIN REQUEST WITH admin_id, password, phone
router.post('/login', async (req, res) => {
  const { admin_id, phone, otp } = req.body;

  try {
    const [adminRows] = await db.query('SELECT * FROM admins WHERE admin_id = ? AND phone = ?', [admin_id, phone]);
    if (adminRows.length === 0) {
      return res.status(400).json({ message: "Admin not found with provided credentials." });
    }

    if (!otp) {
      // Step 1: OTP send karna (fake OTP for now)
      const generatedOtp = '1234'; // In real, generate random OTP and send via SMS
      await db.query('UPDATE admins SET otp = ? WHERE admin_id = ?', [generatedOtp, admin_id]);
      return res.status(200).json({ step: "otp_sent", message: "OTP sent to your phone." });
    } else {
      // Step 2: OTP verify karna
      const [otpRows] = await db.query('SELECT * FROM admins WHERE admin_id = ? AND otp = ?', [admin_id, otp]);
      if (otpRows.length === 0) {
        return res.status(400).json({ message: "Invalid OTP." });
      }
      // OTP sahi - session me set karo
      req.session.admin = admin_id;
      await db.query('UPDATE admins SET otp = NULL WHERE admin_id = ?', [admin_id]);
      return res.status(200).json({ redirectTo: '/admin/dashboard' });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});
export default router;
