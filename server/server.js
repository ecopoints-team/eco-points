require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRoutes = require('./src/routes/users');

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('EcoPoints Express Server Running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
