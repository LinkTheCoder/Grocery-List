require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const groceryRoutes = require('./routes/groceryRoutes');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route to check if the server is running
app.get('/', (req, res) => {
  res.send('Grocery List API is running 🚀');
});

// Use routes
app.use('/user', userRoutes); 
app.use('/grocery', groceryRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});