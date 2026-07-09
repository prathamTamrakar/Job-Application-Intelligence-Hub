const mongoose = require('mongoose');

const matchAnalysisSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    required: true
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  matchedKeywords: [
    {
      type: String,
      trim: true
    }
  ],
  missingKeywords: [
    {
      type: String,
      trim: true
    }
  ],
  suggestions: [
    {
      type: String,
      trim: true
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cache one analysis per application + resume version combination
matchAnalysisSchema.index({ applicationId: 1, resumeVersionId: 1 }, { unique: true });

module.exports = mongoose.model('MatchAnalysis', matchAnalysisSchema);
