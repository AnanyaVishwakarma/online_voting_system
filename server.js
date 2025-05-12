import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import voterRoutes from './routes/votingRoute.js';
import adminRoutes from './routes/adminRoute.js';
import session from 'express-session';
import cors from 'cors';

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
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval' 'unsafe-inline'");
  next();
});

// ✅ Session Middleware
app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// ✅ Routes
app.use('/voter', voterRoutes);
app.use('/admin', adminRoutes);

// ✅ Auth-Guarded Dashboards
app.get('/admin/dashboard', (req, res) => {
  if (req.session.admin) {
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
  } else {
    res.redirect('/admin_login.html');
  }
});

app.get('/voter/dashboard', (req, res) => {
  if (req.session.voter) {
    res.sendFile(path.join(__dirname, 'public', 'voter_dashboard.html'));
  } else {
    res.redirect('/voter_login.html');
  }
});

// ✅ Root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
