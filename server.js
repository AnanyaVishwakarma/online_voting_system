import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import voterRoutes from './routes/votingRoute.js';
import adminRoutes from './routes/adminRoute.js';
import session from 'express-session';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// Session middleware
app.use(session({
    secret: 'super-secret-key', 
    resave: false,
    saveUninitialized: false,
}));
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
  


app.use('/voter', voterRoutes); 
app.use('/admin', adminRoutes);   

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});




