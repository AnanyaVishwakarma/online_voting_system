import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import voterRoutes from "./routes/votingRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db/connections.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware Order Matters — use these first
app.use(cors());
app.use(express.json()); // To parse JSON body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Serve static files AFTER middleware
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Content Security Policy (only if needed)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net");
  next();
});


// ✅ Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// ✅ Routes
app.use("/voter", voterRoutes);
app.use("/admin", adminRoutes);

app.get("/admin_register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin_register.html"));
});

// ✅ Auth-Guarded Dashboards
app.get("/admin/dashboard", (req, res) => {
  if (req.session.admin) {
    res.sendFile(path.join(__dirname, "public", "admin_dashboard.html"));
  } else {
    res.redirect("/admin_login.html");
  }
});

app.get("/voter/dashboard", (req, res) => {
  if (req.session.voter) {
    res.sendFile(path.join(__dirname, "public", "voter_dashboard.html"));
  } else {
    res.redirect("/voter_login.html");
  }
});

// ✅ Root page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
// Get Poll Question
app.post("/create_poll", async (req, res) => {
  const { question } = req.body;
  try {
    await db.query("UPDATE polls SET is_active=0 WHERE is_active=1");
    await db.query("INSERT INTO polls (question, is_active) VALUES (?, 1)", [
      question,
    ]);
    res.json({ message: "Poll created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating poll." });
  }
});

app.get("/get_poll_question", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT question FROM polls WHERE is_active=1 LIMIT 1"
    );
    res.json(result[0] || { question: "No active poll." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching poll question." });
  }
});

app.get("/get_poll_result", async (req, res) => {
  try {
    const [result] = await db.query(`
SELECT parties.party_name, COUNT(votes.id) AS votes
FROM parties
LEFT JOIN votes ON votes.party_id = parties.id
GROUP BY parties.party_name
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching poll result." });
  }
});
