require('dotenv').config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path"); // Import path to resolve file paths

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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
