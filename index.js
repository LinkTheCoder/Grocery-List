require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
}

// Root route to check if the server is running
app.get('/', (req, res) => {
  res.send('Grocery List API is running 🚀');
});

// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Username and password are required');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Server error');
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Username and password are required');

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Server error');
  }
});

// Get all grocery items, ordered by the updated_at timestamp
app.get('/grocery', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM grocery WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groceries:', err);
    res.status(500).send('Server error');
  }
});

// Create a new grocery item
app.post('/grocery', authenticateToken, async (req, res) => {
  const { item_name, quantity } = req.body;
  if (!item_name || !quantity) return res.status(400).send('Item name and quantity are required');

  try {
    const result = await pool.query(
      'INSERT INTO grocery (item_name, quantity, user_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [item_name, quantity, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding grocery item:', err);
    res.status(500).send('Server error');
  }
});

// Update an existing grocery item
app.put('/grocery/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { item_name, quantity } = req.body;

  if (!item_name || !quantity) {
    return res.status(400).send('Item name and quantity are required');
  }

  try {
    const result = await pool.query(
      'UPDATE grocery SET item_name = $1, quantity = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *',
      [item_name, quantity, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Grocery item not found');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating grocery item:', err);
    res.status(500).send('Server error');
  }
});

// Delete a grocery item
app.delete('/grocery/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM grocery WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Grocery item not found');
    }

    res.status(204).send(); // No content to send back
  } catch (err) {
    console.error('Error deleting grocery item:', err);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
