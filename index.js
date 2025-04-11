require('dotenv').config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path"); // Import path to resolve file paths
const cors = require('cors'); // Import cors package

const app = express();
const port = 3000;

app.use(cors());

// PostgreSQL connection details
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Root route — just to test if it's running
app.get("/", (req, res) => {
  res.send("Grocery List API is running 🚀");
});

// Get all grocery items from the database
app.get("/grocery", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grocery ORDER BY created_at DESC");
    res.json(result.rows);  // Sends all grocery items as JSON
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Create a new grocery item (removed price)
app.post("/grocery", async (req, res) => {
  const { name, quantity } = req.body;  // Removed price from the request body

  if (!name || !quantity) {
    return res.status(400).send("Name and quantity are required");
  }

  try {
    const result = await pool.query(
      "INSERT INTO grocery (name, quantity, created_at) VALUES ($1, $2, NOW()) RETURNING *", // Removed price from the insert query
      [name, quantity]
    );
    res.status(201).json(result.rows[0]);  // Send back the newly created grocery item
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Update a grocery item (removed price)
app.put("/grocery/:id", async (req, res) => {
  const { id } = req.params;
  const { name, quantity } = req.body; // Removed price from the request body

  if (!name || !quantity) {
    return res.status(400).send("Name and quantity are required");
  }

  try {
    const result = await pool.query(
      "UPDATE grocery SET name = $1, quantity = $2, updated_at = NOW() WHERE id = $3 RETURNING *", // Removed price from the update query
      [name, quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Grocery item not found");
    }

    res.json(result.rows[0]);  // Send back the updated grocery item
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Delete a grocery item
app.delete("/grocery/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM grocery WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Grocery item not found");
    }

    res.status(204).send();  // No content to send back after deletion
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
