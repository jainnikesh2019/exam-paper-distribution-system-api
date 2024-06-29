// models/Paper.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paperSchema = new Schema({
  title: { type: String, required: true },
  file: { type: String, required: true },  // Store file path
  uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  encryptionKey: { type: String, required: true },  // Store encryption key
  encryptionIV: { type: String, required: true },   // Store initialization vector
  version: { type: Number, default: 1 },
  access: {
    type: Map,
    of: { type: Boolean },
    default: {}
  },
  distribution: {
    start: { type: Date },
    end: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paper', paperSchema);
