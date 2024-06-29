// utils/encryption.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const algorithm = 'aes-256-cbc';

function encryptFile(inputPath, outputPath, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(cipher).pipe(output);
}

function decryptFile(inputPath, outputPath, key, iv) {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(decipher).pipe(output);
}

module.exports = {
  encryptFile,
  decryptFile
};
