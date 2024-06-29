const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MONGODB_URI, PORT } = require('./config/config');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/paper', require('./routes/paperRoutes'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected');
  
    // Optional: Test database access (perform a simple query)
    // Example: fetching all users
    const User = require('./models/User');
    User.find()
      .then(users => {
        console.log(`Fetched ${users.length} users from MongoDB`);
      })
      .catch(err => console.error('Error fetching users:', err));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Start the server
const port = PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));


