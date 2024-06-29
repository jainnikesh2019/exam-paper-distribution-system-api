// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Example route to get all users (restricted to admin role)
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field from response
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example route to get a specific user by ID (restricted to admin role)
router.get('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password'); // Exclude password field from response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example route to delete a user by ID (restricted to admin role)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
