const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Ghosted'],
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Please add a role/position title'],
    trim: true
  },
  jobLink: {
    type: String,
    trim: true
  },
  dateApplied: {
    type: Date,
    default: Date.now
  },
  resumeVersion: {
    type: String,
    trim: true,
    default: 'Default'
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion'
  },
  jobDescription: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Ghosted'],
    default: 'Applied'
  },
  notes: {
    type: String,
    default: ''
  },
  statusHistory: [statusHistorySchema],
  techStackKeywords: [
    {
      type: String,
      trim: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: auto-populate status history on initial creation
applicationSchema.pre('save', function(next) {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: this.dateApplied || Date.now(),
      notes: this.notes || 'Initial application logged'
    });
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
