require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

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

// Root route to check if the server is running
app.get('/', (req, res) => {
  res.send('Grocery List API is running 🚀');
});

// Get all grocery items, ordered by the updated_at timestamp
app.get('/grocery', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grocery ORDER BY updated_at DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groceries:', err);
    res.status(500).send('Server error');
  }
});

// Create a new grocery item
app.post('/grocery', async (req, res) => {
  const { item_name, quantity } = req.body;

  if (!item_name || !quantity) {
    return res.status(400).send('Item name and quantity are required');
  }

  try {
    const result = await pool.query(
      'INSERT INTO grocery (item_name, quantity, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING *',
      [item_name, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding grocery item:', err);
    res.status(500).send('Server error');
  }
});

// Update an existing grocery item
app.put('/grocery/:id', async (req, res) => {
  const { id } = req.params;
  const { item_name, quantity } = req.body;

  if (!item_name || !quantity) {
    return res.status(400).send('Item name and quantity are required');
  }

  try {
    const result = await pool.query(
      'UPDATE grocery SET item_name = $1, quantity = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [item_name, quantity, id]
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
app.delete('/grocery/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM grocery WHERE id = $1 RETURNING *', [id]);

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
