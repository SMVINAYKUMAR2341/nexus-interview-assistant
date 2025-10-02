const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure email transporter (update with your email service)
const createTransporter = () => {
  // For development, you can use ethereal email for testing
  // In production, use your actual email service (Gmail, SendGrid, etc.)
  
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Email templates
const emailTemplates = {
  shortlist: (candidateData) => ({
    subject: `🎉 Congratulations! You've been shortlisted - ${candidateData.position}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #58a6ff 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 12px 12px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 12px 12px;
          }
          .score-box {
            background: white;
            border-left: 4px solid #4ade80;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .score-value {
            font-size: 36px;
            font-weight: bold;
            color: #4ade80;
          }
          .next-steps {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .next-steps ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
          .emoji {
            font-size: 48px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="emoji">🎉</div>
          <h1 style="margin: 0;">Congratulations!</h1>
          <p style="margin: 10px 0 0 0;">You've been shortlisted</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${candidateData.name}</strong>,</p>
          
          <p>We are thrilled to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${candidateData.position}</strong> at ${candidateData.companyName}!</p>
          
          <div class="score-box">
            <h3 style="margin-top: 0; color: #333;">Your Interview Performance</h3>
            <div class="score-value">${candidateData.score}/100</div>
            <p style="color: #4ade80; font-weight: bold; margin: 10px 0 0 0;">✅ SHORTLISTED</p>
          </div>
          
          <p>Your performance in the technical interview was impressive, and we were particularly pleased with your:</p>
          <ul>
            <li>Technical expertise and problem-solving skills</li>
            <li>Clear communication and explanation of concepts</li>
            <li>Professional approach to the interview</li>
          </ul>
          
          <div class="next-steps">
            <h3 style="margin-top: 0; color: #333;">📋 Next Steps</h3>
            <ol>
              <li><strong>HR Round</strong> - Schedule will be shared within 2-3 business days</li>
              <li><strong>Final Technical Discussion</strong></li>
              <li><strong>Offer Discussion</strong> (if selected)</li>
            </ol>
          </div>
          
          <p>We will contact you shortly with further details about the next steps in our hiring process.</p>
          
          <p>Once again, congratulations on your excellent performance!</p>
          
          <p>Best regards,<br>
          <strong>Hiring Team</strong><br>
          ${candidateData.companyName}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} ${candidateData.companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${candidateData.name},

Congratulations! We are pleased to inform you that you have been shortlisted for the position of ${candidateData.position} at ${candidateData.companyName}.

Your Interview Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: ${candidateData.score}/100
Status: ✅ SHORTLISTED

Your performance in the technical interview was impressive, and we would like to proceed with the next steps in our hiring process.

Next Steps:
1. HR Round - Schedule will be shared within 2-3 business days
2. Final Technical Discussion
3. Offer Discussion

We will contact you shortly with further details.

Best regards,
Hiring Team
${candidateData.companyName}
    `
  }),

  rejection: (candidateData) => ({
    subject: `Interview Results - ${candidateData.position} at ${candidateData.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px 12px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 12px 12px;
          }
          .score-box {
            background: white;
            border-left: 4px solid #94a3b8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Interview Results</h1>
          <p style="margin: 10px 0 0 0;">${candidateData.position}</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${candidateData.name}</strong>,</p>
          
          <p>Thank you for taking the time to interview with us for the position of <strong>${candidateData.position}</strong> at ${candidateData.companyName}.</p>
          
          <div class="score-box">
            <h3 style="margin-top: 0; color: #333;">Your Interview Performance</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">Score: ${candidateData.score}/100</p>
          </div>
          
          <p>After careful consideration of all candidates, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.</p>
          
          <p>We want to thank you for your interest in ${candidateData.companyName} and the time you invested in the interview process. We were impressed with your enthusiasm and encourage you to apply for future positions that match your skills and experience.</p>
          
          <p>We wish you the best in your job search and future professional endeavors.</p>
          
          <p>Best regards,<br>
          <strong>Hiring Team</strong><br>
          ${candidateData.companyName}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} ${candidateData.companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${candidateData.name},

Thank you for taking the time to interview with us for the position of ${candidateData.position} at ${candidateData.companyName}.

Your Interview Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: ${candidateData.score}/100

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.

We truly appreciate your interest in ${candidateData.companyName} and encourage you to apply for future positions that match your skills and experience.

We wish you the best in your job search and future professional endeavors.

Best regards,
Hiring Team
${candidateData.companyName}
    `
  }),

  result: (candidateData) => ({
    subject: `Interview Results Published - ${candidateData.position}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #58a6ff 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 12px 12px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 12px 12px;
          }
          .button {
            display: inline-block;
            padding: 12px 32px;
            background: linear-gradient(135deg, #58a6ff 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Results Published</h1>
        </div>
        
        <div class="content">
          <p>Dear <strong>${candidateData.name}</strong>,</p>
          
          <p>Your interview results for the position of <strong>${candidateData.position}</strong> at ${candidateData.companyName} have been published.</p>
          
          <p><strong>Interview Score:</strong> ${candidateData.score}/100</p>
          
          <p>You can view your detailed results and feedback by logging into your candidate portal.</p>
          
          <div style="text-align: center;">
            <a href="#" class="button">View Detailed Results</a>
          </div>
          
          <p>Thank you for your time and interest in ${candidateData.companyName}.</p>
          
          <p>Best regards,<br>
          <strong>Hiring Team</strong><br>
          ${candidateData.companyName}</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} ${candidateData.companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${candidateData.name},

Your interview results for the position of ${candidateData.position} at ${candidateData.companyName} have been published.

Interview Score: ${candidateData.score}/100

You can view your detailed results and feedback by logging into your candidate portal.

Thank you for your time and interest in ${candidateData.companyName}.

Best regards,
Hiring Team
${candidateData.companyName}
    `
  })
};

// Send shortlist notification
router.post('/shortlist', async (req, res) => {
  try {
    const candidateData = req.body;
    const transporter = createTransporter();
    const emailContent = emailTemplates.shortlist(candidateData);

    const info = await transporter.sendMail({
      from: `"${candidateData.companyName} Hiring Team" <${process.env.EMAIL_USER}>`,
      to: candidateData.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log('Shortlist email sent:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Shortlist email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending shortlist email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send shortlist email',
      error: error.message 
    });
  }
});

// Send rejection notification
router.post('/rejection', async (req, res) => {
  try {
    const candidateData = req.body;
    const transporter = createTransporter();
    const emailContent = emailTemplates.rejection(candidateData);

    const info = await transporter.sendMail({
      from: `"${candidateData.companyName} Hiring Team" <${process.env.EMAIL_USER}>`,
      to: candidateData.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log('Rejection email sent:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Rejection email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending rejection email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send rejection email',
      error: error.message 
    });
  }
});

// Send custom result notification
router.post('/result', async (req, res) => {
  try {
    const candidateData = req.body;
    const transporter = createTransporter();
    const emailContent = emailTemplates.result(candidateData);

    const info = await transporter.sendMail({
      from: `"${candidateData.companyName} Hiring Team" <${process.env.EMAIL_USER}>`,
      to: candidateData.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    console.log('Result email sent:', info.messageId);
    res.json({ 
      success: true, 
      message: 'Result email sent successfully',
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Error sending result email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send result email',
      error: error.message 
    });
  }
});

module.exports = router;
