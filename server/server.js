const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Reminder Cron Job
const { initScheduler } = require('./jobs/reminderCron');
initScheduler();

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Route mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));

// Root path indicator
app.get('/', (req, res) => {
  res.send('Job Application Intelligence Hub API is running...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
