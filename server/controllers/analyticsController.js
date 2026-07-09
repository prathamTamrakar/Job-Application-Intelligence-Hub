const mongoose = require('mongoose');
const Application = require('../models/Application');

// @desc    Get aggregated analytics data
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has any applications
    const totalAppsCount = await Application.countDocuments({ userId });
    
    if (totalAppsCount === 0) {
      return res.status(200).json({
        success: true,
        isRealData: false,
        message: 'No application data found. Log applications to populate analytics.'
      });
    }

    // 1. Resume Success Rates Grouping
    const resumeStats = await Application.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$resumeVersion',
          total: { $sum: 1 },
          callbacks: {
            $sum: {
              $cond: [
                { $in: ['$status', ['OA', 'Interview', 'Offer']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          applications: '$total',
          rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$callbacks', '$total'] }, 100] }, 1] }
            ]
          }
        }
      },
      { $sort: { applications: -1 } }
    ]);

    // 2. Tech Stack Keyword Performance
    const keywordStats = await Application.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$techStackKeywords' },
      {
        $group: {
          _id: '$techStackKeywords',
          total: { $sum: 1 },
          callbacks: {
            $sum: {
              $cond: [
                { $in: ['$status', ['OA', 'Interview', 'Offer']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          applications: '$total',
          rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$callbacks', '$total'] }, 100] }, 1] }
            ]
          }
        }
      },
      { $sort: { rate: -1, total: -1 } },
      { $limit: 8 }
    ]);

    // 3. Funnel Stages Analysis
    const oaCount = await Application.countDocuments({
      userId,
      $or: [
        { status: { $in: ['OA', 'Interview', 'Offer'] } },
        { 'statusHistory.status': 'OA' }
      ]
    });

    const interviewCount = await Application.countDocuments({
      userId,
      $or: [
        { status: { $in: ['Interview', 'Offer'] } },
        { 'statusHistory.status': 'Interview' }
      ]
    });

    const offerCount = await Application.countDocuments({
      userId,
      $or: [
        { status: 'Offer' },
        { 'statusHistory.status': 'Offer' }
      ]
    });

    const funnelData = [
      { stage: 'Applied', count: totalAppsCount, percentage: 100 },
      { stage: 'OA Recd', count: oaCount, percentage: totalAppsCount > 0 ? Math.round((oaCount / totalAppsCount) * 100) : 0 },
      { stage: 'Interview', count: interviewCount, percentage: totalAppsCount > 0 ? Math.round((interviewCount / totalAppsCount) * 100) : 0 },
      { stage: 'Offer', count: offerCount, percentage: totalAppsCount > 0 ? Math.round((offerCount / totalAppsCount) * 100) : 0 }
    ];

    // 4. Time-to-Response Trends Calculation
    const callbackApps = await Application.find({
      userId,
      $or: [
        { status: { $in: ['OA', 'Interview', 'Offer'] } },
        { 'statusHistory.status': { $in: ['OA', 'Interview', 'Offer'] } }
      ]
    });

    const responseTimes = [];
    callbackApps.forEach(app => {
      const sortedHistory = [...app.statusHistory].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      const appliedItem = sortedHistory.find(h => h.status === 'Applied') || sortedHistory[0];
      const callbackItem = sortedHistory.find(h => ['OA', 'Interview', 'Offer'].includes(h.status));

      if (appliedItem && callbackItem) {
        const diffTime = Math.abs(new Date(callbackItem.updatedAt) - new Date(appliedItem.updatedAt));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        responseTimes.push({
          date: app.dateApplied || app.createdAt,
          days: diffDays
        });
      }
    });

    // Group response times by month for line chart trends
    const monthlyGroups = {};
    responseTimes.forEach(rt => {
      const dateObj = new Date(rt.date);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyGroups[monthName]) {
        monthlyGroups[monthName] = { totalDays: 0, count: 0 };
      }
      monthlyGroups[monthName].totalDays += rt.days;
      monthlyGroups[monthName].count += 1;
    });

    const trendData = Object.keys(monthlyGroups).map(month => ({
      week: month,
      days: Math.round((monthlyGroups[month].totalDays / monthlyGroups[month].count) * 10) / 10
    }));

    // Calculate averages for dashboard cards
    const averageResponseDays = responseTimes.length > 0
      ? Math.round((responseTimes.reduce((acc, curr) => acc + curr.days, 0) / responseTimes.length) * 10) / 10
      : 0;

    // Find top performing resume
    const topResume = resumeStats.length > 0
      ? resumeStats.reduce((prev, current) => (prev.rate > current.rate ? prev : current))
      : null;

    // Find top performing stack keyword
    const topKeyword = keywordStats.length > 0
      ? keywordStats[0]
      : null;

    // 5. Match Analysis Aggregations
    const MatchAnalysis = require('../models/MatchAnalysis');
    
    // Average Match Score by Resume Version
    const resumeMatchScores = await MatchAnalysis.aggregate([
      {
        $lookup: {
          from: 'resumeversions',
          localField: 'resumeVersionId',
          foreignField: '_id',
          as: 'resume'
        }
      },
      { $unwind: '$resume' },
      { $match: { 'resume.userId': new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$resumeVersionId',
          name: { $first: '$resume.name' },
          avgScore: { $avg: '$matchScore' }
        }
      },
      {
        $project: {
          name: 1,
          avgScore: { $round: ['$avgScore', 1] }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    // Correlation between Match Score and Callback Rate
    const allAnalyses = await MatchAnalysis.find().populate({
      path: 'applicationId',
      match: { userId: userId }
    });
    
    const userAnalyses = allAnalyses.filter(a => a.applicationId !== null);
    
    let highMatchCount = 0;
    let highMatchCallbacks = 0;
    let lowMatchCount = 0;
    let lowMatchCallbacks = 0;
    
    userAnalyses.forEach(analysis => {
      const app = analysis.applicationId;
      if (!app) return; // safety check
      const isCallback = ['OA', 'Interview', 'Offer'].includes(app.status) || 
                         app.statusHistory.some(h => ['OA', 'Interview', 'Offer'].includes(h.status));
                          
      if (analysis.matchScore >= 75) {
        highMatchCount++;
        if (isCallback) highMatchCallbacks++;
      } else {
        lowMatchCount++;
        if (isCallback) lowMatchCallbacks++;
      }
    });
    
    const correlation = {
      highMatchRate: highMatchCount > 0 ? Math.round((highMatchCallbacks / highMatchCount) * 100) : 0,
      lowMatchRate: lowMatchCount > 0 ? Math.round((lowMatchCallbacks / lowMatchCount) * 100) : 0,
      highCount: highMatchCount,
      lowCount: lowMatchCount
    };

    res.status(200).json({
      success: true,
      isRealData: true,
      data: {
        resumeStats,
        keywordStats,
        funnelData,
        trendData,
        resumeMatchScores,
        correlation,
        summary: {
          averageResponseDays,
          topResume: topResume ? topResume.name : 'N/A',
          topResumeRate: topResume ? topResume.rate : 0,
          topKeyword: topKeyword ? topKeyword.name : 'N/A',
          topKeywordRate: topKeyword ? topKeyword.rate : 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
