const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Upload paper route (admin and examiner)
router.post('/upload', authenticateToken, authorizeRoles(['admin', 'examiner']), paperController.uploadPaper);

// Update paper route (admin and examiner)
router.put('/update/:paperId', authenticateToken, authorizeRoles(['admin', 'examiner']), paperController.updatePaper);

// Get paper by ID route (admin, examiner, and invigilator)
router.get('/:paperId', authenticateToken, authorizeRoles(['admin', 'examiner', 'invigilator']), paperController.getPaperById);

// Distribute paper route (admin and examiner)
router.put('/distribute', authenticateToken, authorizeRoles(['admin', 'examiner']), paperController.distributePaper);

// Log access attempt route (admin, examiner, and invigilator)
router.post('/log/:paperId', authenticateToken, authorizeRoles(['admin', 'examiner', 'invigilator']), paperController.logAccessAttempt);

// Download paper route (admin, examiner, and invigilator)
router.get('/download/:paperId', authenticateToken, authorizeRoles(['admin', 'examiner', 'invigilator']), paperController.downloadPaper);

module.exports = router;
