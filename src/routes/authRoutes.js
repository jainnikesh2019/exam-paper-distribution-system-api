// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public registration route (accessible only to admin)
router.post('/register', authenticateToken, authorizeRoles(['admin']), authController.register);

// Admin endpoint to activate a user
router.put('/activate/:userId', authenticateToken, authorizeRoles(['admin']), authController.activateUser);

// Admin endpoint to assign a role to a user
router.put('/assign-role/:userId', authenticateToken, authorizeRoles(['admin']), authController.assignRole);

// Login route
router.post('/login', authController.login);

module.exports = router;
