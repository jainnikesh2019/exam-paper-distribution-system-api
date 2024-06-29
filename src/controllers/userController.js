// controllers/userController.js

const User = require('../models/User');

// Get all users
async function getUsers(req, res) {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create new user
async function createUser(req, res) {
  const { username, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const newUser = new User({ username, password, role });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete user by ID
async function deleteUser(req, res) {
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
}

module.exports = {
  getUsers,
  createUser,
  deleteUser
};
