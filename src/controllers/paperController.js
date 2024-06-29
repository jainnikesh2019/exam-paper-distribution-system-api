// controllers/paperController.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdf-lib').PDFDocument;
const Paper = require('../models/Paper');
const { encryptFile, decryptFile } = require('../utils/encryption');
const logger = require('../utils/logger');

async function uploadPaper(req, res) {
  const { title, description } = req.body;
  const { path: filePath, originalname } = req.file; // Assuming file is uploaded via multer

  try {
    // Generate a unique filename based on timestamp and original filename
    const timestamp = Date.now();
    const encryptedFileName = `${timestamp}_${originalname}.enc`;

    // Define paths for uploaded and encrypted files
    const uploadPath = path.join(__dirname, '..', 'uploads', originalname);
    const encryptedFilePath = path.join(__dirname, '..', 'uploads', encryptedFileName);

    // Move the uploaded file to a dedicated upload folder
    fs.renameSync(filePath, uploadPath);

    // Encrypt the uploaded file
    const encryptionPassword = crypto.randomBytes(16).toString('hex'); // Generate encryption password
    await encryptFile(uploadPath, encryptedFilePath, encryptionPassword);

    // Remove the unencrypted file after encryption
    fs.unlinkSync(uploadPath);

    // Create a new paper instance with initial data
    const newPaper = new Paper({
      title,
      description,
      file: encryptedFileName,
      encryptionPassword,
    });

    // Save the paper to the database
    await newPaper.save();

    // Log the access attempt
    logger.info(`User '${req.user.username}' uploaded paper '${newPaper._id}'`);

    res.status(201).json({ message: 'Paper uploaded and encrypted successfully', paper: newPaper });
  } catch (error) {
    logger.error(`Error uploading paper: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function updatePaper(req, res) {
  const { paperId } = req.params;
  const { title, description } = req.body;

  try {
    // Find the paper by ID and update
    const updatedPaper = await Paper.findByIdAndUpdate(paperId, { title, description }, { new: true });

    if (!updatedPaper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Log the access attempt
    logger.info(`User '${req.user.username}' updated paper '${paperId}'`);

    res.json({ message: 'Paper updated successfully', paper: updatedPaper });
  } catch (error) {
    logger.error(`Error updating paper: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function getPaperById(req, res) {
  const { paperId } = req.params;

  try {
    // Find the paper by ID
    const paper = await Paper.findById(paperId);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Log the access attempt
    logger.info(`User '${req.user.username}' accessed paper '${paperId}'`);

    res.json({ paper });
  } catch (error) {
    logger.error(`Error getting paper by ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function distributePaper(req, res) {
  const { paperId, scheduledTime } = req.body;

  try {
    // Find the paper by ID
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Set examStartTime and examEndTime
    paper.examStartTime = scheduledTime; // Assuming scheduledTime is the exam start time
    paper.examEndTime = new Date(scheduledTime.getTime() + (2 * 60 * 60 * 1000)); // Example: Exam duration is 2 hours

    // Save the updated paper with exam times
    await paper.save();

    // Log the access attempt
    logger.info(`User '${req.user.username}' distributed paper '${paperId}'`);

    res.json({ message: 'Paper distributed successfully', paper });
  } catch (error) {
    logger.error(`Error distributing paper: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function logAccessAttempt(req, res) {
  const { paperId } = req.params;

  try {
    // Find the paper by ID
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Log the access attempt with user information
    logger.info(`User '${req.user.username}' logged access attempt to paper '${paperId}'`);

    res.json({ message: 'Access attempt logged successfully' });
  } catch (error) {
    logger.error(`Error logging access attempt: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

async function downloadPaper(req, res) {
  const { paperId } = req.params;

  try {
    // Find the paper by ID
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    // Check if it's within the examination period
    const currentTimestamp = Date.now();
    if (currentTimestamp < paper.examStartTime.getTime() || currentTimestamp > paper.examEndTime.getTime()) {
      return res.status(403).json({ message: 'Access to paper is not allowed outside examination period' });
    }

    // Example: Implement watermarking and time-limited access logic here
    // For simplicity, let's assume paper.file contains the encrypted file path
    const encryptedFilePath = path.join(__dirname, '..', 'uploads', paper.file);
    const decryptedFileName = `${paper.title}.pdf`; // Example: Decrypted file name

    // Decrypt the file using the stored encryption password
    const decryptedFilePath = path.join(__dirname, '..', 'temp', decryptedFileName); // Save decrypted file to a temporary location
    await decryptFile(encryptedFilePath, decryptedFilePath, paper.encryptionPassword);

    // Add watermark to the decrypted PDF
    const watermarkedFilePath = await addWatermark(decryptedFilePath, paper.title);

    // Set response headers for downloading the watermarked PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${decryptedFileName}`);
    fs.createReadStream(watermarkedFilePath).pipe(res);

    // Log the download activity for audit purposes
    logger.info(`User '${req.user.username}' downloaded paper '${paperId}'`);

    // Clean up the temporary files
    fs.unlinkSync(decryptedFilePath);
    fs.unlinkSync(watermarkedFilePath);

  } catch (error) {
    logger.error(`Error downloading paper: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

// Helper function to add watermark to PDF
async function addWatermark(inputFilePath, paperTitle) {
  const pdfDoc = await PDFDocument.load(fs.readFileSync(inputFilePath));
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = page.getFont().widthOfTextAtSize('Confidential', 50);
    const textHeight = page.getFont().heightAtSize(50);

    page.drawText('Confidential', {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: 50,
      opacity: 0.3,
      rotate: degreesToRadians(-45), // Example rotation
    });
  }

  const outputFilePath = path.join(__dirname, '..', 'temp', `${paperTitle}_watermarked.pdf`);
  await pdfDoc.save(fs.createWriteStream(outputFilePath));
  return outputFilePath;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  uploadPaper,
  updatePaper,
  getPaperById,
  distributePaper,
  logAccessAttempt,
  downloadPaper
};
