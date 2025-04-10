require('dotenv').config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = 3000;

// PostgreSQL connection details
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.use(express.json());

// Root route — just to test if it's running
app.get("/", (req, res) => {
  res.send("Grocery List API is running 🚀");
});

// Get all grocery items
app.get("/grocery", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grocery ORDER BY created_at DESC");
    res.json(result.rows);  // Sends all grocery items as JSON
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Create a new grocery item
app.post("/grocery", async (req, res) => {
  const { item_name, quantity } = req.body;

  if (!item_name || !quantity) return res.status(400).send("Item name and quantity are required");

  try {
    const result = await pool.query(
      "INSERT INTO grocery (item_name, quantity) VALUES ($1, $2) RETURNING *",
      [item_name, quantity]
    );
    res.status(201).json(result.rows[0]);  // Send the newly created item as response
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
