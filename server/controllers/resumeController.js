const ResumeVersion = require('../models/ResumeVersion');

// @desc    Create a new resume version
// @route   POST /api/resumes
// @access  Private
const createResume = async (req, res, next) => {
  try {
    const { name, text } = req.body;

    if (!name || !text) {
      res.status(400);
      throw new Error('Please include name and plain text content for the resume');
    }

    // Check if name already exists for this user
    const exists = await ResumeVersion.findOne({ userId: req.user.id, name });
    if (exists) {
      res.status(400);
      throw new Error('A resume version with this name already exists.');
    }

    const resume = await ResumeVersion.create({
      userId: req.user.id,
      name,
      text
    });

    res.status(201).json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all resume versions for the user
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res, next) => {
  try {
    const resumes = await ResumeVersion.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resume version details
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res, next) => {
  try {
    const resume = await ResumeVersion.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error('Resume version not found');
    }

    if (resume.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to access this resume');
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a resume version
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = async (req, res, next) => {
  try {
    let resume = await ResumeVersion.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error('Resume version not found');
    }

    if (resume.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to update this resume');
    }

    const { name, text } = req.body;
    
    if (name) resume.name = name;
    if (text) resume.text = text;

    await resume.save();

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a resume version
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res, next) => {
  try {
    const resume = await ResumeVersion.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error('Resume version not found');
    }

    if (resume.userId.toString() !== req.user.id) {
      res.status(401);
      throw new Error('Not authorized to delete this resume');
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run ad-hoc sandbox analysis on Resume + optional JD using Groq
// @route   POST /api/resumes/sandbox-analyze
// @access  Private
const analyzeSandbox = async (req, res, next) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText) {
      res.status(400);
      throw new Error('Please provide resume text content for analysis');
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

    let prompt = '';
    
    if (jobDescription && jobDescription.trim() !== '') {
      // Comparison Mode
      prompt = `You are a technical recruiter. Compare the following resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond ONLY with valid JSON, no markdown formatting, no explanation outside the JSON, in exactly this shape:
{
  "type": "match",
  "matchScore": <integer 0-100>,
  "matchedKeywords": [<string>, ...],
  "missingKeywords": [<string>, ...],
  "suggestions": [<string>, ...]
}`;
    } else {
      // Standalone Resume Audit Mode
      prompt = `You are an expert resume auditor and career coach. Review this technical resume.

RESUME:
${resumeText}

Respond ONLY with valid JSON, no markdown formatting, no explanation outside the JSON, in exactly this shape:
{
  "type": "audit",
  "score": <integer 0-100>,
  "techStack": [<string>, ...],
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "suggestions": [<string>, ...]
}`;
    }

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

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  analyzeSandbox
};
