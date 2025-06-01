import express from "express";
import bcrypt from "bcrypt";
const router = express.Router();
import db from "../db/connections.js";

// 🔐 ADMIN REGISTER
router.post("/register", async (req, res) => {
  const { name, phone, government_id, password } = req.body;
  try {
    const [existing] = await db.query(
      "SELECT * FROM admins WHERE government_id = ?",
      [government_id]
    );
    if (existing.length)
      return res
        .status(400)
        .json({ message: "Admin already exists with this ID." });

    const hashed = await bcrypt.hash(password, 10);
    const admin_id = `ADM${String(Math.floor(Math.random() * 1000)).padStart(
      3,
      "0"
    )}`;
    await db.query(
      "INSERT INTO admins (admin_id, name, phone, government_id, password) VALUES (?, ?, ?, ?, ?)",
      [admin_id, name, phone, government_id, hashed]
    );
    res.json({ message: "✅ Registration successful!", user_id: admin_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔑 ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { admin_id, password } = req.body;
  try {
    const [admins] = await db.query("SELECT * FROM admins WHERE admin_id = ?", [
      admin_id,
    ]);
    if (!admins.length)
      return res.status(400).json({ message: "Admin not found." });
    const admin = admins[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: "Invalid password." });

    req.session.admin = { id: admin.admin_id, name: admin.name };
    res.json({ redirectTo: "/admin/dashboard" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔐 CREATE POLL (with options)
router.post("/create_poll_with_candidates", async (req, res) => {
  const { question, expires_at, created_by, candidates } = req.body;
  console.log("Received data:", req.body); // 👀 Log incoming data

  if (!question || !created_by || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // 👑 Step 1️⃣ Purane poll ko deactivate karo
    await db.query("UPDATE polls SET is_active = 0 WHERE is_active = 1");
    console.log("Old active poll deactivated.");

    // 👑 Step 2️⃣ Naya poll create karo (with active status)
    const [pollResult] = await db.query(
      "INSERT INTO polls (question, expires_at, created_by, is_active) VALUES (?, ?, ?, 1)",
      [question, expires_at, created_by]
    );
    const pollId = pollResult.insertId;
    console.log("Poll created with ID:", pollId);

    // 👑 Step 3️⃣ Candidates insert karo
    for (const candidate of candidates) {
      const { name, symbol } = candidate;
      if (!name || !symbol) {
        console.warn("Skipping invalid candidate:", candidate);
        continue;
      }
      const party_id = "P" + Math.floor(1000 + Math.random() * 9000);
      await db.query(
        "INSERT INTO parties (party_name, party_symbol, party_id, poll_id) VALUES (?, ?, ?, ?)",
        [name, symbol, party_id, pollId]
      );
      console.log(`Candidate inserted: ${name}, Symbol: ${symbol}`);
    }

    res.status(200).json({ message: "Poll with candidates created successfully." });
  } catch (error) {
    console.error("🔥 Error creating poll with candidates:", error); // 👀 Log detailed error
    res.status(500).json({ message: "Failed to create poll with candidates.", error: error.message });
  }
});

router.get('/get_poll_result', async (req, res) => {
  try {
    // 🌟 Active poll ka ID fetch karo
    const [activePoll] = await db.query("SELECT id FROM polls WHERE is_active = 1 LIMIT 1");

    if (activePoll.length === 0) {
      return res.status(404).json({ message: "No active poll found." });
    }

    const pollId = activePoll[0].id;

    // 🔥 Fetch vote count for each party in this poll
    const [result] = await db.query(`
      SELECT p.party_name, p.party_symbol, COUNT(v.id) as votes
      FROM parties p
      LEFT JOIN votes v ON p.id = v.party_id
      WHERE p.poll_id = ?
      GROUP BY p.id, p.party_name, p.party_symbol
    `, [pollId]);

    res.status(200).json(result);

  } catch (error) {
    console.error("🔥 Error fetching poll result:", error);
    res.status(500).json({ message: "Failed to fetch poll result.", error: error.message });
  }
});

export default router;
