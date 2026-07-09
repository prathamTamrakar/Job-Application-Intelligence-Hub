const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Application = require('../models/Application');
const ReminderLog = require('../models/ReminderLog');

// Setup Nodemailer Transporter
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Check if it's set to dummy placeholders or empty
  if (!emailUser || !emailPass || emailUser.includes('example') || emailUser === '') {
    console.log('[Reminder Cron] SMTP credentials not configured. Running in Console Fallback Mode.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

// Main function to check for stale applications and send reminders
const checkStaleApplications = async () => {
  console.log('[Reminder Cron] Running stale applications scanner...');
  const logs = [];

  try {
    const users = await User.find({});
    
    for (const user of users) {
      const followUpDaysThreshold = user.settings?.followUpDays || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - followUpDaysThreshold);

      // Find applications in progress (Applied, OA, Interview) that haven't been updated since cutoff
      const staleApplications = await Application.find({
        userId: user._id,
        status: { $in: ['Applied', 'OA', 'Interview'] },
        updatedAt: { $lte: cutoffDate }
      });

      const itemsToRemind = [];

      for (const app of staleApplications) {
        // Avoid spamming: Check if a reminder was already sent for this status within the last 3 days
        const recentReminder = await ReminderLog.findOne({
          applicationId: app._id,
          status: 'Sent',
          createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        });

        if (!recentReminder) {
          itemsToRemind.push(app);
        }
      }

      if (itemsToRemind.length > 0) {
        console.log(`[Reminder Cron] User ${user.email} has ${itemsToRemind.length} stale applications.`);
        
        // Compile email message
        const digestListHTML = itemsToRemind.map(app => `
          <tr style="border-bottom: 1px solid #27272a;">
            <td style="padding: 12px; font-weight: bold; color: #ffffff;">${app.company}</td>
            <td style="padding: 12px; color: #d4d4d8;">${app.role}</td>
            <td style="padding: 12px; color: #a1a1aa;">${app.status}</td>
            <td style="padding: 12px; color: #a1a1aa;">${new Date(app.dateApplied).toLocaleDateString()}</td>
            <td style="padding: 12px; text-align: right;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #6366f1; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">View</a>
            </td>
          </tr>
        `).join('');

        const emailHTML = `
          <div style="background-color: #09090b; color: #f4f4f5; font-family: Arial, sans-serif; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #27272a;">
            <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="color: #6366f1; margin: 0; font-size: 24px;">JobIntel<span style="color: #ffffff;">Hub</span></h2>
              <p style="color: #a1a1aa; font-size: 14px; margin: 4px 0 0 0;">Stale Applications Follow-up Reminder</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.5; color: #e4e4e7;">
              Hello ${user.name},
            </p>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">
              The following job applications haven't received updates in over <b>${followUpDaysThreshold} days</b>. We recommend reaching out or checking portal statuses.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; text-align: left; background-color: #121214; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
              <thead>
                <tr style="background-color: #1c1c1f; color: #a1a1aa; border-bottom: 1px solid #27272a;">
                  <th style="padding: 12px;">Company</th>
                  <th style="padding: 12px;">Role</th>
                  <th style="padding: 12px;">Status</th>
                  <th style="padding: 12px;">Date Applied</th>
                  <th style="padding: 12px;"></th>
                </tr>
              </thead>
              <tbody>
                ${digestListHTML}
              </tbody>
            </table>
            
            <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; border-t: 1px solid #27272a; padding-top: 16px;">
              Job Application Intelligence Hub &bull; Automatically sent via Cron Engine.
            </p>
          </div>
        `;

        const transporter = getTransporter();

        if (transporter) {
          // Send real email
          try {
            await transporter.sendMail({
              from: `"JobIntelHub Reminders" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: `[Reminder] You have ${itemsToRemind.length} applications to follow up on`,
              html: emailHTML
            });
            console.log(`[Reminder Cron] Sent reminder email to ${user.email}`);
          } catch (mailError) {
            console.error(`[Reminder Cron] Failed to send email to ${user.email}: ${mailError.message}`);
          }
        } else {
          // Log to console if transporter is fallback
          console.log(`
========================================================================
[CONSOLE EMAIL FALLBACK]
TO: ${user.email}
SUBJECT: [Reminder] You have ${itemsToRemind.length} applications to follow up on
HTML BODY:
${emailHTML}
========================================================================
          `);
        }

        // Log reminders in DB
        for (const app of itemsToRemind) {
          const log = await ReminderLog.create({
            userId: user._id,
            applicationId: app._id,
            status: 'Sent',
            message: `Follow-up reminder sent for ${app.role} at ${app.company}.`
          });
          logs.push(log);
        }
      }
    }
  } catch (error) {
    console.error(`[Reminder Cron Error] ${error.message}`);
  }

  return logs;
};

// Scheduler running daily at 9:00 AM
const initScheduler = () => {
  cron.schedule('0 9 * * *', () => {
    checkStaleApplications();
  });
  console.log('[Reminder Cron] Scheduled Job registered successfully (Daily at 9:00 AM).');
};

// Manual trigger controller/router handler
const triggerManualCheck = async (req, res, next) => {
  try {
    const logs = await checkStaleApplications();
    res.status(200).json({
      success: true,
      message: 'Scanner triggered successfully.',
      logsCount: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initScheduler,
  triggerManualCheck
};
