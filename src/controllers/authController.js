// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// User login
async function login(req, res) {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ message: 'User is not activated yet' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Register new user (only accessible by admin)
async function register(req, res) {
  const { username, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role, active: false });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Activate user (admin only)
async function activateUser(req, res) {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.active = true;
    await user.save();

    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Assign role to user (admin only)
async function assignRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Role assigned successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  register,
  activateUser,
  assignRole,
  login
};
