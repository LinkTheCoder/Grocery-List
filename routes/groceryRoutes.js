const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth'); // Updated path

const router = express.Router();

// Get all grocery items
router.get('/', authenticateToken, async (req, res) => {
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
router.post('/', authenticateToken, async (req, res) => {
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
router.put('/:id', authenticateToken, async (req, res) => {
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
router.delete('/:id', authenticateToken, async (req, res) => {
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

module.exports = router;
