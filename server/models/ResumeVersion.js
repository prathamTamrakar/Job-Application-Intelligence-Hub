const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name for this resume version'],
    trim: true
  },
  text: {
    type: String,
    required: [true, 'Please include the plain text content of the resume']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure name uniqueness per user
resumeVersionSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
