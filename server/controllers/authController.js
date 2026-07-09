const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      settings: req.user.settings || { followUpDays: 7 }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const { followUpDays } = req.body;

    if (followUpDays === undefined || isNaN(followUpDays)) {
      res.status(400);
      throw new Error('Please provide valid follow-up days');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.settings = {
      ...user.settings,
      followUpDays: Number(followUpDays)
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        settings: user.settings
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateSettings
};
