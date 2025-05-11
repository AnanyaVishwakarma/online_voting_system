import express from "express";
import db from "../db/connections.js";

const router = express.Router();

router.post("/register", (req, res) => {
  const {name, phone, government_id, password } = req.body;

  // Step 1: Check if Aadhaar (govt ID) already exists
  db.query(
    "SELECT * FROM users WHERE government_id = ?",
    [government_id],
    (err, result) => {
      if (err) {
        console.error("Check Error:", err);
        return res.status(500).json("Server error");
      }

      if (result.length > 0) {
        return res.status(400).json({ message: "You are already registered." });
      }

      // Step 2: Generate unique user_id
      db.query("SELECT COUNT(*) AS count FROM users", (err2, result2) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res
            .status(500)
            .json({ message: "Registration failed", error: err2.message });
        }

        const index = result2[0].count + 1;
        const user_id = `U${String(index).padStart(3, "0")}`;

        // Step 3: Insert new user
        console.log("Form Data Received:", req.body);
const insertQuery = "INSERT INTO users (name, phone, government_id, password, user_id) VALUES (?, ?, ?, ?, ?)";
db.query(insertQuery, [name, phone, government_id, password, user_id], (err3) => {
  if (err3) {
    console.error("Insert error:", err3);
    return res.status(500).json({ message: "Registration failed" });
  }

  return res.status(200).json({
    message: "Registered successfully!",
    userId: user_id,
  });
});

      });
    }
  );
});

// Voter Login
router.post('/login', async (req, res) => {
  const { user_id, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE user_id = ? AND password = ?',
      [user_id, password]
    );

    if (rows.length > 0) {
      req.session.voter = rows[0]; // Save to session
      return res.json({ message: "Login successful!", userId: rows[0].user_id });
    } else {
      return res.status(401).json({ message: "Invalid User ID or Password" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
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

