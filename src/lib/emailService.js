// Email Service for Interview Results
// Handles sending notifications to candidates

const BACKEND_URL = 'http://localhost:5001';

/**
 * Send shortlist notification email to candidate
 * @param {Object} candidate - Candidate data
 * @param {number} score - Final interview score
 * @returns {Promise<Object>} Email send result
 */
export const sendShortlistEmail = async (candidate, score) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/shortlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        score: score,
        position: candidate.role || 'Full Stack Developer',
        companyName: 'Crisp Technologies',
        interviewDate: candidate.interviewDate || new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send shortlist email');
    }

    const data = await response.json();
    return { success: true, message: 'Shortlist email sent successfully', data };
  } catch (error) {
    console.error('Error sending shortlist email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send rejection notification email to candidate
 * @param {Object} candidate - Candidate data
 * @param {number} score - Final interview score
 * @returns {Promise<Object>} Email send result
 */
export const sendRejectionEmail = async (candidate, score) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/rejection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        score: score,
        position: candidate.role || 'Full Stack Developer',
        companyName: 'Crisp Technologies',
        interviewDate: candidate.interviewDate || new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send rejection email');
    }

    const data = await response.json();
    return { success: true, message: 'Rejection email sent successfully', data };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send custom result email to candidate
 * @param {Object} candidate - Candidate data
 * @param {Object} resultData - Result details
 * @returns {Promise<Object>} Email send result
 */
export const sendResultEmail = async (candidate, resultData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: candidate.id,
        name: candidate.name,
        email: candidate.email,
        score: candidate.finalScore,
        position: candidate.role || 'Full Stack Developer',
        companyName: 'Crisp Technologies',
        resultData: resultData,
        publishedAt: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send result email');
    }

    const data = await response.json();
    return { success: true, message: 'Result email sent successfully', data };
  } catch (error) {
    console.error('Error sending result email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Batch send results to multiple candidates
 * @param {Array} candidates - Array of candidate objects
 * @param {Object} options - Batch send options
 * @returns {Promise<Object>} Batch send result
 */
export const batchSendResults = async (candidates, options = {}) => {
  try {
    const results = {
      total: candidates.length,
      shortlisted: 0,
      rejected: 0,
      success: [],
      failed: []
    };

    for (const candidate of candidates) {
      const score = candidate.finalScore || 0;
      
      try {
        if (score >= 60) {
          // Send shortlist email
          const result = await sendShortlistEmail(candidate, score);
          if (result.success) {
            results.shortlisted++;
            results.success.push({ id: candidate.id, name: candidate.name, status: 'shortlisted' });
          } else {
            results.failed.push({ id: candidate.id, name: candidate.name, error: result.message });
          }
        } else if (options.sendRejections) {
          // Send rejection email
          const result = await sendRejectionEmail(candidate, score);
          if (result.success) {
            results.rejected++;
            results.success.push({ id: candidate.id, name: candidate.name, status: 'rejected' });
          } else {
            results.failed.push({ id: candidate.id, name: candidate.name, error: result.message });
          }
        }
      } catch (error) {
        results.failed.push({ id: candidate.id, name: candidate.name, error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error in batch send:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get email template for preview
 * @param {string} type - Email type (shortlist/rejection/result)
 * @param {Object} candidate - Candidate data
 * @returns {Object} Email template
 */
export const getEmailTemplate = (type, candidate) => {
  const templates = {
    shortlist: {
      subject: `🎉 Congratulations! You've been shortlisted - ${candidate.role || 'Position'}`,
      preview: `Dear ${candidate.name},

Congratulations! We are pleased to inform you that you have been shortlisted for the position of ${candidate.role || 'Full Stack Developer'} at Crisp Technologies.

Your Interview Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: ${candidate.finalScore}/100
Status: ✅ SHORTLISTED

Your performance in the technical interview was impressive, and we would like to proceed with the next steps in our hiring process.

Next Steps:
1. HR Round - Schedule will be shared soon
2. Final Technical Round
3. Offer Discussion

We will contact you within 2-3 business days with further details.

Best regards,
Hiring Team
Crisp Technologies`
    },
    rejection: {
      subject: `Interview Results - ${candidate.role || 'Position'} at Crisp Technologies`,
      preview: `Dear ${candidate.name},

Thank you for taking the time to interview with us for the position of ${candidate.role || 'Full Stack Developer'} at Crisp Technologies.

Your Interview Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: ${candidate.finalScore}/100

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.

We truly appreciate your interest in Crisp Technologies and encourage you to apply for future positions that match your skills and experience.

We wish you the best in your job search and future professional endeavors.

Best regards,
Hiring Team
Crisp Technologies`
    },
    result: {
      subject: `Interview Results Published - ${candidate.role || 'Position'}`,
      preview: `Dear ${candidate.name},

Your interview results for the position of ${candidate.role || 'Full Stack Developer'} at Crisp Technologies have been published.

You can view your detailed results and feedback by logging into your candidate portal.

Interview Score: ${candidate.finalScore}/100

Thank you for your time and interest in Crisp Technologies.

Best regards,
Hiring Team
Crisp Technologies`
    }
  };

  return templates[type] || templates.result;
};

export default {
  sendShortlistEmail,
  sendRejectionEmail,
  sendResultEmail,
  batchSendResults,
  getEmailTemplate
};
