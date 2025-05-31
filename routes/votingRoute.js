import express from "express";
import bcrypt from "bcrypt"; // 🧂 Add bcrypt for encryption
import db from "../db/connections.js";

const router = express.Router();

// 📝 Voter Registration
router.post("/register", async (req, res) => {
  const { name, phone, government_id, password } = req.body;

  try {
    // Step 1: Check if Aadhaar (govt ID) already exists
    const [existing] = await db.query(
      "SELECT * FROM users WHERE government_id = ?",
      [government_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "You are already registered." });
    }

    // Step 2: Generate unique user_id
    const [countResult] = await db.query("SELECT COUNT(*) AS count FROM users");
    const index = countResult[0].count + 1;
    const user_id = `U${String(index).padStart(3, "0")}`;

    // 🌸 Step 3: Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Insert new user with hashed password
    console.log("Form Data Received:", req.body);
    const insertQuery =
      "INSERT INTO users (name, phone, government_id, password, user_id) VALUES (?, ?, ?, ?, ?)";
    await db.query(insertQuery, [
      name,
      phone,
      government_id,
      hashedPassword,
      user_id,
    ]);

    return res.status(200).json({
      message: "Registered successfully!",
      userId: user_id,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

// 🗝️ Voter Login
router.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      user_id,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid User ID or Password" });
    }

    const user = rows[0];

    // 🔒 Compare the password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid User ID or Password" });
    }

    // 🎉 Password match, login success
    req.session.voter = user; // Save to session
    return res.json({ message: "Login successful!", userId: user.user_id });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 🗳️ Cast Vote
router.post("/vote", async (req, res) => {
  if (!req.session.voter) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const voterId = req.session.voter.user_id;
  const { partyId } = req.body;

  if (!partyId) {
    return res.status(400).json({ message: "Party ID is missing" });
  }

  try {
    const [check] = await db.query(
      "SELECT has_voted FROM users WHERE user_id = ?",
      [voterId]
    );
    if (!check.length) {
      return res.status(400).json({ message: "Voter not found" });
    }
    if (check[0].has_voted) {
      return res.status(400).json({ message: "You have already voted!" });
    }

    await db.query("INSERT INTO votes (voter_id, party_id) VALUES (?, ?)", [
      voterId,
      partyId,
    ]);
    await db.query("UPDATE users SET has_voted = 1 WHERE user_id = ?", [
      voterId,
    ]);
    await db.query(
      "UPDATE parties SET vote_count = vote_count + 1 WHERE id = ?",
      [partyId]
    );

    res.status(200).json({ message: "Vote casted successfully" });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ message: "Server error while voting." });
  }
});

// 🏛️ Add this route to your existing Express router (voterRouter.js or wherever your voter code is)
router.get("/get_poll_question", async (req, res) => {
  try {
    // Fetch active poll question
    const [pollResult] = await db.query(
      "SELECT id, question FROM polls WHERE is_active = 1 LIMIT 1"
    );

    // If poll found, extract question and poll id
    let question = "No active poll at the moment.";
    let pollId = null;
    if (pollResult.length > 0) {
      question = pollResult[0].question;
      pollId = pollResult[0].id;
    } else {
  question = "No active poll at the moment.";
}

    // Fetch candidates from parties
    const [candidatesResult] = await db.query(
      "SELECT id, party_name, party_symbol FROM parties"
    );

    const candidates = candidatesResult.map((candidate) => ({
  id: candidate.id,
  party_name: candidate.party_name,
  party_symbol: candidate.party_symbol,
}));


res.status(200).json({ question, candidates, pollId });
  } catch (err) {
    console.error("Poll fetch error:", err);
    res.status(500).json({ message: "Failed to fetch poll question" });
  }
});

export default router;
