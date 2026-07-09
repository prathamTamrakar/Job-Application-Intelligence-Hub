const Application = require('../models/Application');

// Helper to extract tech stack keywords from text
const extractKeywords = (text) => {
  if (!text) return [];
  const knownKeywords = [
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'java', 'python',
    'javascript', 'typescript', 'mongodb', 'postgresql', 'mysql', 'aws', 'docker', 'kubernetes',
    'graphql', 'rest', 'next.js', 'nuxt.js', 'flutter', 'react native', 'c++', 'c#', 'golang', 'rust',
    'php', 'laravel', 'cloud', 'devops', 'firebase', 'tailwind', 'sass', 'redux', 'nest.js',
    'machine learning', 'data science', 'ai', 'html', 'css', 'sql', 'nosql', 'fastapi'
  ];
  
  const cleanedText = text.toLowerCase();
  const found = new Set();
  
  knownKeywords.forEach(kw => {
    // Escape regex characters (e.g. next.js, c++)
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}(?:\\b|\\s|$)`, 'i');
    if (regex.test(cleanedText)) {
      // Standardize output name
      found.add(kw);
    }
  });
  
  return Array.from(found);
};

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private
const createApplication = async (req, res, next) => {
  try {
    const { company, role, jobLink, dateApplied, resumeVersion, status, notes } = req.body;

    if (!company || !role) {
      res.status(400);
      throw new Error('Please include company and role');
    }

    // Auto-extract keywords from role, company name, and initial notes
    const combinedText = `${role} ${company} ${notes || ''}`;
    const techStackKeywords = extractKeywords(combinedText);

    const application = await Application.create({
      userId: req.user.id,
      company,
      role,
      jobLink,
      dateApplied: dateApplied || undefined,
      resumeVersion: resumeVersion || 'Default',
      status: status || 'Applied',
      notes,
      techStackKeywords
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for the logged-in user
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res, next) => {
  try {
    const { status, search, resumeVersion, startDate, endDate } = req.query;
    
    // Base query: only fetch applications belonging to current user
    const query = { userId: req.user.id };

    // Apply status filter
    if (status) {
      query.status = status;
    }

    // Apply search filter (company, role, notes)
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply resume version filter
    if (resumeVersion) {
      query.resumeVersion = resumeVersion;
    }

    // Apply date range filter
    if (startDate || endDate) {
      query.dateApplied = {};
      if (startDate) {
        query.dateApplied.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateApplied.$lte = end;
      }
    }

    const applications = await Application.find(query).sort({ dateApplied: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Make sure user owns application
    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this application');
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = async (req, res, next) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to update this application');
    }

    const { company, role, jobLink, dateApplied, resumeVersion, status, notes, statusNotes, resumeVersionId, jobDescription } = req.body;

    // Check if status has changed
    const statusChanged = status && status !== application.status;

    // Build update object
    const updateData = {};
    if (company) updateData.company = company;
    if (role) updateData.role = role;
    if (jobLink !== undefined) updateData.jobLink = jobLink;
    if (dateApplied) updateData.dateApplied = dateApplied;
    if (resumeVersion) updateData.resumeVersion = resumeVersion;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (resumeVersionId !== undefined) updateData.resumeVersionId = resumeVersionId;
    if (jobDescription !== undefined) updateData.jobDescription = jobDescription;
    updateData.updatedAt = Date.now();

    // Re-extract keywords if company, role or notes change
    if (company || role || notes !== undefined) {
      const combinedText = `${role || application.role} ${company || application.company} ${notes !== undefined ? notes : application.notes}`;
      updateData.techStackKeywords = extractKeywords(combinedText);
    }

    // Perform update
    application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If status changed, push to history timeline
    if (statusChanged) {
      application.statusHistory.push({
        status: status,
        updatedAt: Date.now(),
        notes: statusNotes || `Status updated to ${status}`
      });
      await application.save();
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Check ownership
    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to delete this application');
    }

    await application.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark application reminder as followed up
// @route   PUT /api/applications/:id/followup
// @access  Private
const markFollowedUp = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Append to status history
    application.statusHistory.push({
      status: application.status,
      updatedAt: Date.now(),
      notes: 'Followed up with company'
    });

    application.updatedAt = Date.now();
    await application.save();

    // Import ReminderLog dynamically to avoid circular refs
    const ReminderLog = require('../models/ReminderLog');
    await ReminderLog.updateMany(
      { applicationId: application._id, status: 'Sent' },
      { $set: { status: 'Followed Up' } }
    );

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze match score between Resume and JD using Groq
// @route   POST /api/applications/:id/analyze-match
// @access  Private
const analyzeMatch = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this application');
    }

    if (!application.jobDescription) {
      res.status(400);
      throw new Error('Please save a job description for this application before running analysis.');
    }

    if (!application.resumeVersionId) {
      res.status(400);
      throw new Error('Please select a saved resume version for this application before running analysis.');
    }

    const ResumeVersion = require('../models/ResumeVersion');
    const resume = await ResumeVersion.findById(application.resumeVersionId);
    if (!resume) {
      res.status(404);
      throw new Error('Linked resume version not found');
    }

    // Check Groq Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_groq_api_key') || apiKey === '') {
      res.status(503);
      throw new Error('Groq API Key is not configured on the server. Please add GROQ_API_KEY to your .env file.');
    }

    // Initialize Groq SDK
    const { Groq } = require('groq-sdk');
    const groq = new Groq({ apiKey });

    const prompt = `You are an ATS and technical recruiter assistant. Compare the following resume against the job description.

RESUME:
${resume.text}

JOB DESCRIPTION:
${application.jobDescription}

Respond ONLY with valid JSON, no markdown formatting, no explanation outside the JSON, in exactly this shape:
{
  "matchScore": <integer 0-100>,
  "matchedKeywords": [<string>, ...],
  "missingKeywords": [<string>, ...],
  "suggestions": [<string>, ...]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const resultText = chatCompletion.choices[0].message.content;
    const result = JSON.parse(resultText);

    // Save to MatchAnalysis
    const MatchAnalysis = require('../models/MatchAnalysis');
    const analysis = await MatchAnalysis.findOneAndUpdate(
      { applicationId: application._id, resumeVersionId: resume._id },
      {
        matchScore: Number(result.matchScore) || 0,
        matchedKeywords: result.matchedKeywords || [],
        missingKeywords: result.missingKeywords || [],
        suggestions: result.suggestions || [],
        createdAt: Date.now()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match analysis details for an application
// @route   GET /api/applications/:id/analyze-match
// @access  Private
const getMatchAnalysis = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (application.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this application');
    }

    if (!application.resumeVersionId) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    const MatchAnalysis = require('../models/MatchAnalysis');
    const analysis = await MatchAnalysis.findOne({
      applicationId: application._id,
      resumeVersionId: application.resumeVersionId
    });

    res.status(200).json({
      success: true,
      data: analysis || null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  markFollowedUp,
  analyzeMatch,
  getMatchAnalysis
};
